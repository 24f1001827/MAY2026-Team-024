"""Route tests for APIs introduced or materially expanded in Milestone 4."""
import uuid
from unittest.mock import MagicMock, patch


def test_public_stats_success(client):
    with patch("app.routes.stats_route.StatsService.get_public_stats", return_value={"complaints": 12}):
        response = client.get("/api/v1/stats/public")
    assert response.status_code == 200
    assert response.get_json()["data"] == {"complaints": 12}


def test_public_stats_server_error(client):
    with patch("app.routes.stats_route.StatsService.get_public_stats", side_effect=Exception("database down")):
        response = client.get("/api/v1/stats/public")
    assert response.status_code == 500
    assert response.get_json()["success"] is False


def test_public_departments_success(client):
    with patch("app.routes.department_route.DepartmentService.get_all_departments", return_value=[]):
        response = client.get("/api/v1/departments/public")
    assert response.status_code == 200
    assert response.get_json()["data"] == []


def test_settings_requires_authentication(client):
    assert client.get("/api/v1/settings").status_code == 401


def test_settings_success_for_authenticated_user(client, citizen_headers):
    with patch("app.routes.settings_route.SettingsService.get_settings", return_value=MagicMock()), \
         patch("app.routes.settings_route.settings_response_schema.dump", return_value={"manual_allotment": True}):
        response = client.get("/api/v1/settings", headers=citizen_headers)
    assert response.status_code == 200
    assert response.get_json()["data"]["manual_allotment"] is True


def test_settings_update_rejects_non_admin(client, citizen_headers):
    assert client.patch("/api/v1/settings", headers=citizen_headers, json={}).status_code == 403


def test_admin_department_create_validation_error(client, admin_headers):
    with patch("app.routes.admin_department_route.create_department_schema.load", side_effect=__import__("marshmallow").ValidationError({"name": ["Missing data for required field."]})):
        response = client.post("/api/v1/admin/departments", headers=admin_headers, json={})
    assert response.status_code == 422
    assert response.get_json()["success"] is False


def test_admin_department_create_success(client, admin_headers):
    department = MagicMock()
    with patch("app.routes.admin_department_route.create_department_schema.load", return_value={"name": "Roads"}), \
         patch("app.routes.admin_department_route.DepartmentService.create_department", return_value=department), \
         patch("app.routes.admin_department_route.department_response_schema.dump", return_value={"id": 1, "name": "Roads"}):
        response = client.post("/api/v1/admin/departments", headers=admin_headers, json={"name": "Roads"})
    assert response.status_code == 201
    assert response.get_json()["data"]["name"] == "Roads"


def test_admin_budget_history_not_found(client, admin_headers):
    with patch("app.routes.admin_budget_route.AdminBudgetService.get_department_history", side_effect=ValueError("Department not found.")):
        response = client.get("/api/v1/admin/budgets/departments/999/history", headers=admin_headers)
    assert response.status_code == 404
    assert response.get_json()["message"] == "Department not found."


def test_admin_budget_add_validation_error(client, admin_headers):
    with patch("app.routes.admin_budget_route.add_budget_schema.load", side_effect=__import__("marshmallow").ValidationError({"amount": ["Must be greater than 0."]})):
        response = client.post("/api/v1/admin/budgets", headers=admin_headers, json={"amount": 0})
    assert response.status_code == 422


def test_officer_directory_requires_authentication(client):
    assert client.get("/api/v1/officers").status_code == 401


def test_officer_directory_success(client, citizen_headers):
    with patch("app.routes.officers_directory_route.OfficerService.get_officer_directory", return_value=[]):
        response = client.get("/api/v1/officers", headers=citizen_headers)
    assert response.status_code == 200
    assert response.get_json()["data"] == []


def test_public_complaint_not_found(client):
    complaint_id = uuid.uuid4()
    with patch("app.routes.complaint_route.ComplaintService.get_public_complaint", side_effect=ValueError("Complaint not found.")):
        response = client.get(f"/api/v1/complaints/public/{complaint_id}")
    assert response.status_code == 404
    assert response.get_json()["message"] == "Complaint not found."


def test_admin_agencies_rejects_non_admin(client, citizen_headers):
    assert client.get("/api/v1/admin/agencies", headers=citizen_headers).status_code == 403


def test_admin_agencies_success(client, admin_headers):
    with patch("app.routes.admin_agency_route.AdminAgencyService.get_all_agencies", return_value=[]):
        response = client.get("/api/v1/admin/agencies", headers=admin_headers)
    assert response.status_code == 200
    assert response.get_json()["data"] == []
