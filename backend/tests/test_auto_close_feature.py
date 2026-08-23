import uuid
from unittest.mock import MagicMock, patch

from app.models import ComplaintStatus, WorkOrderStatus
from app.services.complaint_service import ComplaintService
from app.services.officer_service import OfficerService
from app.tasks.complaint_task import auto_close_complaint



def test_auto_close_task_delegates_to_complaint_service():
    complaint_id = str(uuid.uuid4())

    with patch(
        "app.tasks.complaint_task.ComplaintService.auto_close_complaint",
        return_value={"success": True},
    ) as service:
        result = auto_close_complaint.run(complaint_id)

    assert result == {"success": True}
    service.assert_called_once_with(complaint_id)


@patch("app.services.complaint_service.ComplaintRepository")
def test_auto_close_returns_not_found_when_complaint_is_missing(
    complaint_repository,
):
    complaint_repository.get_by_id.return_value = None

    result = ComplaintService.auto_close_complaint("missing-id")

    assert result == {
        "success": False,
        "message": "Complaint not found.",
    }


@patch("app.services.complaint_service.ComplaintRepository")
def test_auto_close_does_nothing_when_complaint_is_not_resolved(
    complaint_repository,
):
    complaint = MagicMock()
    complaint.status = ComplaintStatus.CLOSED
    complaint_repository.get_by_id.return_value = complaint

    result = ComplaintService.auto_close_complaint("complaint-id")

    assert result == {
        "success": True,
        "message": "Complaint is no longer resolved.",
    }


@patch("app.services.complaint_service.WorkOrderRepository")
@patch("app.services.complaint_service.ComplaintRepository")
def test_auto_close_returns_error_when_work_order_is_missing(
    complaint_repository,
    work_order_repository,
):
    complaint = MagicMock()
    complaint.status = ComplaintStatus.RESOLVED
    complaint.tender.id = 10

    complaint_repository.get_by_id.return_value = complaint
    work_order_repository.get_by_tender_id.return_value = None

    result = ComplaintService.auto_close_complaint("complaint-id")

    assert result == {
        "success": False,
        "message": "Work order not found.",
    }


@patch("app.services.complaint_service.ComplaintAssignmentRepository")
@patch("app.services.complaint_service.WorkOrderRepository")
@patch("app.services.complaint_service.ComplaintRepository")
def test_auto_close_returns_error_when_assignment_is_missing(
    complaint_repository,
    work_order_repository,
    assignment_repository,
):
    complaint = MagicMock()
    complaint.status = ComplaintStatus.RESOLVED
    complaint.tender.id = 10

    complaint_repository.get_by_id.return_value = complaint
    work_order_repository.get_by_tender_id.return_value = MagicMock()
    assignment_repository.get_by_complaint_id.return_value = None

    result = ComplaintService.auto_close_complaint("complaint-id")

    assert result == {
        "success": False,
        "message": "Complaint assignment not found.",
    }


@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.NotificationService")
@patch("app.services.complaint_service.ActivityService")
@patch("app.services.complaint_service.AgencyRepository")
@patch("app.services.complaint_service.OfficerRepository")
@patch("app.services.complaint_service.ComplaintAssignmentRepository")
@patch("app.services.complaint_service.WorkOrderRepository")
@patch("app.services.complaint_service.ComplaintRepository")
def test_auto_close_closes_resolved_complaint_and_work_order(
    complaint_repository,
    work_order_repository,
    assignment_repository,
    officer_repository,
    agency_repository,
    activity_service,
    notification_service,
    user_repository,
):
    complaint_id = uuid.uuid4()
    officer_id = uuid.uuid4()
    agency_id = uuid.uuid4()

    complaint = MagicMock(
        id=complaint_id,
        title="Dangerous pothole",
        citizen_id=uuid.uuid4(),
    )
    complaint.status = ComplaintStatus.RESOLVED
    complaint.tender.id = 10

    work_order = MagicMock(agency_id=agency_id)
    work_order.status = WorkOrderStatus.VERIFIED

    assignment = MagicMock(officer_id=officer_id)
    officer = MagicMock(current_workload=2)
    agency = MagicMock(current_projects=1)
    admin = MagicMock(id=uuid.uuid4())

    complaint_repository.get_by_id.return_value = complaint
    work_order_repository.get_by_tender_id.return_value = work_order
    assignment_repository.get_by_complaint_id.return_value = assignment
    officer_repository.get_by_user_id.return_value = officer
    agency_repository.get_by_user_id.return_value = agency
    user_repository.get_all.return_value = [admin]

    result = ComplaintService.auto_close_complaint(complaint_id)

    assert result["success"] is True
    assert result["message"] == "Complaint automatically closed."
    assert result["complaint_id"] == str(complaint_id)

    assert complaint.status == ComplaintStatus.CLOSED
    assert work_order.status == WorkOrderStatus.CLOSED
    assert officer.current_workload == 1
    assert agency.current_projects == 0

    activity_service.record.assert_called_once()
    notification_service.create_notification.assert_called()
    complaint_repository.update.assert_called_once()

@patch("app.services.officer_service.User")
@patch("app.services.officer_service.NotificationService")
@patch("app.services.officer_service.auto_close_complaint.apply_async")
@patch("app.services.officer_service.db.session.commit")
@patch("app.services.officer_service.ActivityService.record")
@patch("app.services.officer_service.ComplaintService.notify_cluster_citizens")
@patch(
    "app.services.officer_service.ComplaintAssignmentRepository"
    ".get_by_officer_and_complaint"
)
@patch("app.services.officer_service.WorkOrderRepository.get_by_id")
@patch("app.services.officer_service.OfficerRepository.get_by_user_id")
def test_verify_work_order_schedules_auto_close(
    officer_repository,
    work_order_repository,
    assignment_repository,
    notify_cluster_citizens,
    activity_record,
    commit,
    schedule_auto_close,
    notification_service,
    user_model,
    app,
):
    officer_id = uuid.uuid4()
    complaint_id = uuid.uuid4()

    officer = MagicMock(user_id=officer_id)

    complaint = MagicMock(
        id=complaint_id,
        citizen_id=uuid.uuid4(),
        title="Pothole near bus stop",
    )
    complaint.status = ComplaintStatus.WORK_IN_PROGRESS

    tender = MagicMock(
        complaint_id=complaint_id,
        complaint=complaint,
    )

    work_order = MagicMock(
        tender=tender,
        completion_proof_url="https://example.com/proof.jpg",
    )
    work_order.status = WorkOrderStatus.COMPLETED

    assignment = MagicMock(
        officer_id=officer_id,
        complaint=complaint,
    )

    admin = MagicMock(id=uuid.uuid4())

    officer_repository.return_value = officer
    work_order_repository.return_value = work_order
    assignment_repository.return_value = assignment
    user_model.query.filter_by.return_value.first.return_value = admin

    with app.app_context():
        app.config["COMPLAINT_AUTO_CLOSE_SECONDS"] = 30

        OfficerService.verify_work_order(
            officer_id,
            1,
        )

    assert work_order.status == WorkOrderStatus.VERIFIED
    assert complaint.status == ComplaintStatus.RESOLVED

    schedule_auto_close.assert_called_once_with(
        args=[str(complaint_id)],
        countdown=30,
    )

    commit.assert_called_once()
    activity_record.assert_called_once()
    notify_cluster_citizens.assert_called_once()