from app.extensions import db
from app.models import User

from datetime import datetime
from app.models.base_model import IST

class UserRepository:
    """
    Data-access layer for the User model. Keeps all direct
    SQLAlchemy/query logic here so services (like AuthService)
    don't talk to the ORM directly.
    """

    @staticmethod
    def create(user: User) -> User:
        """
        Create a new user.

        Adds the given User object to the session and commits it,
        persisting it to the database. Returns the same object,
        now populated with DB-generated fields (e.g. id, created_at).
        """

        db.session.add(user)
        db.session.commit()

        return user

    @staticmethod
    def get_by_email(email: str) -> User | None:
        """
        Get user by email.

        Excludes soft-deleted users (deleted_at is None). Returns
        None if no matching, non-deleted user exists.
        """

        return User.query.filter_by(
            email=email,
            deleted_at=None,
        ).first()

    @staticmethod
    def get_by_id(user_id) -> User | None:
        """
        Get user by id.

        Excludes soft-deleted users (deleted_at is None). Returns
        None if no matching, non-deleted user exists.
        """

        return User.query.filter_by(
            id=user_id,
            deleted_at=None,
        ).first()

    @staticmethod
    def update():
        """
        Commit changes.

        Call this after mutating attributes directly on a User
        instance you already have in hand, to persist those
        changes to the database.
        """

        db.session.commit()

    @staticmethod
    def soft_delete(user: User):
        """
        Soft delete user.

        Rather than removing the row, marks it as deleted by setting
        deleted_at to the current time (in IST). This preserves the
        record for auditing/history while excluding it from normal
        lookups like get_by_email and get_by_id.
        """

        user.deleted_at = datetime.now(IST)

        db.session.commit()