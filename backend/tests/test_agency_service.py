from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest
from app.models import ComplaintStatus, ProposalStatus, TenderStatus, WorkOrderStatus, IST
from app.services.agency_service import AgencyService

def agency(): return MagicMock(user_id="agency-1")
def tender(status=TenderStatus.OPEN): return MagicMock(id=1, status=status, closing_date=datetime.now(IST)+timedelta(days=1))

@patch("app.services.agency_service.TenderRepository")
def test_get_open_tenders(mock_tenders):
    mock_tenders.get_open_tenders.return_value=[MagicMock()]
    assert len(AgencyService.get_open_tenders()) == 1

@patch("app.services.agency_service.TenderRepository")
def test_get_tender_details_rejects_missing_or_closed_tender(mock_tenders):
    mock_tenders.get_by_id.return_value=None
    with pytest.raises(ValueError, match="Tender not found"): AgencyService.get_tender_details(1)
    mock_tenders.get_by_id.return_value=tender(TenderStatus.AWARDED)
    with pytest.raises(ValueError, match="not available"): AgencyService.get_tender_details(1)

@patch("app.services.agency_service.db.session")
@patch("app.services.agency_service.upload_document", return_value={"document_url":"url"})
@patch("app.services.agency_service.AgencyProposalRepository")
@patch("app.services.agency_service.TenderRepository")
@patch("app.services.agency_service.AgencyRepository")
def test_submit_proposal_success(mock_agencies, mock_tenders, mock_proposals, mock_upload, mock_db):
    mock_agencies.get_by_user_id.return_value=agency(); mock_tenders.get_by_id.return_value=tender(); mock_proposals.get_by_tender_and_agency.return_value=None; created=MagicMock(); mock_proposals.create.return_value=created
    assert AgencyService.submit_proposal("agency-1", 1, {"proposal_amount":Decimal("100")}, MagicMock()) == created
    assert mock_proposals.create.call_args.args[0]["status"] == ProposalStatus.SUBMITTED
    assert mock_db.commit.call_count >= 1

@patch("app.services.agency_service.AgencyProposalRepository")
@patch("app.services.agency_service.TenderRepository")
@patch("app.services.agency_service.AgencyRepository")
def test_submit_proposal_rejects_deadline_and_duplicate(mock_agencies, mock_tenders, mock_proposals):
    mock_agencies.get_by_user_id.return_value=agency(); expired=tender(); expired.closing_date=datetime.now(IST)-timedelta(days=1); mock_tenders.get_by_id.return_value=expired
    with pytest.raises(ValueError, match="deadline"): AgencyService.submit_proposal("agency-1",1,{"proposal_amount":1},MagicMock())
    mock_tenders.get_by_id.return_value=tender(); mock_proposals.get_by_tender_and_agency.return_value=MagicMock()
    with pytest.raises(ValueError, match="already submitted"): AgencyService.submit_proposal("agency-1",1,{"proposal_amount":1},MagicMock())

@patch("app.services.agency_service.WorkOrderRepository")
@patch("app.services.agency_service.AgencyRepository")
def test_get_work_order_rejects_unauthorized_agency(mock_agencies, mock_orders):
    mock_agencies.get_by_user_id.return_value=agency(); mock_orders.get_by_id.return_value=MagicMock(agency_id="another-agency")
    with pytest.raises(PermissionError, match="not authorized"): AgencyService.get_work_order("agency-1", 1)

@patch("app.services.agency_service.db.session")
@patch("app.services.agency_service.WorkOrderRepository")
@patch("app.services.agency_service.AgencyRepository")
def test_update_work_order_starts_assigned_work(mock_agencies, mock_orders, mock_db):
    order=MagicMock(agency_id="agency-1", status=WorkOrderStatus.ASSIGNED); mock_agencies.get_by_user_id.return_value=agency(); mock_orders.get_by_id.return_value=order
    AgencyService.update_work_order_status("agency-1",1,{"status":WorkOrderStatus.IN_PROGRESS})
    assert order.status == WorkOrderStatus.IN_PROGRESS and order.start_date is not None
    assert mock_db.commit.call_count >= 1

@patch("app.services.agency_service.WorkOrderRepository")
@patch("app.services.agency_service.AgencyRepository")
def test_update_work_order_requires_proof_for_completion(mock_agencies, mock_orders):
    order=MagicMock(agency_id="agency-1", status=WorkOrderStatus.IN_PROGRESS); mock_agencies.get_by_user_id.return_value=agency(); mock_orders.get_by_id.return_value=order
    with pytest.raises(ValueError, match="Completion proof"): AgencyService.update_work_order_status("agency-1",1,{"status":WorkOrderStatus.COMPLETED})
