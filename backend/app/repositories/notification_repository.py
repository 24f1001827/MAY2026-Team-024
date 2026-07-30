from app.extensions import db
from app.models import Notification,IST
from datetime import datetime


class NotificationRepository:
    """
    Repository for notification operations.
    """

    @staticmethod
    def create(data):
        """
        Create notification.
        """

        notification = Notification(**data)

        db.session.add(notification)

        return notification

    @staticmethod
    def get_by_id(notification_id):
        """
        Retrieve notification by ID.
        """

        return (
            Notification.query.filter_by(
                id=notification_id,
                deleted_at=None,
            ).first()
        )

    @staticmethod
    def mark_all_as_read(user_id):
        """
        Mark all notifications as read.
        """

        notifications = Notification.query.filter_by(
            user_id=user_id,
            is_read=False,
            deleted_at=None,
        ).all()

        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.now(IST)

        return notifications

    @staticmethod
    def get_by_user_id(user_id):
        """
        Retrieve notifications of a user.
        """

        return (
            Notification.query.filter_by(
                user_id=user_id,
                deleted_at=None,
            )
            .order_by(
                Notification.created_at.desc(),
            )
            .all()
        )

    @staticmethod
    def update(notification):
        """
        Update notification.
        """

        db.session.add(notification)

        return notification