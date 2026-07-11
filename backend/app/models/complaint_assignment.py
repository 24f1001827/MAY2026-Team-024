from app.extensions import db
from app.models.base_model import BaseModel
from app.models.enums import AssignmentStatus,AssignedBy
from .base_model import IST
from datetime import datetime

class ComplaintAssignment(BaseModel):
    __tablename__ = "complaint_assignments"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
    )

    complaint_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("complaints.id"),
        nullable=False,
    )

    officer_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("officers.user_id"),
        nullable=False,
    )

    assigned_by = db.Column(
        db.Enum(AssignedBy),
        nullable=False
    )

    status = db.Column(
        db.Enum(AssignmentStatus),
        default=AssignmentStatus.PENDING,
        nullable=False,
    )

    assignment_note = db.Column(
        db.Text,
        nullable=True,
    )


    accepted_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
    )

    # -------------------------
    # Relationships
    # -------------------------

    complaint = db.relationship(
        "Complaint",
        back_populates="assignments",
    )

    officer = db.relationship(
        "Officer",
        back_populates="assignments",
    )


    def __repr__(self):
        return (
            f"<ComplaintAssignment "
            f"Complaint={self.complaint_id} "
            f"Officer={self.officer_id}>"
        )