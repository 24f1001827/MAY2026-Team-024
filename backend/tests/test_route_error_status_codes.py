"""Independent route tests for each handled business-error and server-error status."""

from io import BytesIO
from unittest.mock import patch

import pytest


COMPLAINT_ID = "11111111-1111-1111-1111-111111111111"

# method, URL, authenticated-header fixture, service method, exception, expected status
GET_ERROR_CASES = [
    ("get", "/api/v1/admin/complaints", "admin_headers", "app.routes.admin_complaint_route.AdminComplaintService.get_all_complaints", ValueError, 404),
    ("get", f"/api/v1/admin/complaints/{COMPLAINT_ID}", "admin_headers", "app.routes.admin_complaint_route.AdminComplaintService.get_complaint", ValueError, 404),
    ("get", f"/api/v1/admin/complaints/{COMPLAINT_ID}", "admin_headers", "app.routes.admin_complaint_route.AdminComplaintService.get_complaint", PermissionError, 403),
    ("get", f"/api/v1/admin/complaints/{COMPLAINT_ID}/officers", "admin_headers", "app.routes.admin_complaint_route.AdminComplaintService.get_department_officers", ValueError, 404),
    ("get", "/api/v1/admin/users?role=not-a-role", "admin_headers", "app.routes.admin_user_route.AdminUserService.get_all_users", ValueError, 400),
    ("get", "/api/v1/agency/tenders/1", "agency_headers", "app.routes.agency_route.AgencyService.get_tender_details", ValueError, 404),
    ("get", "/api/v1/agency/proposals", "agency_headers", "app.routes.agency_route.AgencyService.get_proposals", ValueError, 404),
    ("get", "/api/v1/agency/work-orders", "agency_headers", "app.routes.agency_route.AgencyService.get_work_orders", ValueError, 404),
    ("get", "/api/v1/agency/work-orders/1", "agency_headers", "app.routes.agency_route.AgencyService.get_work_order", PermissionError, 403),
    ("get", f"/api/v1/complaints/{COMPLAINT_ID}", "citizen_headers", "app.routes.complaint_route.ComplaintService.get_complaint_by_id", ValueError, 404),
    ("get", "/api/v1/officer/complaints", "officer_headers", "app.routes.officer_route.OfficerService.get_my_complaints", ValueError, 404),
    ("get", f"/api/v1/officer/complaints/{COMPLAINT_ID}", "officer_headers", "app.routes.officer_route.OfficerService.get_complaint_details", ValueError, 404),
    ("get", "/api/v1/officer/tenders/1/proposals", "officer_headers", "app.routes.officer_route.OfficerService.get_tender_proposals", PermissionError, 403),
    ("get", "/api/v1/officer/proposals/1", "officer_headers", "app.routes.officer_route.OfficerService.get_proposal", ValueError, 404),
    ("patch", f"/api/v1/officer/complaints/{COMPLAINT_ID}/accept", "officer_headers", "app.routes.officer_route.OfficerService.accept_assignment", ValueError, 400),
    ("patch", f"/api/v1/officer/complaints/{COMPLAINT_ID}/reject", "officer_headers", "app.routes.officer_route.OfficerService.reject_assignment", ValueError, 400),
    ("post", f"/api/v1/officer/complaints/{COMPLAINT_ID}/budget-request", "officer_headers", "app.routes.officer_route.OfficerService.request_budget", ValueError, 400),
    ("patch", "/api/v1/notifications/1/read", "citizen_headers", "app.routes.notification_route.NotificationService.mark_as_read", ValueError, 404),
    ("patch", "/api/v1/notifications/1/read", "citizen_headers", "app.routes.notification_route.NotificationService.mark_as_read", PermissionError, 403),
]


@pytest.mark.parametrize(
    "method,path,header_fixture,service_target,error_type,expected_status",
    GET_ERROR_CASES,
)
def test_endpoint_returns_documented_business_error_status(
    client, request, method, path, header_fixture, service_target, error_type, expected_status
):
    """Each listed business error has its own pytest case and status assertion."""
    with patch(service_target, side_effect=error_type("expected test error")):
        response = getattr(client, method)(path, headers=request.getfixturevalue(header_fixture))
    assert response.status_code == expected_status


