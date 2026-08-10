"""Business-rule unit tests for M4 complaint lifecycle and officer allocation."""
from unittest.mock import MagicMock, patch

import pytest

from app.models import AssignmentStatus, ComplaintStatus, UserRole, WorkOrderStatus
from app.services.complaint_service import ComplaintService
from app.services.officer_service import OfficerService


@patch("app.services.complaint_service.ComplaintRepository")
def test_public_complaints_service_returns_all(repo):
    repo.get_all.return_value = []
    assert ComplaintService.get_public_complaints() == []


@patch("app.services.complaint_service.ComplaintRepository")
def test_public_complaint_service_rejects_missing(repo):
    repo.get_by_id.return_value = None
    with pytest.raises(ValueError, match="Complaint not found"):
        ComplaintService.get_public_complaint("missing")


@patch("app.services.complaint_service.db.session")
@patch("app.services.complaint_service.ActivityService.record")
@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.get_jwt_identity", return_value="officer-1")
def test_add_remark_service_records_activity(identity, complaints, activity, session):
    complaint = MagicMock()
    complaints.get_by_id.return_value = complaint
    assert ComplaintService.add_remark("c1", "Checked site") is complaint
    activity.assert_called_once_with("c1", "Checked site", user_id="officer-1")
    session.commit.assert_called_once()


@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.get_jwt_identity", return_value="officer-1")
def test_add_remark_service_rejects_missing_complaint(identity, complaints):
    complaints.get_by_id.return_value = None
    with pytest.raises(ValueError, match="Complaint not found"):
        ComplaintService.add_remark("c1", "Checked")


@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity", return_value="citizen-1")
def test_delete_complaint_rejects_wrong_owner(identity, users, complaints):
    users.get_by_id.return_value = MagicMock(id="citizen-1")
    complaints.get_by_id.return_value = MagicMock(citizen_id="other", status=ComplaintStatus.SUBMITTED)
    with pytest.raises(PermissionError, match="not authorized"):
        ComplaintService.delete_complaint("c1")


@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity", return_value="citizen-1")
def test_delete_complaint_rejects_non_submitted_status(identity, users, complaints):
    users.get_by_id.return_value = MagicMock(id="citizen-1")
    complaints.get_by_id.return_value = MagicMock(citizen_id="citizen-1", status=ComplaintStatus.RESOLVED)
    with pytest.raises(ValueError, match="Only submitted"):
        ComplaintService.delete_complaint("c1")


@patch("app.services.complaint_service.NotificationService.create_notification")
@patch("app.services.complaint_service.ComplaintAssignmentRepository")
@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity", return_value="citizen-1")
@patch("app.services.complaint_service.ActivityService.record")
def test_reopen_complaint_success(activity, identity, users, complaints, assignments, notification):
    citizen = MagicMock(id="citizen-1")
    complaint = MagicMock(id="c1", citizen_id="citizen-1", status=ComplaintStatus.RESOLVED, title="Pothole")
    users.get_by_id.return_value = citizen
    complaints.get_by_id.return_value = complaint
    assignments.get_by_complaint_id.return_value = MagicMock(officer_id="officer-1")
    assert ComplaintService.reopen_complaint("c1", {"reason": "Still damaged"}) is complaint
    assert complaint.status == ComplaintStatus.REOPENED
    notification.assert_called_once()


@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.get_jwt_identity", return_value="citizen-1")
def test_reopen_complaint_rejects_non_resolved_status(identity, users, complaints):
    users.get_by_id.return_value = MagicMock(id="citizen-1")
    complaints.get_by_id.return_value = MagicMock(citizen_id="citizen-1", status=ComplaintStatus.SUBMITTED)
    with pytest.raises(ValueError, match="Only resolved"):
        ComplaintService.reopen_complaint("c1", {"reason": "x"})


@patch("app.services.complaint_service.NotificationService.create_notification")
@patch("app.services.complaint_service.ComplaintRepository")
@patch("app.services.complaint_service.UserRepository")
@patch("app.services.complaint_service.AgencyRepository")
@patch("app.services.complaint_service.OfficerRepository")
@patch("app.services.complaint_service.ComplaintAssignmentRepository")
@patch("app.services.complaint_service.WorkOrderRepository")
@patch("app.services.complaint_service.ActivityService.record")
def test_close_complaint_success(activity, work_orders, assignments, officers, agencies, users, complaints, notification):
    user = MagicMock(id="citizen-1")
    complaint = MagicMock(id="c1", citizen_id="citizen-1", status=ComplaintStatus.RESOLVED, title="Pothole")
    complaint.tender.id = 3
    users.get_by_id.return_value = user
    users.get_all.return_value = []
    complaints.get_by_id.return_value = complaint
    assignment = MagicMock(officer_id="officer-1")
    assignments.get_by_complaint_id.return_value = assignment
    work_orders.get_by_tender_id.return_value = MagicMock(agency_id="agency-1", status=WorkOrderStatus.COMPLETED)
    officers.get_by_user_id.return_value = MagicMock(current_workload=1)
    agencies.get_by_user_id.return_value = MagicMock(current_projects=1)
    assert ComplaintService.close_complaint("citizen-1", "c1") is complaint
    assert complaint.status == ComplaintStatus.CLOSED
    assert notification.call_count == 3


@patch("app.services.officer_service.OfficerRepository")
def test_officer_dashboard_rejects_missing_officer(repo):
    repo.get_by_user_id.return_value = None
    with pytest.raises(ValueError, match="Officer not found"):
        OfficerService.get_my_department_dashboard("missing")


@patch("app.services.officer_service.OfficerRepository")
def test_allot_complaint_requires_department_head(repo):
    repo.get_by_user_id.return_value = MagicMock(is_department_head=False)
    with pytest.raises(PermissionError, match="department head"):
        OfficerService.allot_complaint("officer", "c1", {"officer_id": "other"})


@patch("app.services.officer_service.ComplaintRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_allot_complaint_rejects_other_department(officers, complaints):
    officers.get_by_user_id.return_value = MagicMock(is_department_head=True, department_id=1)
    complaints.get_by_id.return_value = MagicMock(department_id=2)
    with pytest.raises(PermissionError, match="own department"):
        OfficerService.allot_complaint("head", "c1", {"officer_id": "other"})
