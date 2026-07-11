from app.extensions import db
from app.models.base_model import BaseModel


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

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

    entity_type = db.Column(
        db.String(50),
        nullable=False,
    )

    entity_id = db.Column(
        db.String(100),
        nullable=False,
    )

    action = db.Column(
        db.String(50),
        nullable=False,
    )

    old_value = db.Column(
        db.JSON,
        nullable=True,
    )

    new_value = db.Column(
        db.JSON,
        nullable=True,
    )

    # -------------------------
    # Relationships
    # -------------------------

    user = db.relationship(
        "User",
        back_populates="audit_logs",
    )

    def __repr__(self):
        return (
            f"<AuditLog "
            f"{self.entity_type} "
            f"{self.action}>"
        )