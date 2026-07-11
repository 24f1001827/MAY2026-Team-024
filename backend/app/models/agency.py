from app.extensions import db
from app.models.base_model import BaseModel


class Agency(BaseModel):
    __tablename__ = "agencies"

    user_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        primary_key=True,
    )

    registration_number = db.Column(
        db.String(100),
        unique=True,
        nullable=False,
    )

    license_number = db.Column(
        db.String(100),
        unique=True,
        nullable=False,
    )

    contact_person = db.Column(
        db.String(100),
        nullable=False,
    )

    current_projects = db.Column(
        db.Integer,
        default=0,
        nullable=False,
    )

    max_projects = db.Column(
        db.Integer,
        default=5,
        nullable=False,
    )

    # -------------------------
    # Relationships
    # -------------------------

    user = db.relationship(
        "User",
        back_populates="agency",

    )

    proposals = db.relationship(
        "AgencyProposal",
        back_populates="agency",
        lazy="select",
    )

    work_orders = db.relationship(
        "WorkOrder",
        back_populates="agency",
        lazy="select",
    )

    def __repr__(self):
        return f"<Agency {self.registration_number}>"