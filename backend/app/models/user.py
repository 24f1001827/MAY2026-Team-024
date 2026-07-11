import uuid

from app.extensions import db
from app.models.base_model import BaseModel
from app.models.enums import AuthProvider, UserRole, UserStatus


class User(BaseModel):
    __tablename__ = "users"

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name = db.Column(
        db.String(100),
        nullable=False,
    )

    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    phone = db.Column(
        db.String(15),
        nullable=True,
    )

    password_hash = db.Column(
        db.String(255),
        nullable=True,
    )

    provider = db.Column(
        db.Enum(AuthProvider),
        default=AuthProvider.LOCAL,
        nullable=False,
    )

    provider_id = db.Column(
        db.String(255),
        nullable=True,
    )

    role = db.Column(
        db.Enum(UserRole),
        nullable=False,
    )

    status = db.Column(
        db.Enum(UserStatus),
        default=UserStatus.PENDING_APPROVAL,
        nullable=False,
    )

    # --------------------
    # Relationships
    # --------------------

    officer = db.relationship(
        "Officer",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    agency = db.relationship(
        "Agency",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    complaints = db.relationship(
        "Complaint",
        back_populates="citizen",
        lazy=True,
    )

    notifications = db.relationship(
        "Notification",
        back_populates="user",
        lazy=True,
    )

    audit_logs = db.relationship(
        "AuditLog",
        back_populates="user",
        lazy=True,
    )

    def __repr__(self):
        return f"<User {self.email}>"
