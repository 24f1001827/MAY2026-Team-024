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

    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=False,
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