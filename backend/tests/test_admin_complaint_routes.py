import uuid
from decimal import Decimal
from unittest.mock import MagicMock, patch
from marshmallow import ValidationError

def test_get_all_complaints_success(client, admin_headers):
    with patch("app.routes.admin_complaint_route.AdminComplaintService.get_all_complaints", return_value=[MagicMock()]), \
         patch("app.routes.admin_complaint_route.ComplaintResponseSchema") as schema:
        schema.return_value.dump.return_value = [{"id": "complaint-1"}]
        response = client.get("/api/v1/admin/complaints", headers=admin_headers)

    assert response.status_code == 200
    assert response.get_json()["data"] == [{"id": "complaint-1"}]

def test_get_all_complaints_requires_authentication(client):
    assert client.get("/api/v1/admin/complaints").status_code == 401

def test_get_all_complaints_rejects_citizen(client, citizen_headers):
    assert client.get("/api/v1/admin/complaints", headers=citizen_headers).status_code == 403

def test_get_all_complaints_server_error(client, admin_headers):
    with patch("app.routes.admin_complaint_route.AdminComplaintService.get_all_complaints", side_effect=Exception("db down")):
        response = client.get("/api/v1/admin/complaints", headers=admin_headers)
    assert response.status_code == 500

def test_get_complaint_not_found(client, admin_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.admin_complaint_route.AdminComplaintService.get_complaint", side_effect=ValueError("Complaint not found.")):
        response = client.get(f"/api/v1/admin/complaints/{complaint_id}", headers=admin_headers)

    assert response.status_code == 404
    assert response.get_json()["message"] == "Complaint not found."

def test_get_department_officers_success(client, admin_headers):
    complaint_id = uuid.uuid4()
    officer = MagicMock(user_id=7, availability_status=MagicMock(value="available"), current_workload=1, max_workload=4)
    officer.user.name, officer.user.email, officer.user.phone = "Officer Bob", "bob@example.com", "9876543210"
    with patch("app.routes.admin_complaint_route.AdminComplaintService.get_department_officers", return_value=[officer]):
        response = client.get(f"/api/v1/admin/complaints/{complaint_id}/officers", headers=admin_headers)

    assert response.status_code == 200
    assert response.get_json()["data"][0]["availability_status"] == "available"

def test_assign_complaint_success(client, admin_headers):
    complaint_id, officer_id = uuid.uuid4(), uuid.uuid4()
    payload = {"officer_id": str(officer_id)}
    with patch("app.routes.admin_complaint_route.AssignComplaintSchema") as schema, \
         patch("app.routes.admin_complaint_route.AdminComplaintService.assign_complaint") as service:
        schema.return_value.load.return_value = payload
        response = client.post(f"/api/v1/admin/complaints/{complaint_id}/assign", headers=admin_headers, json=payload)

    assert response.status_code == 200
    assert response.get_json()["message"] == "Complaint assigned successfully."
    service.assert_called_once_with(complaint_id, payload)

def test_assign_complaint_validation_error(client, admin_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.admin_complaint_route.AssignComplaintSchema") as schema:
        schema.return_value.load.side_effect = ValidationError({"officer_id": ["Field required."]})
        response = client.post(f"/api/v1/admin/complaints/{complaint_id}/assign", headers=admin_headers, json={})

    assert response.status_code == 422
    assert response.get_json()["errors"]["officer_id"] == ["Field required."]

def test_allocate_budget_success(client, admin_headers):
    complaint_id = uuid.uuid4()
    complaint = MagicMock(id=complaint_id, department=MagicMock(budget=Decimal("5000.00")), status=MagicMock(value="allocated"))
    with patch("app.routes.admin_complaint_route.allocate_budget_schema.load", return_value={"amount": "5000"}), \
         patch("app.routes.admin_complaint_route.AdminBudgetService.allocate_budget", return_value=complaint):
        response = client.patch(f"/api/v1/admin/complaints/{complaint_id}/allocate-budget", headers=admin_headers, json={"amount": "5000"})

    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "allocated"

def test_allocate_budget_validation_error(client, admin_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.admin_complaint_route.allocate_budget_schema.load", side_effect=ValidationError({"amount": ["Field required."]})):
        response = client.patch(f"/api/v1/admin/complaints/{complaint_id}/allocate-budget", headers=admin_headers, json={})
    assert response.status_code == 422