"""One independent 401 and 403 test case for every protected API endpoint."""

import pytest


COMPLAINT_ID = "11111111-1111-1111-1111-111111111111"

# method, URL, role that is allowed to reach the route handler
ROLE_PROTECTED_ENDPOINTS = [
    ("get", "/api/v1/admin/complaints", "admin"),
    ("get", f"/api/v1/admin/complaints/{COMPLAINT_ID}", "admin"),
    ("get", f"/api/v1/admin/complaints/{COMPLAINT_ID}/officers", "admin"),
    ("post", f"/api/v1/admin/complaints/{COMPLAINT_ID}/assign", "admin"),
    ("patch", f"/api/v1/admin/complaints/{COMPLAINT_ID}/allocate-budget", "admin"),
    ("get", "/api/v1/admin/users", "admin"),
    ("patch", f"/api/v1/admin/users/{COMPLAINT_ID}/status", "admin"),
    ("get", "/api/v1/agency/tenders", "agency"),
    ("get", "/api/v1/agency/tenders/1", "agency"),
    ("post", "/api/v1/agency/tenders/1/proposal", "agency"),
    ("get", "/api/v1/agency/proposals", "agency"),
    ("get", "/api/v1/agency/work-orders", "agency"),
    ("get", "/api/v1/agency/work-orders/1", "agency"),
    ("patch", "/api/v1/agency/work-orders/1/status", "agency"),
    ("post", "/api/v1/complaints", "citizen"),
    ("get", "/api/v1/complaints/my", "citizen"),
    ("put", f"/api/v1/complaints/{COMPLAINT_ID}", "citizen"),
    ("delete", f"/api/v1/complaints/{COMPLAINT_ID}", "citizen"),
    ("get", "/api/v1/officer/complaints", "officer"),
    ("patch", f"/api/v1/officer/complaints/{COMPLAINT_ID}/accept", "officer"),
    ("patch", f"/api/v1/officer/complaints/{COMPLAINT_ID}/reject", "officer"),
    ("post", f"/api/v1/officer/complaints/{COMPLAINT_ID}/review-report", "officer"),
    ("get", f"/api/v1/officer/complaints/{COMPLAINT_ID}", "officer"),
    ("post", f"/api/v1/officer/complaints/{COMPLAINT_ID}/budget-request", "officer"),
    ("post", f"/api/v1/officer/complaints/{COMPLAINT_ID}/tender", "officer"),
    ("get", "/api/v1/officer/tenders/1/proposals", "officer"),
    ("get", "/api/v1/officer/proposals/1", "officer"),
    ("patch", "/api/v1/officer/proposals/1/status", "officer"),
    ("post", "/api/v1/officer/proposals/1/work-order", "officer"),
    ("patch", "/api/v1/officer/work-orders/1/verify", "officer"),
]

JWT_ONLY_ENDPOINTS = [
    ("get", "/api/v1/notifications"),
    ("patch", "/api/v1/notifications/1/read"),
    ("patch", "/api/v1/notifications/read-all"),
    ("get", f"/api/v1/complaints/{COMPLAINT_ID}"),
]


@pytest.mark.parametrize(
    "method,path,role",
    ROLE_PROTECTED_ENDPOINTS,
    ids=lambda item: str(item).replace("/", "_").replace(" ", "_"),
)
def test_role_protected_endpoint_returns_401_without_token(client, method, path, role):
    """Every role-protected endpoint rejects a request without a JWT."""
    response = getattr(client, method)(path)
    assert response.status_code == 401


@pytest.mark.parametrize(
    "method,path",
    JWT_ONLY_ENDPOINTS,
    ids=lambda item: str(item).replace("/", "_").replace(" ", "_"),
)
def test_jwt_only_endpoint_returns_401_without_token(client, method, path):
    """Notification endpoints require authentication even without a role rule."""
    response = getattr(client, method)(path)
    assert response.status_code == 401


@pytest.mark.parametrize(
    "method,path,required_role",
    ROLE_PROTECTED_ENDPOINTS,
    ids=lambda item: str(item).replace("/", "_").replace(" ", "_"),
)
def test_role_protected_endpoint_returns_403_for_wrong_role(
    client, request, method, path, required_role
):
    """A citizen JWT is forbidden from every endpoint reserved for another role."""
    header_fixture = "officer_headers" if required_role == "citizen" else "citizen_headers"
    response = getattr(client, method)(path, headers=request.getfixturevalue(header_fixture))
    assert response.status_code == 403
