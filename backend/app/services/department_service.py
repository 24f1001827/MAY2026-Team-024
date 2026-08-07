from app.repositories import DepartmentRepository
from app.extensions import db
from app.models import Officer


class DepartmentService:
    """
    Service for department operations.
    """

    @staticmethod
    def _validate_head_officer(head_officer_id):
        """
        Ensure a head officer id (if provided) belongs to an actual officer.
        """

        if head_officer_id is None:
            return

        officer = Officer.query.filter_by(
            user_id=head_officer_id,
            deleted_at=None,
        ).first()

        if officer is None:
            raise ValueError(
                "Selected head officer must be an existing officer."
            )

    @staticmethod
    def create_department(data):
        """
        Create a new department.
        """

        department = DepartmentRepository.get_by_name(
            data["name"]
        )

        if department is not None:
            raise ValueError(
                "Department with this name already exists."
            )

        DepartmentService._validate_head_officer(
            data.get("head_officer_id")
        )

        department = DepartmentRepository.create(data)

        db.session.commit()

        return department

    @staticmethod
    def get_all_departments():
        """
        Retrieve all departments.
        """

        return DepartmentRepository.get_all()

    @staticmethod
    def get_department_by_id(department_id):
        """
        Retrieve a department by ID.
        """

        department = DepartmentRepository.get_by_id(
            department_id
        )

        if department is None:
            raise ValueError(
                "Department not found."
            )

        return department

    @staticmethod
    def update_department(
        department_id,
        data,
    ):
        """
        Update a department.
        """

        department = DepartmentRepository.get_by_id(
            department_id
        )

        if department is None:
            raise ValueError(
                "Department not found."
            )

        if (
            "name" in data
            and data["name"] != department.name
        ):
            existing_department = (
                DepartmentRepository.get_by_name(
                    data["name"]
                )
            )

            if existing_department is not None:
                raise ValueError(
                    "Department with this name already exists."
                )

        if "head_officer_id" in data:
            DepartmentService._validate_head_officer(
                data["head_officer_id"]
            )

        for key, value in data.items():
            setattr(
                department,
                key,
                value,
            )

        DepartmentRepository.update()

        return department

    @staticmethod
    def delete_department(
        department_id,
    ):
        """
        Delete a department.
        """

        department = DepartmentRepository.get_by_id(
            department_id
        )

        if department is None:
            raise ValueError(
                "Department not found."
            )

        DepartmentRepository.delete(
            department
        )

        return department