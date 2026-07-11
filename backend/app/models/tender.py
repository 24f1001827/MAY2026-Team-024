from app.extensions import db
from app.models.base_model import BaseModel
from app.models.enums import TenderStatus


class Tender(BaseModel):
    __tablename__ = "tenders"

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

    created_by = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=False,
    )

    title = db.Column(
        db.String(255),
        nullable=False,
    )

    description = db.Column(
        db.Text,
        nullable=True,
    )

    estimated_cost = db.Column(
        db.Numeric(12, 2),
        nullable=False,
    )

    closing_date = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
    )

    status = db.Column(
        db.Enum(TenderStatus),
        default=TenderStatus.DRAFT,
        nullable=False,
    )

    # -------------------------
    # Relationships
    # -------------------------

    complaint = db.relationship(
        "Complaint",
        back_populates="tender",
    )

    creator = db.relationship(
        "User",
    )

    proposals = db.relationship(
        "AgencyProposal",
        back_populates="tender",
        cascade="all, delete-orphan",
    )

    work_order = db.relationship(
        "WorkOrder",
        back_populates="tender",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Tender {self.id}>"