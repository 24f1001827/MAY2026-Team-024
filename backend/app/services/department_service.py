from app.repositories import DepartmentRepository


class DepartmentService:
    """
    Service for department operations.
    """

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

        department = DepartmentRepository.create(data)

        DepartmentRepository.update()

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