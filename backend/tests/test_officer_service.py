"""Unit tests for app.services.officer_service."""
from unittest.mock import MagicMock, patch
import pytest
from app.models import AssignmentStatus, ComplaintStatus, ReviewDecision, TenderStatus
from app.services.officer_service import OfficerService

def officer(): return MagicMock(user_id="officer-1", current_workload=0)
def assignment(status=AssignmentStatus.PENDING, complaint_status=ComplaintStatus.UNDER_REVIEW):
    return MagicMock(status=status, complaint=MagicMock(id="complaint-1", status=complaint_status))

@patch("app.services.officer_service.OfficerRepository")
def test_get_my_complaints_rejects_unknown_officer(mock_officers):
    mock_officers.get_by_user_id.return_value = None
    with pytest.raises(ValueError, match="Officer not found"):
        OfficerService.get_my_complaints("missing")

@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_get_my_complaints_success(mock_officers, mock_assignments):
    mock_officers.get_by_user_id.return_value = officer(); mock_assignments.get_by_officer_id.return_value = [MagicMock()]
    assert len(OfficerService.get_my_complaints("officer-1")) == 1

@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_accept_assignment_success(mock_officers, mock_assignments):
    o, a = officer(), assignment(); mock_officers.get_by_user_id.return_value=o; mock_assignments.get_by_officer_and_complaint.return_value=a
    with patch("app.services.officer_service.User") as mock_users, patch("app.services.officer_service.NotificationService.create_notification"), patch("app.services.officer_service.ActivityService.record"):
        mock_users.query.filter_by.return_value.first.return_value = MagicMock(id="admin-1")
        result=OfficerService.accept_assignment("officer-1","complaint-1")
    assert result == a and a.status == AssignmentStatus.ACCEPTED and a.complaint.status == ComplaintStatus.UNDER_REVIEW and o.current_workload == 0
    mock_assignments.update.assert_called_once()

@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_accept_assignment_requires_pending_status(mock_officers, mock_assignments):
    mock_officers.get_by_user_id.return_value=officer(); mock_assignments.get_by_officer_and_complaint.return_value=assignment(AssignmentStatus.REJECTED)
    with pytest.raises(ValueError, match="Only pending"):
        OfficerService.accept_assignment("officer-1","complaint-1")

@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_reject_assignment_success(mock_officers, mock_assignments):
    mock_officers.get_by_user_id.return_value=officer(); a=assignment(); mock_assignments.get_by_officer_and_complaint.return_value=a
    with patch("app.services.officer_service.User") as mock_users, patch("app.services.officer_service.NotificationService.create_notification"), patch("app.services.officer_service.ActivityService.record"):
        mock_users.query.filter_by.return_value.first.return_value = MagicMock(id="admin-1")
        OfficerService.reject_assignment("officer-1","complaint-1")
    assert a.status == AssignmentStatus.REJECTED


@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_reject_assignment_requires_pending_status(mock_officers, mock_assignments):
    mock_officers.get_by_user_id.return_value=officer(); mock_assignments.get_by_officer_and_complaint.return_value=assignment(AssignmentStatus.ACCEPTED)
    with pytest.raises(ValueError, match="Only pending"):
        OfficerService.reject_assignment("officer-1", "complaint-1")

@patch("app.services.officer_service.db.session")
@patch("app.services.officer_service.ReviewReportRepository")
@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_submit_review_report_success(mock_officers, mock_assignments, mock_reports, mock_db):
    o=officer(); a=assignment(AssignmentStatus.ACCEPTED, ComplaintStatus.UNDER_REVIEW); mock_officers.get_by_user_id.return_value=o; mock_assignments.get_by_officer_and_complaint.return_value=a; mock_reports.get_by_complaint_id.return_value=None; report=MagicMock(); mock_reports.create.return_value=report
    result=OfficerService.submit_review_report("officer-1","complaint-1",{"findings":"Pothole confirmed","decision":ReviewDecision.TENDER_REQUIRED})
    assert result == report and a.complaint.status == ComplaintStatus.REPORT_SUBMITTED
    assert mock_db.commit.call_count >= 1


