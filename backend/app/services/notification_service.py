from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import Notification,IST
from datetime import datetime
from app.repositories import (
    NotificationRepository,
    UserRepository,
)


class NotificationService:
    """
    Service for notification operations.
    """

    @staticmethod
    def get_notifications():
        """
        Retrieve notifications of logged-in user.
        """

        user = UserRepository.get_by_id(get_jwt_identity())

        if user is None:
            raise PermissionError("User not found.")

        return NotificationRepository.get_by_user_id(user.id)

    @staticmethod
    def mark_as_read(notification_id):
        """
        Mark notification as read.
        """

        user = UserRepository.get_by_id(get_jwt_identity())

        if user is None:
            raise PermissionError("User not found.")

        notification = NotificationRepository.get_by_id(
            notification_id
        )

        if notification is None:
            raise ValueError("Notification not found.")

        if notification.user_id != user.id:
            raise PermissionError(
                "You are not authorized to access this notification."
            )

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(IST)

            NotificationRepository.update(notification)

            db.session.commit()

        return notification

    @staticmethod
    def mark_all_as_read():
        """
        Mark all notifications of logged-in user as read.
        """

        user = UserRepository.get_by_id(get_jwt_identity())

        if user is None:
            raise PermissionError("User not found.")

        notifications = NotificationRepository.mark_all_as_read(
            user.id
        )

        db.session.commit()

        return notifications

    @staticmethod
    def create_notification(data):
        """
        Create notification.
        """

        notification = NotificationRepository.create(data)

        db.session.commit()

        return notification

    