from app.models.enums import UserStatus,UserRole
from app.repositories import UserRepository
from app.extensions import db


class AdminUserService:
    """
    Service class for admin user management.
    """

    @staticmethod
    def update_officer_max_workload(user_id, data):
        """
        Set an officer's maximum workload (capacity). `current_workload` stays
        system-managed (derived from assignments) and is never edited here.
        """

        user = UserRepository.get_by_id(user_id)

        if user is None:
            raise ValueError("User not found.")

        if user.role != UserRole.OFFICER or user.officer is None:
            raise ValueError("User is not an officer.")

        max_workload = data["max_workload"]

        if max_workload < user.officer.current_workload:
            raise ValueError(
                "Max workload cannot be below the officer's current workload "
                f"({user.officer.current_workload})."
            )

        user.officer.max_workload = max_workload

        db.session.commit()

        return user

    @staticmethod
    def get_all_users(role=None, status=None):
        """
        Retrieve all users with optional filters.
        """

        return UserRepository.get_all(
            role=role,
            status=status,
        )

    @staticmethod
    def update_user_status(user_id, data):
        """
        Update the status of a user.
        """

        user = UserRepository.get_by_id(user_id)

        if user is None:
            raise ValueError(
                "User not found."
            )

        if user.role == UserRole.ADMIN:
            raise PermissionError(
                "Admin cannot be modified."
            )

        current_status = user.status
        new_status = data["status"]

        if current_status == new_status:
            raise ValueError(
                f"User is already {new_status.value.lower()}."
            )

        if current_status == UserStatus.PENDING_APPROVAL:

            if new_status == UserStatus.BLOCKED:
                raise ValueError(
                    "Pending users must be approved or rejected first."
                )

            if new_status not in {
                UserStatus.ACTIVE,
                UserStatus.REJECTED,
            }:
                raise ValueError(
                    "Invalid status transition for a pending user."
                )

        elif current_status == UserStatus.REJECTED:

            if new_status == UserStatus.BLOCKED:
                raise ValueError(
                    "Rejected users cannot be blocked."
                )

            if new_status != UserStatus.ACTIVE:
                raise ValueError(
                    "Rejected users can only be activated."
                )

        elif current_status == UserStatus.ACTIVE:

            if new_status != UserStatus.BLOCKED:
                raise ValueError(
                    "Active users can only be blocked."
                )

        elif current_status == UserStatus.BLOCKED:

            if new_status != UserStatus.ACTIVE:
                raise ValueError(
                    "Blocked users can only be unblocked."
                )

        user.status = new_status

        UserRepository.update()

        return user, current_status