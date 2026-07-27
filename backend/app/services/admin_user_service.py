from app.models.enums import UserStatus,UserRole
from app.repositories import UserRepository


class AdminUserService:
    """
    Service class for admin user management.
    """

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
            raise ValueError("User not found.")

        new_status = data["status"]

        if user.status == new_status:
            raise ValueError(
                f"User is already {new_status.value.lower()}."
            )

        if user.role ==UserRole.ADMIN:
            raise PermissionError("Admin cannot be modified.")

        # Optional business rules

        if (
            user.status == UserStatus.PENDING_APPROVAL
            and new_status == UserStatus.BLOCKED
        ):
            raise ValueError(
                "Pending users must be approved or rejected first."
            )

        if (
            user.status == UserStatus.REJECTED
            and new_status == UserStatus.BLOCKED
        ):
            raise ValueError(
                "Rejected users cannot be blocked."
            )
        
        if (
            user.status != UserStatus.PENDING_APPROVAL
            and new_status == UserStatus.PENDING_APPROVAL
        ):
            raise ValueError(
                "Can not change status to pending approval"
            )
    

        user.status = new_status

        UserRepository.update()

        return user