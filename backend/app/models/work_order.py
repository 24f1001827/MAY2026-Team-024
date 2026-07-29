from app.extensions import db
from app.models.base_model import BaseModel
from app.models.enums import WorkOrderStatus


class WorkOrder(BaseModel):
    __tablename__ = "work_orders"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
    )

    tender_id = db.Column(
        db.Integer,
        db.ForeignKey("tenders.id"),
        nullable=False,
        unique=True,
    )

    agency_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("agencies.user_id"),
        nullable=False,
    )

    assigned_by = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
    nullable=False,
)

    scope_of_work = db.Column(
        db.Text,
        nullable=False,
    )

    status = db.Column(
        db.Enum(WorkOrderStatus),
        default=WorkOrderStatus.ASSIGNED,
        nullable=False,
    )

    start_date = db.Column(
        db.Date,
        nullable=True,
    )

    end_date = db.Column(
        db.Date,
        nullable=True,
    )

    completion_proof_url = db.Column(
        db.Text,
        nullable=True,
    )

    remarks = db.Column(
        db.Text,
        nullable=True,
    )

    verified_by = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("officers.user_id"),
        nullable=True,
    )

    verified_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
    )

    # -------------------------
    # Relationships
    # -------------------------

    tender = db.relationship(
        "Tender",
        back_populates="work_order",
    )

    agency = db.relationship(
        "Agency",
        back_populates="work_orders",
    )

    verifier = db.relationship(
        "Officer",
    )

    def __repr__(self):
        return f"<WorkOrder {self.id}>"