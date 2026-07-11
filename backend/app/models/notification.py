from app.extensions import db
from app.models.base_model import BaseModel
from app.models.enums import NotificationType


class Notification(BaseModel):
    __tablename__ = "notifications"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
    )

    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=False,
    )

    type = db.Column(
        db.Enum(NotificationType),
        nullable=False,
    )

    title = db.Column(
        db.String(255),
        nullable=False,
    )

    message = db.Column(
        db.Text,
        nullable=False,
    )

    is_read = db.Column(
        db.Boolean,
        default=False,
        nullable=False,
    )

    read_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
    )

    # -------------------------
    # Relationships
    # -------------------------

    user = db.relationship(
        "User",
        back_populates="notifications",
    )

    def __repr__(self):
        return f"<Notification {self.id}>"