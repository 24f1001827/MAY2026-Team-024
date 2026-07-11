from app.extensions import db
from app.models.base_model import BaseModel
from app.models.enums import AvailabilityStatus


class Officer(BaseModel):
    __tablename__ = "officers"

    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        primary_key=True,
    )

    department_id = db.Column(
        db.Integer,
        db.ForeignKey("departments.id"),
        nullable=False,
    )

    availability_status = db.Column(
        db.Enum(AvailabilityStatus),
        default=AvailabilityStatus.AVAILABLE,
        nullable=False,
    )

    current_workload = db.Column(
        db.Integer,
        default=0,
        nullable=False,
    )

    max_workload = db.Column(
        db.Integer,
        default=10,
        nullable=False,
    )

    # -------------------------
    # Relationships
    # -------------------------

    user = db.relationship(
        "User",
        back_populates="officer",
        lazy="joined",
    )

    department = db.relationship(
        "Department",
        back_populates="officers",
        lazy="joined",
    )

    review_reports = db.relationship(
        "ReviewReport",
        back_populates="officer",
        lazy="select",
    )

    assignments = db.relationship(
        "ComplaintAssignment",
        back_populates="officer",
        lazy="select",
    )

    def __repr__(self):
        return f"<Officer {self.user_id}>"