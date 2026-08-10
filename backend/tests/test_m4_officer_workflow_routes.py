"""Independent route tests for the remaining officer workflow endpoints."""
import uuid
from datetime import datetime
from unittest.mock import MagicMock, patch

from marshmallow import ValidationError
from app.models import WorkOrderStatus


def test_officer_dashboard_success(client, officer_headers):
    with patch("app.routes.officer_route.OfficerService.get_my_department_dashboard", return_value=MagicMock()), \
         patch("app.routes.officer_route.department_dashboard_schema.dump", return_value={"is_department_head": True}):
        response = client.get("/api/v1/officer/department/dashboard", headers=officer_headers)
    assert response.status_code == 200


def test_officer_dashboard_not_found(client, officer_headers):
    with patch("app.routes.officer_route.OfficerService.get_my_department_dashboard", side_effect=ValueError("Officer not found.")):
        response = client.get("/api/v1/officer/department/dashboard", headers=officer_headers)
    assert response.status_code == 404


def test_allot_complaint_validation_error(client, officer_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.officer_route.assign_complaint_schema.load", side_effect=ValidationError({"officer_id": ["Missing data."]})):
        response = client.post(f"/api/v1/officer/complaints/{complaint_id}/allot", headers=officer_headers, json={})
    assert response.status_code == 422


def test_allot_complaint_forbidden(client, officer_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.officer_route.assign_complaint_schema.load", return_value={"officer_id": "other"}), \
         patch("app.routes.officer_route.OfficerService.allot_complaint", side_effect=PermissionError("Only department heads can allot.")):
        response = client.post(f"/api/v1/officer/complaints/{complaint_id}/allot", headers=officer_headers, json={"officer_id": "other"})
    assert response.status_code == 403


def test_officer_tenders_success(client, officer_headers):
    with patch("app.routes.officer_route.OfficerService.get_my_tenders", return_value=[]):
        response = client.get("/api/v1/officer/tenders", headers=officer_headers)
    assert response.status_code == 200
    assert response.get_json()["data"] == []


def test_create_tender_validation_error(client, officer_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.officer_route.create_tender_schema.load", side_effect=ValidationError({"title": ["Missing data."]})):
        response = client.post(f"/api/v1/officer/complaints/{complaint_id}/tender", headers=officer_headers, json={})
    assert response.status_code == 422


def test_create_tender_business_error(client, officer_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.officer_route.create_tender_schema.load", return_value={"title": "Road repair"}), \
         patch("app.routes.officer_route.OfficerService.create_tender", side_effect=ValueError("Tender already exists.")):
        response = client.post(f"/api/v1/officer/complaints/{complaint_id}/tender", headers=officer_headers, json={"title": "Road repair"})
    assert response.status_code == 400


def test_get_tender_proposals_forbidden(client, officer_headers):
    with patch("app.routes.officer_route.OfficerService.get_tender_proposals", side_effect=PermissionError("Not authorized.")):
        response = client.get("/api/v1/officer/tenders/1/proposals", headers=officer_headers)
    assert response.status_code == 403


def test_get_proposal_not_found(client, officer_headers):
    with patch("app.routes.officer_route.OfficerService.get_proposal", side_effect=ValueError("Proposal not found.")):
        response = client.get("/api/v1/officer/proposals/1", headers=officer_headers)
    assert response.status_code == 404


def test_update_proposal_status_validation_error(client, officer_headers):
    with patch("app.routes.officer_route.update_proposal_status_schema.load", side_effect=ValidationError({"status": ["Invalid."]})):
        response = client.patch("/api/v1/officer/proposals/1/status", headers=officer_headers, json={})
    assert response.status_code == 422


def test_update_proposal_status_business_error(client, officer_headers):
    with patch("app.routes.officer_route.update_proposal_status_schema.load", return_value={"status": "accepted"}), \
         patch("app.routes.officer_route.OfficerService.update_proposal_status", side_effect=ValueError("Invalid proposal status transition.")):
        response = client.patch("/api/v1/officer/proposals/1/status", headers=officer_headers, json={"status": "accepted"})
    assert response.status_code == 400


def test_create_work_order_validation_error(client, officer_headers):
    with patch("app.routes.officer_route.CreateWorkOrderSchema.load", side_effect=ValidationError({"scope_of_work": ["Missing data."]})):
        response = client.post("/api/v1/officer/proposals/1/work-order", headers=officer_headers, json={})
    assert response.status_code == 422


def test_verify_work_order_forbidden(client, officer_headers):
    with patch("app.routes.officer_route.OfficerService.verify_work_order", side_effect=PermissionError("Not authorized.")):
        response = client.patch("/api/v1/officer/work-orders/1/verify", headers=officer_headers)
    assert response.status_code == 403


def test_mark_work_order_incomplete_validation_error(client, officer_headers):
    with patch("app.routes.officer_route.MarkWorkOrderIncompleteSchema.load", side_effect=ValidationError({"remarks": ["Missing data."]})):
        response = client.patch("/api/v1/officer/work-orders/1/mark-incomplete", headers=officer_headers, json={})
    assert response.status_code == 422


def test_mark_work_order_incomplete_success(client, officer_headers):
    order = MagicMock(id=1, status=WorkOrderStatus.INCOMPLETE)
    with patch("app.routes.officer_route.MarkWorkOrderIncompleteSchema.load", return_value={"remarks": "Proof insufficient"}), \
         patch("app.routes.officer_route.OfficerService.mark_work_order_incomplete", return_value=order):
        response = client.patch("/api/v1/officer/work-orders/1/mark-incomplete", headers=officer_headers, json={"remarks": "Proof insufficient"})
    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == WorkOrderStatus.INCOMPLETE.value
