"""Additional edge-case coverage for services, routes, repositories and admin creation."""
from datetime import datetime
from unittest.mock import MagicMock, patch
import pytest
from app.models import AssignmentStatus, ComplaintStatus, ProposalStatus, TenderStatus, WorkOrderStatus
from app.services.agency_service import AgencyService
from app.services.officer_service import OfficerService


def _agency(): return MagicMock(user_id="agency-1")


@patch("app.services.agency_service.AgencyRepository")
def test_agency_service_rejects_unknown_agency_when_listing_proposals(mock_agencies):
    mock_agencies.get_by_user_id.return_value = None
    with pytest.raises(ValueError, match="Agency not found"):
        AgencyService.get_proposals("missing")


@patch("app.services.agency_service.WorkOrderRepository")
@patch("app.services.agency_service.AgencyRepository")
def test_agency_service_rejects_missing_work_order(mock_agencies, mock_orders):
    mock_agencies.get_by_user_id.return_value = _agency(); mock_orders.get_by_id.return_value = None
    with pytest.raises(ValueError, match="Work order not found"):
        AgencyService.get_work_order("agency-1", 1)


@patch("app.services.agency_service.WorkOrderRepository")
@patch("app.services.agency_service.AgencyRepository")
def test_agency_service_rejects_invalid_work_order_transition(mock_agencies, mock_orders):
    order=MagicMock(agency_id="agency-1", status=WorkOrderStatus.ASSIGNED); mock_agencies.get_by_user_id.return_value=_agency(); mock_orders.get_by_id.return_value=order
    with pytest.raises(ValueError, match="Invalid status transition"):
        AgencyService.update_work_order_status("agency-1", 1, {"status": WorkOrderStatus.COMPLETED})


@patch("app.services.officer_service.AgencyProposalRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_officer_service_rejects_unknown_proposal(mock_officers, mock_proposals):
    mock_officers.get_by_user_id.return_value=MagicMock(user_id="officer-1"); mock_proposals.get_by_id.return_value=None
    with pytest.raises(ValueError, match="Proposal not found"):
        OfficerService.get_proposal("officer-1", 1)


@patch("app.services.officer_service.WorkOrderRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_officer_service_rejects_missing_work_order(mock_officers, mock_orders):
    mock_officers.get_by_user_id.return_value=MagicMock(user_id="officer-1"); mock_orders.get_by_id.return_value=None
    with pytest.raises(ValueError, match="Work order not found"):
        OfficerService.verify_work_order("officer-1", 1)


@patch("app.services.officer_service.db.session")
@patch("app.services.officer_service.ComplaintAssignmentRepository")
@patch("app.services.officer_service.WorkOrderRepository")
@patch("app.services.officer_service.OfficerRepository")
def test_officer_service_verifies_completed_work_order(mock_officers, mock_orders, mock_assignments, mock_db):
    officer=MagicMock(user_id="officer-1")
    order=MagicMock(status=WorkOrderStatus.COMPLETED, completion_proof_url="proof", tender=MagicMock(complaint=MagicMock()))
    mock_officers.get_by_user_id.return_value=officer; mock_orders.get_by_id.return_value=order; mock_assignments.get_by_officer_and_complaint.return_value=MagicMock()
    assert OfficerService.verify_work_order("officer-1",1) == order
    assert order.status == WorkOrderStatus.VERIFIED
    assert order.tender.complaint.status == ComplaintStatus.RESOLVED
    assert mock_db.commit.call_count >= 1


@patch("app.utils.admin_create.User")
@patch.dict("os.environ", {"ADMIN_EMAIL":"admin@example.com","ADMIN_PASSWORD":"password"}, clear=True)
def test_create_admin_skips_when_default_admin_exists(mock_user, capsys, app):
    from app.utils.admin_create import create_admin
    mock_user.query.filter_by.return_value.first.return_value=MagicMock()
    with app.app_context(), patch("app.utils.admin_create.inspect") as mock_inspect:
        mock_inspect.return_value.get_table_names.return_value = ["users"]
        create_admin()
    assert "Admin already exists" in capsys.readouterr().out


def test_agency_routes_require_agency_role(client, citizen_headers):
    assert client.get("/api/v1/agency/tenders", headers=citizen_headers).status_code == 403


def test_agency_work_order_detail_not_found(client, agency_headers):
    with patch("app.routes.agency_route.get_jwt_identity", return_value="agency-1"), \
         patch("app.routes.agency_route.AgencyService.get_work_order", side_effect=ValueError("Work order not found.")):
        response=client.get("/api/v1/agency/work-orders/1",headers=agency_headers)
    assert response.status_code == 404


def test_agency_work_order_update_rejects_invalid_transition(client, agency_headers):
    with patch("app.routes.agency_route.UpdateWorkOrderStatusSchema") as schema, \
         patch("app.routes.agency_route.get_jwt_identity", return_value="agency-1"), \
         patch("app.routes.agency_route.AgencyService.update_work_order_status", side_effect=ValueError("Invalid status transition.")):
        schema.return_value.load.return_value={"status":"completed"}
        response=client.patch("/api/v1/agency/work-orders/1/status",headers=agency_headers,data={"status":"completed"})
    assert response.status_code == 400


def test_officer_new_routes_require_officer_role(client, citizen_headers):
    assert client.get("/api/v1/officer/tenders/1/proposals", headers=citizen_headers).status_code == 403


def test_officer_proposal_not_found_route(client, officer_headers):
    with patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.OfficerService.get_proposal", side_effect=ValueError("Proposal not found.")):
        response=client.get("/api/v1/officer/proposals/1",headers=officer_headers)
    assert response.status_code == 404


def test_officer_work_order_creation_invalid_state_route(client, officer_headers):
    with patch("app.routes.officer_route.CreateWorkOrderSchema") as schema, \
         patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.OfficerService.create_work_order", side_effect=ValueError("Only accepted proposals can have work orders.")):
        schema.return_value.load.return_value={"scope_of_work":"Repair damaged road surface"}
        response=client.post("/api/v1/officer/proposals/1/work-order",headers=officer_headers,json={"scope_of_work":"Repair damaged road surface"})
    assert response.status_code == 400