@patch("app.services.officer_service.ReviewReportRepository")
@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_submit_review_report_rejects_duplicate(mock_officers, mock_assignments, mock_reports):
    mock_officers.get_by_user_id.return_value=officer(); mock_assignments.get_by_officer_and_complaint.return_value=assignment(AssignmentStatus.ACCEPTED, ComplaintStatus.UNDER_REVIEW); mock_reports.get_by_complaint_id.return_value=MagicMock()
    with pytest.raises(ValueError, match="already been submitted"):
        OfficerService.submit_review_report("officer-1", "complaint-1", {"findings":"x", "decision":ReviewDecision.TENDER_REQUIRED})

@patch("app.services.officer_service.db.session")
@patch("app.services.officer_service.ReviewReportRepository")
@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_request_budget_success(mock_officers, mock_assignments, mock_reports, mock_db):
    a=assignment(complaint_status=ComplaintStatus.REPORT_SUBMITTED); mock_officers.get_by_user_id.return_value=officer(); mock_assignments.get_by_officer_and_complaint.return_value=a; mock_reports.get_by_complaint_id.return_value=MagicMock(decision=ReviewDecision.TENDER_REQUIRED)
    OfficerService.request_budget("officer-1","complaint-1")
    assert a.complaint.status == ComplaintStatus.AWAITING_BUDGET
    assert mock_db.commit.call_count >= 1


@patch("app.services.officer_service.ReviewReportRepository")
@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_request_budget_rejects_when_tender_not_required(mock_officers, mock_assignments, mock_reports):
    a=assignment(complaint_status=ComplaintStatus.REPORT_SUBMITTED); mock_officers.get_by_user_id.return_value=officer(); mock_assignments.get_by_officer_and_complaint.return_value=a; mock_reports.get_by_complaint_id.return_value=MagicMock(decision=MagicMock())
    with pytest.raises(ValueError, match="only when tender is required"):
        OfficerService.request_budget("officer-1", "complaint-1")

@patch("app.services.officer_service.db.session")
@patch("app.services.officer_service.TenderRepository")
@patch("app.services.officer_service.ReviewReportRepository")
@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_create_tender_success(mock_officers, mock_assignments, mock_reports, mock_tenders, mock_db):
    a=assignment(complaint_status=ComplaintStatus.BUDGET_ALLOCATED); mock_officers.get_by_user_id.return_value=officer(); mock_assignments.get_by_officer_and_complaint.return_value=a; mock_reports.get_by_complaint_id.return_value=MagicMock(decision=ReviewDecision.TENDER_REQUIRED, estimated_cost=1000); mock_tenders.get_by_complaint_id.return_value=None; tender=MagicMock(); mock_tenders.create.return_value=tender
    result=OfficerService.create_tender("officer-1","complaint-1",{"title":"Road repair","closing_date":"2026-08-01"})
    assert result == tender and a.complaint.status == ComplaintStatus.TENDER_NOTIFICATION_ISSUED
    assert mock_tenders.create.call_args.kwargs == {} and mock_tenders.create.call_args.args[0]["status"] == TenderStatus.OPEN
    assert mock_db.commit.call_count >= 1


@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_create_tender_requires_allocated_budget(mock_officers, mock_assignments):
    mock_officers.get_by_user_id.return_value=officer(); mock_assignments.get_by_officer_and_complaint.return_value=assignment(complaint_status=ComplaintStatus.REPORT_SUBMITTED)
    with pytest.raises(ValueError, match="after budget allocation"):
        OfficerService.create_tender("officer-1", "complaint-1", {"title":"x", "closing_date":"2026-08-01"})


@patch("app.services.officer_service.TenderRepository")
@patch("app.services.officer_service.ReviewReportRepository")
@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_create_tender_rejects_existing_tender(mock_officers, mock_assignments, mock_reports, mock_tenders):
    mock_officers.get_by_user_id.return_value=officer(); mock_assignments.get_by_officer_and_complaint.return_value=assignment(complaint_status=ComplaintStatus.BUDGET_ALLOCATED); mock_reports.get_by_complaint_id.return_value=MagicMock(decision=ReviewDecision.TENDER_REQUIRED); mock_tenders.get_by_complaint_id.return_value=MagicMock()
    with pytest.raises(ValueError, match="Tender already exists"):
        OfficerService.create_tender("officer-1", "complaint-1", {"title":"x", "closing_date":"2026-08-01"})