SERVER_ERROR_CASES = [
    ("get", "/api/v1/admin/complaints", "admin_headers", "app.routes.admin_complaint_route.AdminComplaintService.get_all_complaints"),
    ("get", f"/api/v1/admin/complaints/{COMPLAINT_ID}", "admin_headers", "app.routes.admin_complaint_route.AdminComplaintService.get_complaint"),
    ("get", f"/api/v1/admin/complaints/{COMPLAINT_ID}/officers", "admin_headers", "app.routes.admin_complaint_route.AdminComplaintService.get_department_officers"),
    ("get", "/api/v1/admin/users", "admin_headers", "app.routes.admin_user_route.AdminUserService.get_all_users"),
    ("get", "/api/v1/agency/tenders", "agency_headers", "app.routes.agency_route.AgencyService.get_open_tenders"),
    ("get", "/api/v1/agency/tenders/1", "agency_headers", "app.routes.agency_route.AgencyService.get_tender_details"),
    ("get", "/api/v1/agency/proposals", "agency_headers", "app.routes.agency_route.AgencyService.get_proposals"),
    ("get", "/api/v1/agency/work-orders", "agency_headers", "app.routes.agency_route.AgencyService.get_work_orders"),
    ("get", "/api/v1/agency/work-orders/1", "agency_headers", "app.routes.agency_route.AgencyService.get_work_order"),
    ("get", "/api/v1/complaints/my", "citizen_headers", "app.routes.complaint_route.ComplaintService.get_my_complaints"),
    ("get", f"/api/v1/complaints/{COMPLAINT_ID}", "citizen_headers", "app.routes.complaint_route.ComplaintService.get_complaint_by_id"),
    ("get", "/api/v1/officer/complaints", "officer_headers", "app.routes.officer_route.OfficerService.get_my_complaints"),
    ("get", f"/api/v1/officer/complaints/{COMPLAINT_ID}", "officer_headers", "app.routes.officer_route.OfficerService.get_complaint_details"),
    ("get", "/api/v1/officer/tenders/1/proposals", "officer_headers", "app.routes.officer_route.OfficerService.get_tender_proposals"),
    ("get", "/api/v1/officer/proposals/1", "officer_headers", "app.routes.officer_route.OfficerService.get_proposal"),
    ("get", "/api/v1/notifications", "citizen_headers", "app.routes.notification_route.NotificationService.get_notifications"),
    ("patch", "/api/v1/notifications/1/read", "citizen_headers", "app.routes.notification_route.NotificationService.mark_as_read"),
    ("patch", "/api/v1/notifications/read-all", "citizen_headers", "app.routes.notification_route.NotificationService.mark_all_as_read"),
]


@pytest.mark.parametrize("method,path,header_fixture,service_target", SERVER_ERROR_CASES)
def test_endpoint_returns_500_when_service_fails(
    client, request, method, path, header_fixture, service_target
):
    """Every route above has a dedicated 500 response test."""
    with patch(service_target, side_effect=RuntimeError("unexpected test error")):
        response = getattr(client, method)(path, headers=request.getfixturevalue(header_fixture))
    assert response.status_code == 500


VALIDATION_CASES = [
    ("post", f"/api/v1/admin/complaints/{COMPLAINT_ID}/assign", "admin_headers"),
    ("patch", f"/api/v1/admin/complaints/{COMPLAINT_ID}/allocate-budget", "admin_headers"),
    ("patch", f"/api/v1/admin/users/{COMPLAINT_ID}/status", "admin_headers"),
    ("post", "/api/v1/agency/tenders/1/proposal", "agency_headers"),
    ("patch", "/api/v1/agency/work-orders/1/status", "agency_headers"),
    ("post", "/api/v1/complaints", "citizen_headers"),
    ("put", f"/api/v1/complaints/{COMPLAINT_ID}", "citizen_headers"),
    ("post", f"/api/v1/officer/complaints/{COMPLAINT_ID}/review-report", "officer_headers"),
    ("post", f"/api/v1/officer/complaints/{COMPLAINT_ID}/tender", "officer_headers"),
    ("patch", "/api/v1/officer/proposals/1/status", "officer_headers"),
    ("post", "/api/v1/officer/proposals/1/work-order", "officer_headers"),
]


@pytest.mark.parametrize("method,path,header_fixture", VALIDATION_CASES)
def test_endpoint_returns_422_for_invalid_required_input(client, request, method, path, header_fixture):
    """Every endpoint with a request schema rejects an empty request as invalid."""
    response = getattr(client, method)(path, headers=request.getfixturevalue(header_fixture), json={})
    assert response.status_code == 422


