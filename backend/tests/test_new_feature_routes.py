from datetime import datetime
from unittest.mock import MagicMock, patch
from marshmallow import ValidationError

def test_agency_open_tenders_success(client, agency_headers):
    with patch("app.routes.agency_route.AgencyService.get_open_tenders", return_value=[MagicMock()]), patch("app.routes.agency_route.tender_list_schema.dump", return_value=[{"id":1}]):
        r=client.get("/api/v1/agency/tenders",headers=agency_headers)
    assert r.status_code == 200 and r.get_json()["data"] == [{"id":1}]

def test_agency_tender_not_found(client, agency_headers):
    with patch("app.routes.agency_route.AgencyService.get_tender_details",side_effect=ValueError("Tender not found.")):
        r=client.get("/api/v1/agency/tenders/1",headers=agency_headers)
    assert r.status_code == 404

def test_agency_proposal_validation_error(client, agency_headers):
    with patch("app.routes.agency_route.create_proposal_schema.load",side_effect=ValidationError({"proposal_amount":["Missing data."]})):
        r=client.post("/api/v1/agency/tenders/1/proposal",headers=agency_headers,data={})
    assert r.status_code == 422

def test_agency_work_order_update_validation_error(client, agency_headers):
    with patch("app.routes.agency_route.UpdateWorkOrderStatusSchema") as schema:
        schema.return_value.load.side_effect=ValidationError({"status":["Missing data."]})
        r=client.patch("/api/v1/agency/work-orders/1/status",headers=agency_headers,data={})
    assert r.status_code == 422

def test_officer_get_tender_proposals_success(client, officer_headers):
    with patch("app.routes.officer_route.get_jwt_identity",return_value="officer-1"), patch("app.routes.officer_route.OfficerService.get_tender_proposals",return_value=[MagicMock()]), patch("app.routes.officer_route.officer_proposal_list_schema.dump",return_value=[{"proposal_id":1}]):
        r=client.get("/api/v1/officer/tenders/1/proposals",headers=officer_headers)
    assert r.status_code == 200

def test_officer_update_proposal_status_validation_error(client, officer_headers):
    with patch("app.routes.officer_route.update_proposal_status_schema.load",side_effect=ValidationError({"status":["Missing data."]})):
        r=client.patch("/api/v1/officer/proposals/1/status",headers=officer_headers,json={})
    assert r.status_code == 422

def test_officer_verify_work_order_success(client, officer_headers):
    order=MagicMock(id=1,status=MagicMock(value="verified"),verified_by="officer-1",verified_at=datetime.now(),updated_at=datetime.now())
    with patch("app.routes.officer_route.get_jwt_identity",return_value="officer-1"), patch("app.routes.officer_route.OfficerService.verify_work_order",return_value=order):
        r=client.patch("/api/v1/officer/work-orders/1/verify",headers=officer_headers)
    assert r.status_code == 200 and r.get_json()["data"]["status"] == "verified"