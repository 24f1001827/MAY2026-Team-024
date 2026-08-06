from app.extensions import db
from app.models import Department
from sqlalchemy import func
from datetime import datetime
from app.models import IST

class DepartmentRepository:
    """
    Repository for department database operations.
    """

    @staticmethod
    def create(data):
        """
        Create a new department.
        """

        department = Department(**data)

        db.session.add(department)

        return department

    @staticmethod
    def get_all():
        """
        Retrieve all departments.
        """

        return (
            Department.query.filter_by(
                deleted_at=None,
            )
            .order_by(Department.name.asc())
            .all()
        )

    @staticmethod
    def get_by_id(department_id):
        """
        Retrieve a department by its ID.
        """

        return Department.query.filter_by(
            id=department_id,
            deleted_at=None,
        ).first()


    @staticmethod
    def get_by_name(name):
        """
        Retrieve a department by name.
        """

        return (
            Department.query.filter(
                func.lower(Department.name) == name.strip().lower(),
                Department.deleted_at.is_(None),
            ).first()
        )

    @staticmethod
    def update():
        """
        Commit pending department updates.
        """

        db.session.commit()

    @staticmethod
    def delete(department):
        """
        Soft delete a department.
        """

        department.deleted_at = datetime.now(IST)

        db.session.commit()