# method, URL, header, schema object/class to bypass, is_class, service method, status for ValueError
WRITE_SERVICE_CASES = [
    ("post", f"/api/v1/admin/complaints/{COMPLAINT_ID}/assign", "admin_headers", "app.routes.admin_complaint_route.AssignComplaintSchema", True, "app.routes.admin_complaint_route.AdminComplaintService.assign_complaint", 404),
    ("patch", f"/api/v1/admin/complaints/{COMPLAINT_ID}/allocate-budget", "admin_headers", "app.routes.admin_complaint_route.allocate_budget_schema", False, "app.routes.admin_complaint_route.AdminBudgetService.allocate_budget", 400),
    ("patch", f"/api/v1/admin/users/{COMPLAINT_ID}/status", "admin_headers", "app.routes.admin_user_route.update_status_schema", False, "app.routes.admin_user_route.AdminUserService.update_user_status", 404),
    ("patch", "/api/v1/agency/work-orders/1/status", "agency_headers", "app.routes.agency_route.UpdateWorkOrderStatusSchema", True, "app.routes.agency_route.AgencyService.update_work_order_status", 400),
    ("put", f"/api/v1/complaints/{COMPLAINT_ID}", "citizen_headers", "app.routes.complaint_route.ComplaintSchema", True, "app.routes.complaint_route.ComplaintService.update_complaint", 404),
    ("post", f"/api/v1/officer/complaints/{COMPLAINT_ID}/review-report", "officer_headers", "app.routes.officer_route.create_review_report_schema", False, "app.routes.officer_route.OfficerService.submit_review_report", 400),
    ("post", f"/api/v1/officer/complaints/{COMPLAINT_ID}/tender", "officer_headers", "app.routes.officer_route.create_tender_schema", False, "app.routes.officer_route.OfficerService.create_tender", 400),
    ("patch", "/api/v1/officer/proposals/1/status", "officer_headers", "app.routes.officer_route.update_proposal_status_schema", False, "app.routes.officer_route.OfficerService.update_proposal_status", 400),
    ("post", "/api/v1/officer/proposals/1/work-order", "officer_headers", "app.routes.officer_route.CreateWorkOrderSchema", True, "app.routes.officer_route.OfficerService.create_work_order", 400),
]


def _set_schema_to_valid(schema_mock, is_class):
    schema = schema_mock.return_value if is_class else schema_mock
    schema.load.return_value = {}


@pytest.mark.parametrize(
    "method,path,header_fixture,schema_target,is_class,service_target,expected_status",
    WRITE_SERVICE_CASES,
)
def test_write_endpoint_returns_documented_value_error_status(
    client, request, method, path, header_fixture, schema_target, is_class, service_target, expected_status
):
    """Each write route maps a business ValueError to its documented response."""
    with patch(schema_target) as schema_mock, patch(service_target, side_effect=ValueError("expected test error")):
        _set_schema_to_valid(schema_mock, is_class)
        response = getattr(client, method)(path, headers=request.getfixturevalue(header_fixture), json={})
    assert response.status_code == expected_status


@pytest.mark.parametrize(
    "method,path,header_fixture,schema_target,is_class,service_target,expected_status",
    WRITE_SERVICE_CASES,
)
def test_write_endpoint_returns_500_when_service_fails(
    client, request, method, path, header_fixture, schema_target, is_class, service_target, expected_status
):
    """Each write route maps an unexpected service failure to HTTP 500."""
    with patch(schema_target) as schema_mock, patch(service_target, side_effect=RuntimeError("unexpected test error")):
        _set_schema_to_valid(schema_mock, is_class)
        response = getattr(client, method)(path, headers=request.getfixturevalue(header_fixture), json={})
    assert response.status_code == 500


@pytest.mark.parametrize("error_type,expected_status", [(ValueError, 400), (RuntimeError, 500)])
def test_submit_proposal_returns_documented_error_status(client, agency_headers, error_type, expected_status):
    """Agency proposal upload reaches the service only after a valid document is supplied."""
    with patch("app.routes.agency_route.create_proposal_schema") as schema, \
         patch("app.routes.agency_route.validate_document"), \
         patch("app.routes.agency_route.AgencyService.submit_proposal", side_effect=error_type("expected test error")):
        schema.load.return_value = {}
        response = client.post(
            "/api/v1/agency/tenders/1/proposal",
            headers=agency_headers,
            data={"proposal_document": (BytesIO(b"PDF test data"), "proposal.pdf")},
            content_type="multipart/form-data",
        )
    assert response.status_code == expected_status


@pytest.mark.parametrize("error_type,expected_status", [(ValueError, 404), (RuntimeError, 500)])
def test_create_complaint_returns_documented_error_status(client, citizen_headers, error_type, expected_status):
    """Complaint creation validates the request before mapping a service error."""
    with patch("app.routes.complaint_route.ComplaintSchema") as schema, \
         patch("app.routes.complaint_route.validate_images"), \
         patch("app.routes.complaint_route.ComplaintService.create_complaint", side_effect=error_type("expected test error")):
        schema.return_value.load.return_value = {}
        response = client.post("/api/v1/complaints", headers=citizen_headers, data={})
    assert response.status_code == expected_status
