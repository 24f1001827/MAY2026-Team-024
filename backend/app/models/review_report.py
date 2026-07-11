from app.extensions import db
from app.models.base_model import BaseModel
from app.models.enums import ReviewDecision


class ReviewReport(BaseModel):
    __tablename__ = "review_reports"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
    )

    complaint_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("complaints.id"),
        nullable=False,
        unique=True,
    )

    officer_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("officers.user_id"),
        nullable=False,
    )

    findings = db.Column(
        db.Text,
        nullable=False,
    )

    estimated_cost = db.Column(
        db.Numeric(12, 2),
        nullable=True,
    )

    estimated_duration_days = db.Column(
        db.Integer,
        nullable=True,
    )

    decision = db.Column(
        db.Enum(ReviewDecision),
        nullable=False,
    )

    # -------------------------
    # Relationships
    # -------------------------

    complaint = db.relationship(
        "Complaint",
        back_populates="review_report",
    )

    officer = db.relationship(
        "Officer",
        back_populates="review_reports",
    )

    def __repr__(self):
        return f"<ReviewReport {self.id}>"