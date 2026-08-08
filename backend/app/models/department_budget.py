from app.extensions import db
from app.models.base_model import BaseModel


class DepartmentBudget(BaseModel):
    """
    A department's budget for one financial year. `total_amount` is the ceiling
    the admin funds; `allocated_amount` is how much has been committed to
    complaints (utilization). Available = total - allocated.
    """

    __tablename__ = "department_budgets"

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

    # Indian financial year, e.g. "2026-27".
    financial_year = db.Column(
        db.String(9),
        nullable=False,
    )

    total_amount = db.Column(
        db.Numeric(14, 2),
        nullable=False,
        default=0,
    )

    allocated_amount = db.Column(
        db.Numeric(14, 2),
        nullable=False,
        default=0,
    )

    __table_args__ = (
        db.UniqueConstraint(
            "department_id",
            "financial_year",
            name="uq_department_budget_year",
        ),
    )

    department = db.relationship(
        "Department",
        backref="budgets",
    )

    def __repr__(self):
        return (
            f"<DepartmentBudget dept={self.department_id} "
            f"fy={self.financial_year}>"
        )
