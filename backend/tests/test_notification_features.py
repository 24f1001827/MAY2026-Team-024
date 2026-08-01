from datetime import datetime
from unittest.mock import MagicMock, patch
import pytest

from app.services.notification_service import NotificationService


@patch("app.services.notification_service.NotificationRepository")
@patch("app.services.notification_service.UserRepository")
@patch("app.services.notification_service.get_jwt_identity", return_value="user-1")
def test_notification_service_gets_current_user_notifications(mock_identity, mock_users, mock_notifications):
    user = MagicMock(id="user-1"); mock_users.get_by_id.return_value = user; mock_notifications.get_by_user_id.return_value = [MagicMock()]
    assert len(NotificationService.get_notifications()) == 1
    mock_notifications.get_by_user_id.assert_called_once_with("user-1")


@patch("app.services.notification_service.UserRepository")
@patch("app.services.notification_service.get_jwt_identity", return_value="missing")
def test_notification_service_rejects_unknown_user(mock_identity, mock_users):
    mock_users.get_by_id.return_value = None
    with pytest.raises(PermissionError, match="User not found"):
        NotificationService.get_notifications()


@patch("app.services.notification_service.db.session")
@patch("app.services.notification_service.NotificationRepository")
@patch("app.services.notification_service.UserRepository")
@patch("app.services.notification_service.get_jwt_identity", return_value="user-1")
def test_notification_service_marks_own_notification_read(mock_identity, mock_users, mock_notifications, mock_db):
    user = MagicMock(id="user-1"); notification = MagicMock(user_id="user-1", is_read=False)
    mock_users.get_by_id.return_value=user; mock_notifications.get_by_id.return_value=notification
    assert NotificationService.mark_as_read(1) == notification
    assert notification.is_read is True and notification.read_at is not None
    mock_notifications.update.assert_called_once_with(notification)
    mock_db.commit.assert_called_once()


@patch("app.services.notification_service.NotificationRepository")
@patch("app.services.notification_service.UserRepository")
@patch("app.services.notification_service.get_jwt_identity", return_value="user-1")
def test_notification_service_rejects_other_users_notification(mock_identity, mock_users, mock_notifications):
    mock_users.get_by_id.return_value=MagicMock(id="user-1"); mock_notifications.get_by_id.return_value=MagicMock(user_id="user-2")
    with pytest.raises(PermissionError, match="not authorized"):
        NotificationService.mark_as_read(1)


def test_notification_routes(client, citizen_headers):
    now=datetime.now(); item=MagicMock(id=1, type=MagicMock(value="StatusChange"), title="Update", message="Changed", is_read=False, read_at=None, created_at=now)
    with patch("app.routes.notification_route.NotificationService.get_notifications", return_value=[item]):
        response=client.get("/api/v1/notifications",headers=citizen_headers)
    assert response.status_code == 200 and response.get_json()["data"][0]["id"] == 1


def test_notification_mark_read_route_not_found(client, citizen_headers):
    with patch("app.routes.notification_route.NotificationService.mark_as_read", side_effect=ValueError("Notification not found.")):
        response=client.patch("/api/v1/notifications/1/read",headers=citizen_headers)
    assert response.status_code == 404


def test_notification_mark_all_read_route(client, citizen_headers):
    with patch("app.routes.notification_route.NotificationService.mark_all_as_read") as service:
        response=client.patch("/api/v1/notifications/read-all",headers=citizen_headers)
    assert response.status_code == 200
    service.assert_called_once()
