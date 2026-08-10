"""Independent success/error tests for Milestone 4 admin management APIs."""
import uuid
from datetime import datetime
from unittest.mock import MagicMock, patch

from marshmallow import ValidationError


def test_admin_departments_list_success(client, admin_headers):
    with patch("app.routes.admin_department_route.DepartmentService.get_all_departments", return_value=[]):
        response = client.get("/api/v1/admin/departments", headers=admin_headers)
    assert response.status_code == 200
    assert response.get_json()["data"] == []


def test_admin_departments_list_server_error(client, admin_headers):
    with patch("app.routes.admin_department_route.DepartmentService.get_all_departments", side_effect=Exception("db")):
        response = client.get("/api/v1/admin/departments", headers=admin_headers)
    assert response.status_code == 500


def test_admin_department_dashboard_not_found(client, admin_headers):
    with patch("app.routes.admin_department_route.DepartmentService.get_department_dashboard", side_effect=ValueError("Department not found.")):
        response = client.get("/api/v1/admin/departments/99/dashboard", headers=admin_headers)
    assert response.status_code == 404


def test_admin_department_dashboard_success(client, admin_headers):
    with patch("app.routes.admin_department_route.DepartmentService.get_department_dashboard", return_value=MagicMock()), \
         patch("app.routes.admin_department_route.department_dashboard_schema.dump", return_value={"department": {"id": 1}}):
        response = client.get("/api/v1/admin/departments/1/dashboard", headers=admin_headers)
    assert response.status_code == 200
    assert response.get_json()["data"]["department"]["id"] == 1


def test_admin_department_detail_not_found(client, admin_headers):
    with patch("app.routes.admin_department_route.DepartmentService.get_department_by_id", side_effect=ValueError("Department not found.")):
        response = client.get("/api/v1/admin/departments/99", headers=admin_headers)
    assert response.status_code == 404


def test_admin_department_update_validation_error(client, admin_headers):
    with patch("app.routes.admin_department_route.update_department_schema.load", side_effect=ValidationError({"name": ["Too short."]})):
        response = client.patch("/api/v1/admin/departments/1", headers=admin_headers, json={"name": "x"})
    assert response.status_code == 422


def test_admin_department_update_not_found(client, admin_headers):
    with patch("app.routes.admin_department_route.update_department_schema.load", return_value={"name": "Roads"}), \
         patch("app.routes.admin_department_route.DepartmentService.update_department", side_effect=ValueError("Department not found.")):
        response = client.patch("/api/v1/admin/departments/99", headers=admin_headers, json={"name": "Roads"})
    assert response.status_code == 404


def test_admin_department_delete_success(client, admin_headers):
    with patch("app.routes.admin_department_route.DepartmentService.delete_department") as delete:
        response = client.delete("/api/v1/admin/departments/1", headers=admin_headers)
    assert response.status_code == 200
    delete.assert_called_once_with(1)


def test_admin_department_delete_not_found(client, admin_headers):
    with patch("app.routes.admin_department_route.DepartmentService.delete_department", side_effect=ValueError("Department not found.")):
        response = client.delete("/api/v1/admin/departments/99", headers=admin_headers)
    assert response.status_code == 404


def test_admin_budgets_list_success(client, admin_headers):
    with patch("app.routes.admin_budget_route.AdminBudgetService.list_budgets", return_value=[]):
        response = client.get("/api/v1/admin/budgets", headers=admin_headers)
    assert response.status_code == 200
    assert response.get_json()["data"] == []


def test_admin_budget_history_success(client, admin_headers):
    with patch("app.routes.admin_budget_route.AdminBudgetService.get_department_history", return_value={"additions": [], "allocations": []}):
        response = client.get("/api/v1/admin/budgets/departments/1/history", headers=admin_headers)
    assert response.status_code == 200
    assert response.get_json()["data"] == {"additions": [], "allocations": []}


def test_admin_budget_add_success(client, admin_headers):
    budget = MagicMock()
    with patch("app.routes.admin_budget_route.add_budget_schema.load", return_value={"department_id": 1, "amount": "500.00"}), \
         patch("app.routes.admin_budget_route.AdminBudgetService.add_budget", return_value=budget) as add, \
         patch("app.routes.admin_budget_route.budget_schema.dump", return_value={"id": 1, "total_amount": "500.00"}):
        response = client.post("/api/v1/admin/budgets", headers=admin_headers, json={"department_id": 1, "amount": "500.00"})
    assert response.status_code == 201
    add.assert_called_once_with({"department_id": 1, "amount": "500.00"})


def test_admin_budget_add_business_error(client, admin_headers):
    with patch("app.routes.admin_budget_route.add_budget_schema.load", return_value={"department_id": 1, "amount": "0"}), \
         patch("app.routes.admin_budget_route.AdminBudgetService.add_budget", side_effect=ValueError("Amount must be greater than zero.")):
        response = client.post("/api/v1/admin/budgets", headers=admin_headers, json={"department_id": 1, "amount": "0"})
    assert response.status_code == 400


def test_admin_agency_detail_not_found(client, admin_headers):
    agency_id = uuid.uuid4()
    with patch("app.routes.admin_agency_route.AdminAgencyService.get_agency", side_effect=ValueError("Agency not found.")):
        response = client.get(f"/api/v1/admin/agencies/{agency_id}", headers=admin_headers)
    assert response.status_code == 404


def test_admin_agency_detail_success(client, admin_headers):
    agency_id = uuid.uuid4()
    with patch("app.routes.admin_agency_route.AdminAgencyService.get_agency", return_value=MagicMock()), \
         patch("app.routes.admin_agency_route.admin_agency_schema.dump", return_value={"id": str(agency_id)}):
        response = client.get(f"/api/v1/admin/agencies/{agency_id}", headers=admin_headers)
    assert response.status_code == 200


def test_admin_agency_work_orders_not_found(client, admin_headers):
    agency_id = uuid.uuid4()
    with patch("app.routes.admin_agency_route.AdminAgencyService.get_agency_work_orders", side_effect=ValueError("Agency not found.")):
        response = client.get(f"/api/v1/admin/agencies/{agency_id}/work-orders", headers=admin_headers)
    assert response.status_code == 404


def test_admin_agency_work_orders_success(client, admin_headers):
    agency_id = uuid.uuid4()
    order = MagicMock(id=1, tender_id=2, scope_of_work="Repair road")
    order.status.value = "assigned"
    order.start_date = order.end_date = order.created_at = datetime(2026, 8, 1)
    with patch("app.routes.admin_agency_route.AdminAgencyService.get_agency_work_orders", return_value=[order]):
        response = client.get(f"/api/v1/admin/agencies/{agency_id}/work-orders", headers=admin_headers)
    assert response.status_code == 200
    assert response.get_json()["data"][0]["id"] == 1


def test_admin_tenders_requires_admin_role(client, citizen_headers):
    assert client.get("/api/v1/admin/tenders", headers=citizen_headers).status_code == 403


def test_admin_tenders_success(client, admin_headers):
    with patch("app.routes.admin_tender_route.TenderRepository.get_all", return_value=[]):
        response = client.get("/api/v1/admin/tenders", headers=admin_headers)
    assert response.status_code == 200
    assert response.get_json()["data"] == []


def test_admin_tenders_server_error(client, admin_headers):
    with patch("app.routes.admin_tender_route.TenderRepository.get_all", side_effect=Exception("db")):
        response = client.get("/api/v1/admin/tenders", headers=admin_headers)
    assert response.status_code == 500
