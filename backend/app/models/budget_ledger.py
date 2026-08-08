from app.extensions import db
from app.models.base_model import BaseModel


class BudgetLedger(BaseModel):
    """
    An audit trail of budget events per department. Each row is either an
    ADDITION (admin funds the department for a year) or an ALLOCATION (budget
    committed to a complaint). Powers the department budget history views.
    """

    __tablename__ = "budget_ledger"

    # entry_type values
    ADDITION = "Addition"
    ALLOCATION = "Allocation"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
    )

    department_id = db.Column(
        db.Integer,
        db.ForeignKey("departments.id"),
        nullable=False,
    )

    financial_year = db.Column(
        db.String(9),
        nullable=False,
    )

    entry_type = db.Column(
        db.String(20),
        nullable=False,
    )

    amount = db.Column(
        db.Numeric(14, 2),
        nullable=False,
    )

    # Set only for ALLOCATION entries (the complaint funded).
    complaint_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("complaints.id"),
        nullable=True,
    )

    note = db.Column(
        db.String(255),
        nullable=True,
    )

    department = db.relationship("Department")

    complaint = db.relationship("Complaint")

    def __repr__(self):
        return (
            f"<BudgetLedger {self.entry_type} dept={self.department_id} "
            f"amount={self.amount}>"
        )
