from app.repositories import (
    DepartmentRepository,
    OfficerRepository,
    ComplaintRepository,
)
from app.extensions import db
from app.models import Officer
from app.services.settings_service import SettingsService


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
    def _sync_head_flag(old_head_id, new_head_id):
        """
        Keep officers.is_department_head in sync with a department's
        head_officer_id: clear the previous head's flag and set the new one.
        No-op when the head is unchanged.
        """

        if old_head_id == new_head_id:
            return

        if old_head_id is not None:
            old = Officer.query.filter_by(user_id=old_head_id).first()
            if old is not None:
                old.is_department_head = False

        if new_head_id is not None:
            new = Officer.query.filter_by(user_id=new_head_id).first()
            if new is not None:
                new.is_department_head = True

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

        DepartmentService._sync_head_flag(
            None,
            data.get("head_officer_id"),
        )

        db.session.commit()

        return department

    @staticmethod
    def get_all_departments():
        """
        Retrieve all departments.
        """

        return DepartmentRepository.get_all()

    @staticmethod
    def get_department_dashboard(department_id):
        """
        Aggregate dashboard for a specific department (admin view): the
        department, its officers, and its complaints. Same shape as the officer
        dashboard; `is_department_head` is False since the admin isn't the head.
        """

        department = DepartmentRepository.get_by_id(department_id)

        if department is None:
            raise ValueError("Department not found.")

        officers = OfficerRepository.get_by_department_id(department_id)

        complaints = ComplaintRepository.get_by_department(department_id)

        return {
            "department": department,
            "officers": officers,
            "complaints": complaints,
            "is_department_head": False,
            "manual_allotment": SettingsService.is_manual_allotment(),
        }

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

        old_head_id = department.head_officer_id

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

        if "head_officer_id" in data:
            DepartmentService._sync_head_flag(
                old_head_id,
                data["head_officer_id"],
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