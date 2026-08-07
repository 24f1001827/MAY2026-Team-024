from app.extensions import db
from app.models.base_model import BaseModel


class ComplaintRemark(BaseModel):
    __tablename__ = "complaint_remarks"

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

    # Nullable: system-generated activity (e.g. auto-assignment) has no user
    # author — it renders as "System" on the timeline.
    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=True,
    )

    remark = db.Column(
        db.Text,
        nullable=False,
    )

    is_internal = db.Column(
        db.Boolean,
        default=False,
        nullable=False,
    )

    # Status transition captured with the activity entry (enum values as
    # strings), null for non-status events like creation/updation.
    status_from = db.Column(
        db.String(50),
        nullable=True,
    )

    status_to = db.Column(
        db.String(50),
        nullable=True,
    )

    # -------------------------
    # Relationships
    # -------------------------

    complaint = db.relationship(
        "Complaint",
        back_populates="remarks",
    )

    user = db.relationship(
        "User",
    )

    def __repr__(self):
        return f"<ComplaintRemark {self.id}>"