from app.extensions import db
import os

from app.models import (
    User,
    UserRole,
    UserStatus,
)

from .security import hash_password
from sqlalchemy import inspect


def create_admin():
    """
    Create a default administrator if one does not exist.
    """
    inspector = inspect(db.engine)

    if "users" not in inspector.get_table_names():
        return

    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")

    if not email or not password:
        raise ValueError(
            "ADMIN_EMAIL and ADMIN_PASSWORD must be set."
        )

    existing_user = User.query.filter_by(
        email=email
    ).first()

    if existing_user:
        print("Admin already exists.")
        return

    user = User(
        name="System Administrator",
        email=email,
        password_hash=hash_password(password),
        phone="9999999999",
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
    )

    db.session.add(user)
    db.session.commit()

    print("Default admin created successfully.")