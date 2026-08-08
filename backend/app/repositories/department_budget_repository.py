from app.extensions import db
from app.models import DepartmentBudget


class DepartmentBudgetRepository:
    """
    Database operations for year-wise department budgets.
    """

    @staticmethod
    def get_by_dept_and_year(department_id, financial_year):
        return DepartmentBudget.query.filter_by(
            department_id=department_id,
            financial_year=financial_year,
            deleted_at=None,
        ).first()

    @staticmethod
    def get_by_department(department_id):
        return (
            DepartmentBudget.query.filter_by(
                department_id=department_id,
                deleted_at=None,
            )
            .order_by(DepartmentBudget.financial_year.desc())
            .all()
        )

    @staticmethod
    def list_all():
        return (
            DepartmentBudget.query.filter_by(deleted_at=None)
            .order_by(DepartmentBudget.financial_year.desc())
            .all()
        )

    @staticmethod
    def create(data):
        budget = DepartmentBudget(**data)
        db.session.add(budget)
        return budget
