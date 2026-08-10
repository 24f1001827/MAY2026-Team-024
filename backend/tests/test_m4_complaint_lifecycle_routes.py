"""Separate positive and negative cases for Milestone 4 complaint lifecycle APIs."""
import uuid
from unittest.mock import MagicMock, patch

from marshmallow import ValidationError
from app.models import ComplaintStatus


def test_reopen_complaint_requires_citizen_role(client, officer_headers):
    complaint_id = uuid.uuid4()
    assert client.patch(f"/api/v1/complaints/{complaint_id}/reopen", headers=officer_headers, json={}).status_code == 403


def test_reopen_complaint_validation_error(client, citizen_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.complaint_route.ReopenComplaintSchema.load", side_effect=ValidationError({"reason": ["Missing data for required field."]})):
        response = client.patch(f"/api/v1/complaints/{complaint_id}/reopen", headers=citizen_headers, json={})
    assert response.status_code == 422


def test_reopen_complaint_not_found(client, citizen_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.complaint_route.ReopenComplaintSchema.load", return_value={"reason": "Still unresolved"}), \
         patch("app.routes.complaint_route.ComplaintService.reopen_complaint", side_effect=ValueError("Complaint not found.")):
        response = client.patch(f"/api/v1/complaints/{complaint_id}/reopen", headers=citizen_headers, json={"reason": "Still unresolved"})
    assert response.status_code == 404


def test_reopen_complaint_success(client, citizen_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.complaint_route.ReopenComplaintSchema.load", return_value={"reason": "Still unresolved"}), \
         patch("app.routes.complaint_route.ComplaintService.reopen_complaint", return_value=MagicMock()), \
         patch("app.routes.complaint_route.ComplaintResponseSchema") as schema:
        schema.return_value.dump.return_value = {"id": str(complaint_id), "status": "submitted"}
        response = client.patch(f"/api/v1/complaints/{complaint_id}/reopen", headers=citizen_headers, json={"reason": "Still unresolved"})
    assert response.status_code == 200
    assert response.get_json()["data"]["id"] == str(complaint_id)


def test_close_complaint_business_error(client, citizen_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.complaint_route.ComplaintService.close_complaint", side_effect=ValueError("Only resolved complaints can be closed.")):
        response = client.patch(f"/api/v1/complaints/{complaint_id}/close", headers=citizen_headers)
    assert response.status_code == 400


def test_close_complaint_success(client, citizen_headers):
    complaint_id = uuid.uuid4()
    complaint = MagicMock(id=complaint_id, status=ComplaintStatus.CLOSED)
    with patch("app.routes.complaint_route.ComplaintService.close_complaint", return_value=complaint):
        response = client.patch(f"/api/v1/complaints/{complaint_id}/close", headers=citizen_headers)
    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == ComplaintStatus.CLOSED.value


def test_add_remark_requires_officer_or_admin(client, citizen_headers):
    complaint_id = uuid.uuid4()
    assert client.post(f"/api/v1/complaints/{complaint_id}/remark", headers=citizen_headers, json={"message": "Checked"}).status_code == 403


def test_add_remark_rejects_empty_message(client, officer_headers):
    complaint_id = uuid.uuid4()
    response = client.post(f"/api/v1/complaints/{complaint_id}/remark", headers=officer_headers, json={"message": "  "})
    assert response.status_code == 400


def test_add_remark_not_found(client, officer_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.complaint_route.ComplaintService.add_remark", side_effect=ValueError("Complaint not found.")):
        response = client.post(f"/api/v1/complaints/{complaint_id}/remark", headers=officer_headers, json={"message": "Checked"})
    assert response.status_code == 404


def test_add_remark_success(client, officer_headers):
    complaint_id = uuid.uuid4()
    with patch("app.routes.complaint_route.ComplaintService.add_remark") as add:
        response = client.post(f"/api/v1/complaints/{complaint_id}/remark", headers=officer_headers, json={"message": "Checked site."})
    assert response.status_code == 201
    add.assert_called_once_with(complaint_id, "Checked site.")


def test_public_departments_server_error(client):
    with patch("app.routes.department_route.DepartmentService.get_all_departments", side_effect=Exception("db")):
        response = client.get("/api/v1/departments/public")
    assert response.status_code == 500


def test_authenticated_department_list_server_error(client, citizen_headers):
    with patch("app.routes.department_route.DepartmentService.get_all_departments", side_effect=Exception("db")):
        response = client.get("/api/v1/departments", headers=citizen_headers)
    assert response.status_code == 500


def test_settings_update_validation_error(client, admin_headers):
    with patch("app.routes.settings_route.update_settings_schema.load", side_effect=ValidationError({"manual_allotment": ["Not a valid boolean."]})):
        response = client.patch("/api/v1/settings", headers=admin_headers, json={"manual_allotment": "x"})
    assert response.status_code == 422


def test_settings_update_success(client, admin_headers):
    with patch("app.routes.settings_route.update_settings_schema.load", return_value={"manual_allotment": False}), \
         patch("app.routes.settings_route.SettingsService.update_settings", return_value=MagicMock()) as update, \
         patch("app.routes.settings_route.settings_response_schema.dump", return_value={"manual_allotment": False}):
        response = client.patch("/api/v1/settings", headers=admin_headers, json={"manual_allotment": False})
    assert response.status_code == 200
    update.assert_called_once_with({"manual_allotment": False})


def test_officer_directory_server_error(client, citizen_headers):
    with patch("app.routes.officers_directory_route.OfficerService.get_officer_directory", side_effect=Exception("db")):
        response = client.get("/api/v1/officers", headers=citizen_headers)
    assert response.status_code == 500
