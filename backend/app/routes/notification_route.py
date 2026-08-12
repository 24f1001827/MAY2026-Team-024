from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app.services.notification_service import NotificationService


notification_bp = Blueprint(
    "notification",
    __name__,
    url_prefix="/api/v1/notifications",
)


@notification_bp.get("")
@jwt_required()
def get_notifications():
    """
    Retrieve notifications of logged-in user.
    """

    try:
        notifications = NotificationService.get_notifications()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Notifications retrieved successfully.",
                    "data": [
                        {
                            "id": notification.id,
                            "type": notification.type.value,
                            "title": notification.title,
                            "message": notification.message,
                            "is_read": notification.is_read,
                            "read_at": notification.read_at,
                            "created_at": notification.created_at,
                        }
                        for notification in notifications
                    ],
                }
            ),
            200,
        )

    except PermissionError as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": str(e),
                }
            ),
            403,
        )

    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error.",
                    "error": str(e),
                }
            ),
            500,
        )


@notification_bp.patch("/<int:notification_id>/read")
@jwt_required()
def mark_notification_as_read(notification_id):
    """
    Mark notification as read.
    """

    try:
        notification = NotificationService.mark_as_read(
            notification_id
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Notification marked as read.",
                    "data": {
                        "id": notification.id,
                        "is_read": notification.is_read,
                        "read_at": notification.read_at,
                    },
                }
            ),
            200,
        )

    except ValueError as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": str(e),
                }
            ),
            404,
        )

    except PermissionError as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": str(e),
                }
            ),
            403,
        )

    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error.",
                    "error": str(e),
                }
            ),
            500,
        )

@notification_bp.patch("/read-all")
@jwt_required()
def mark_all_notifications_as_read():
    """
    Mark all notifications as read.
    """

    try:
        NotificationService.mark_all_as_read()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "All notifications marked as read.",
                }
            ),
            200,
        )

    except PermissionError as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": str(e),
                }
            ),
            403,
        )

    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error.",
                    "error": str(e),
                }
            ),
            500,
        )