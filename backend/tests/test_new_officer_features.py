from unittest.mock import MagicMock, patch
import pytest
from app.models import AssignmentStatus, ComplaintStatus, ProposalStatus, TenderStatus, WorkOrderStatus
from app.services.officer_service import OfficerService

def officer(): return MagicMock(user_id="officer-1")
def proposal(status=ProposalStatus.SUBMITTED):
    p=MagicMock(id=1, tender_id=2, agency_id="agency-1", status=status)
    p.tender=MagicMock(complaint_id="complaint-1", status=TenderStatus.OPEN, complaint=MagicMock(status=ComplaintStatus.TENDER_NOTIFICATION_ISSUED))
    p.agency=MagicMock(current_projects=0)
    return p

@patch("app.services.officer_service.AgencyProposalRepository")
@patch("app.services.officer_service.TenderRepository")
@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_get_tender_proposals_rejects_unauthorized_officer(mock_officers,mock_assignments,mock_tenders,mock_proposals):
    mock_officers.get_by_user_id.return_value=officer(); mock_tenders.get_by_id.return_value=MagicMock(complaint_id="complaint-1"); mock_assignments.get_by_officer_and_complaint.return_value=None
    with pytest.raises(PermissionError, match="not authorized"): OfficerService.get_tender_proposals("officer-1",2)

@patch("app.services.officer_service.AgencyProposalRepository")
@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_get_proposal_success(mock_officers,mock_assignments,mock_proposals):
    p=proposal(); mock_officers.get_by_user_id.return_value=officer(); mock_proposals.get_by_id.return_value=p; mock_assignments.get_by_officer_and_complaint.return_value=MagicMock()
    assert OfficerService.get_proposal("officer-1",1) == p

@patch("app.services.officer_service.AgencyProposalRepository")
@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_update_proposal_status_accepts_shortlisted_proposal(mock_officers,mock_assignments,mock_proposals):
    p=proposal(ProposalStatus.SHORTLISTED); mock_officers.get_by_user_id.return_value=officer(); mock_proposals.get_by_id.return_value=p; mock_assignments.get_by_officer_and_complaint.return_value=MagicMock()
    with patch("app.services.officer_service.NotificationService.create_notification"), patch("app.services.officer_service.ActivityService.record"):
        OfficerService.update_proposal_status("officer-1",1,{"status":ProposalStatus.ACCEPTED})
    assert p.status == ProposalStatus.ACCEPTED and p.tender.status == TenderStatus.AWARDED and p.tender.complaint.status == ComplaintStatus.TENDER_ALLOTTED
    mock_proposals.reject_other_proposals.assert_called_once_with(2,1)

@patch("app.services.officer_service.AgencyProposalRepository")
@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_update_proposal_status_rejects_invalid_transition(mock_officers,mock_assignments,mock_proposals):
    p=proposal(ProposalStatus.SUBMITTED); mock_officers.get_by_user_id.return_value=officer(); mock_proposals.get_by_id.return_value=p; mock_assignments.get_by_officer_and_complaint.return_value=MagicMock()
    with pytest.raises(ValueError, match="Invalid proposal status"): OfficerService.update_proposal_status("officer-1",1,{"status":ProposalStatus.ACCEPTED})

@patch("app.services.officer_service.db.session")
@patch("app.services.officer_service.WorkOrderRepository")
@patch("app.services.officer_service.AgencyProposalRepository")
@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_create_work_order_success(mock_officers,mock_assignments,mock_proposals,mock_orders,mock_db):
    p=proposal(ProposalStatus.ACCEPTED); mock_officers.get_by_user_id.return_value=officer(); mock_proposals.get_by_id.return_value=p; mock_orders.get_by_tender_id.return_value=None; mock_assignments.get_by_officer_and_complaint.return_value=MagicMock(status=AssignmentStatus.ACCEPTED); created=MagicMock(); mock_orders.create.return_value=created
    assert OfficerService.create_work_order("officer-1",1,{"scope_of_work":"Repair damaged road surface"}) == created
    assert mock_orders.create.call_args.args[0]["status"] == WorkOrderStatus.ASSIGNED
    assert mock_db.commit.call_count >= 1

@patch("app.services.officer_service.WorkOrderRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_verify_work_order_requires_completed_status(mock_officers,mock_orders):
    w=MagicMock(status=WorkOrderStatus.IN_PROGRESS); mock_officers.get_by_user_id.return_value=officer(); mock_orders.get_by_id.return_value=w
    with patch("app.services.officer_service.ComplaintAssignmentRepository.get_by_officer_and_complaint", return_value=MagicMock()):
        with pytest.raises(ValueError, match="Only completed"): OfficerService.verify_work_order("officer-1",1)
