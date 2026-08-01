"""Completes direct route coverage for every new Agency and Officer endpoint."""
from datetime import datetime
from io import BytesIO
from unittest.mock import MagicMock, patch

def test_agency_submit_proposal_success(client, agency_headers):
    with patch("app.routes.agency_route.create_proposal_schema.load", return_value={"proposal_amount": "1000"}), \
         patch("app.routes.agency_route.validate_document"), \
         patch("app.routes.agency_route.get_jwt_identity", return_value="agency-1"), \
         patch("app.routes.agency_route.AgencyService.submit_proposal", return_value=MagicMock()), \
         patch("app.routes.agency_route.proposal_response_schema.dump", return_value={"proposal_id": 1}):
        response = client.post(
            "/api/v1/agency/tenders/1/proposal", headers=agency_headers,
            data={"proposal_amount": "1000", "proposal_document": (BytesIO(b"pdf"), "proposal.pdf", "application/pdf")},
            content_type="multipart/form-data",
        )
    assert response.status_code == 201
    assert response.get_json()["message"] == "Proposal submitted successfully."

def test_agency_get_proposals_success(client, agency_headers):
    with patch("app.routes.agency_route.get_jwt_identity", return_value="agency-1"), \
         patch("app.routes.agency_route.AgencyService.get_proposals", return_value=[MagicMock()]), \
         patch("app.routes.agency_route.proposal_list_schema.dump", return_value=[{"proposal_id": 1}]):
        response = client.get("/api/v1/agency/proposals", headers=agency_headers)
    assert response.status_code == 200
    assert response.get_json()["data"] == [{"proposal_id": 1}]

def test_agency_get_work_orders_success(client, agency_headers):
    order = MagicMock(id=1, tender_id=2, scope_of_work="Repair road", status=MagicMock(value="assigned"), remarks=None, created_at=datetime.now())
    with patch("app.routes.agency_route.get_jwt_identity", return_value="agency-1"), \
         patch("app.routes.agency_route.AgencyService.get_work_orders", return_value=[order]):
        response = client.get("/api/v1/agency/work-orders", headers=agency_headers)
    assert response.status_code == 200
    assert response.get_json()["data"][0]["status"] == "assigned"

def test_agency_get_work_order_success(client, agency_headers):
    now = datetime.now()
    order = MagicMock(id=1, tender_id=2, scope_of_work="Repair road", status=MagicMock(value="in_progress"), start_date=None, end_date=None, completion_proof_url=None, remarks=None, created_at=now, updated_at=now)
    with patch("app.routes.agency_route.get_jwt_identity", return_value="agency-1"), \
         patch("app.routes.agency_route.AgencyService.get_work_order", return_value=order):
        response = client.get("/api/v1/agency/work-orders/1", headers=agency_headers)
    assert response.status_code == 200
    assert response.get_json()["data"]["id"] == 1

def test_agency_update_work_order_status_success(client, agency_headers):
    now = datetime.now()
    order = MagicMock(id=1, status=MagicMock(value="in_progress"), start_date=now.date(), end_date=None, completion_proof_url=None, updated_at=now)
    with patch("app.routes.agency_route.UpdateWorkOrderStatusSchema") as schema, \
         patch("app.routes.agency_route.get_jwt_identity", return_value="agency-1"), \
         patch("app.routes.agency_route.AgencyService.update_work_order_status", return_value=order):
        schema.return_value.load.return_value = {"status": "in_progress"}
        response = client.patch("/api/v1/agency/work-orders/1/status", headers=agency_headers, data={"status": "in_progress"})
    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "in_progress"

def test_officer_get_proposal_success(client, officer_headers):
    with patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.OfficerService.get_proposal", return_value=MagicMock()), \
         patch("app.routes.officer_route.officer_proposal_detail_schema.dump", return_value={"proposal_id": 1}):
        response = client.get("/api/v1/officer/proposals/1", headers=officer_headers)
    assert response.status_code == 200
    assert response.get_json()["data"] == {"proposal_id": 1}

def test_officer_update_proposal_status_success(client, officer_headers):
    with patch("app.routes.officer_route.update_proposal_status_schema.load", return_value={"status": "shortlisted"}), \
         patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.OfficerService.update_proposal_status", return_value=MagicMock()), \
         patch("app.routes.officer_route.officer_proposal_detail_schema.dump", return_value={"proposal_id": 1, "status": "shortlisted"}):
        response = client.patch("/api/v1/officer/proposals/1/status", headers=officer_headers, json={"status": "shortlisted"})
    assert response.status_code == 200
    assert response.get_json()["message"] == "Proposal status updated successfully."

def test_officer_create_work_order_success(client, officer_headers):
    now = datetime.now()
    order = MagicMock(id=1, tender_id=2, agency_id="agency-1", assigned_by="officer-1", scope_of_work="Repair damaged road surface", status=MagicMock(value="assigned"), remarks=None, created_at=now, updated_at=now)
    with patch("app.routes.officer_route.CreateWorkOrderSchema") as schema, \
         patch("app.routes.officer_route.get_jwt_identity", return_value="officer-1"), \
         patch("app.routes.officer_route.OfficerService.create_work_order", return_value=order):
        schema.return_value.load.return_value = {"scope_of_work": "Repair damaged road surface"}
        response = client.post("/api/v1/officer/proposals/1/work-order", headers=officer_headers, json={"scope_of_work": "Repair damaged road surface"})
    assert response.status_code == 201
    assert response.get_json()["message"] == "Work order created successfully."