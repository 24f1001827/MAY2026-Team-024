import uuid
from unittest.mock import MagicMock, patch
from marshmallow import ValidationError
from app.models import UserRole, UserStatus

def test_get_users_success(client, admin_headers):
    users = [MagicMock()]
    with patch("app.routes.admin_user_route.AdminUserService.get_all_users", return_value=users), \
         patch("app.routes.admin_user_route.user_response_schema.dump", return_value=[{"id": "1"}]):
        response = client.get("/api/v1/admin/users", headers=admin_headers)

    assert response.status_code == 200
    assert response.get_json() == {
        "success": True, "message": "Users retrieved successfully.", "data": [{"id": "1"}]
    }

def test_get_users_requires_authentication(client):
    assert client.get("/api/v1/admin/users").status_code == 401

def test_get_users_rejects_citizen_role(client, citizen_headers):
    assert client.get("/api/v1/admin/users", headers=citizen_headers).status_code == 403

def test_get_users_filters_by_role_and_status(client, admin_headers):
    with patch("app.routes.admin_user_route.AdminUserService.get_all_users", return_value=[]) as service, \
         patch("app.routes.admin_user_route.user_response_schema.dump", return_value=[]):
        response = client.get(
            "/api/v1/admin/users",
            headers=admin_headers,
            query_string={"role": UserRole.CITIZEN.value, "status": UserStatus.ACTIVE.value},
        )

    assert response.status_code == 200
    assert service.call_args.kwargs["role"] == UserRole.CITIZEN
    assert service.call_args.kwargs["status"] == UserStatus.ACTIVE

def test_get_users_rejects_invalid_role(client, admin_headers):
    response = client.get("/api/v1/admin/users?role=invalid-role", headers=admin_headers)
    assert response.status_code == 400
    assert response.get_json()["success"] is False

def test_update_user_status_success(client, admin_headers):
    user_id = uuid.uuid4()

    user = MagicMock()
    user.role = UserRole.CITIZEN
    user.status = UserStatus.ACTIVE

    with patch(
        "app.routes.admin_user_route.update_status_schema.load",
        return_value={"status": UserStatus.ACTIVE},
    ), patch(
        "app.routes.admin_user_route.AdminUserService.update_user_status",
        return_value=(user, UserStatus.PENDING_APPROVAL),
    ) as service, patch(
        "app.routes.admin_user_route.UserResponseSchema"
    ) as response_schema:
        response_schema.return_value.dump.return_value = {
            "id": str(user_id),
            "status": "active",
        }

        response = client.patch(
            f"/api/v1/admin/users/{user_id}/status",
            headers=admin_headers,
            json={"status": "active"},
        )

    assert response.status_code == 200
    assert response.get_json()["success"] is True
    assert response.get_json()["data"]["status"] == "active"

    service.assert_called_once_with(
        user_id,
        {"status": UserStatus.ACTIVE},
    )

def test_update_user_status_validation_error(client, admin_headers):
    user_id = uuid.uuid4()
    with patch("app.routes.admin_user_route.update_status_schema.load", side_effect=ValidationError({"status": ["Field required."]})):
        response = client.patch(f"/api/v1/admin/users/{user_id}/status", headers=admin_headers, json={})

    assert response.status_code == 422
    assert response.get_json()["errors"]["status"] == ["Field required."]

def test_update_user_status_not_found(client, admin_headers):
    user_id = uuid.uuid4()
    with patch("app.routes.admin_user_route.update_status_schema.load", return_value={"status": UserStatus.ACTIVE}), \
         patch("app.routes.admin_user_route.AdminUserService.update_user_status", side_effect=ValueError("User not found.")):
        response = client.patch(f"/api/v1/admin/users/{user_id}/status", headers=admin_headers, json={"status": "active"})

    assert response.status_code == 400
    assert response.get_json()["message"] == "User not found."

def test_update_user_status_server_error(client, admin_headers):
    user_id = uuid.uuid4()
    with patch("app.routes.admin_user_route.update_status_schema.load", return_value={"status": UserStatus.ACTIVE}), \
         patch("app.routes.admin_user_route.AdminUserService.update_user_status", side_effect=Exception("db down")):
        response = client.patch(f"/api/v1/admin/users/{user_id}/status", headers=admin_headers, json={"status": "active"})
    assert response.status_code == 500
    assert response.get_json()["message"] == "Internal server error."