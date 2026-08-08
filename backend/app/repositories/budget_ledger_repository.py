from app.extensions import db
from app.models import BudgetLedger


class BudgetLedgerRepository:
    """
    Database operations for the department budget ledger.
    """

    @staticmethod
    def create(data):
        entry = BudgetLedger(**data)
        db.session.add(entry)
        return entry

    @staticmethod
    def get_by_department(department_id):
        return (
            BudgetLedger.query.filter_by(
                department_id=department_id,
                deleted_at=None,
            )
            .order_by(BudgetLedger.created_at.desc())
            .all()
        )
