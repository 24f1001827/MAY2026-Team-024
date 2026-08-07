import uuid

from app.extensions import db
from app.models.base_model import BaseModel
from app.models.enums import ComplaintPriority, ComplaintStatus


class Complaint(BaseModel):
    __tablename__ = "complaints"

    id = db.Column(
        db.UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    title = db.Column(
        db.String(255),
        nullable=False,
    )

    description = db.Column(
        db.Text,
        nullable=False,
    )

    citizen_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=False,
    )

    department_id = db.Column(
        db.Integer,
        db.ForeignKey("departments.id"),
        nullable=False,
    )

    priority = db.Column(
        db.Enum(ComplaintPriority),
        nullable=False,
    )

    status = db.Column(
        db.Enum(ComplaintStatus),
        default=ComplaintStatus.SUBMITTED,
        nullable=False,
    )

    latitude = db.Column(
        db.Numeric(10, 7),
        nullable=True,
    )

    longitude = db.Column(
        db.Numeric(10, 7),
        nullable=True,
    )

    address = db.Column(
        db.Text,
        nullable=False,
    )

    locality = db.Column(
        db.Text,
        nullable=False,
    )

    city = db.Column(
        db.String(100),
        nullable=False,
    )

    district = db.Column(
        db.String(100),
        nullable=True,
    )

    state = db.Column(
        db.String(100),
        nullable=False,
    )

    country = db.Column(
        db.String(100),
        nullable=True,
    )

    pincode = db.Column(
        db.String(10),
        nullable=False,
    )

    ai_category = db.Column(
        db.String(100),
        nullable=False,
    )

    ai_priority_score = db.Column(
        db.Integer,
        nullable=False,
    )

    # -------------------------
    # Relationships
    # -------------------------

    citizen = db.relationship(
        "User",
        back_populates="complaints",
    )

    department = db.relationship(
        "Department",
        back_populates="complaints",
    )

    images = db.relationship(
        "ComplaintImage",
        back_populates="complaint",
        cascade="all, delete-orphan",
    )

    remarks = db.relationship(
        "ComplaintRemark",
        back_populates="complaint",
        cascade="all, delete-orphan",
    )

    assignments = db.relationship(
        "ComplaintAssignment",
        back_populates="complaint",
        cascade="all, delete-orphan",
    )

    review_report = db.relationship(
        "ReviewReport",
        back_populates="complaint",
        uselist=False,
        cascade="all, delete-orphan",
    )

    tender = db.relationship(
        "Tender",
        back_populates="complaint",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Complaint {self.id}>"
