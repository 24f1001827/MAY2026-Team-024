from app.models import Agency
from app.extensions import db
from app.models import User,UserStatus

class AgencyRepository:
    """
    Handles all Agency database operations.
    """

    @staticmethod
    def create(data: dict) -> Agency:
        """
        Create a new agency.

        Args:
            data: Agency model fields.

        Returns:
            Newly created Agency instance.
        """

        agency = Agency(**data)

        db.session.add(agency)

        return agency

    @staticmethod
    def get_by_user_id(user_id):
        """
        Retrieve an agency by user ID.

        Args:
            user_id: User UUID.

        Returns:
            Agency | None
        """

        return Agency.query.filter_by(
            user_id=user_id
        ).first()

    @staticmethod
    def get_by_registration_number(registration_number: str):
        """
        Retrieve an agency by registration number.

        Args:
            registration_number: Agency registration number.

        Returns:
            Agency | None
        """

        return Agency.query.filter_by(
            registration_number=registration_number
        ).first()

    @staticmethod
    def get_by_license_number(license_number: str):
        """
        Retrieve an agency by license number.

        Args:
            license_number: Agency license number.

        Returns:
            Agency | None
        """

        return Agency.query.filter_by(
            license_number=license_number
        ).first()

    @staticmethod
    def get_all():
        """
        Retrieve all avtive agencies.
        
        """

        return Agency.query.join(Agency.user).filter(
                        User.status == UserStatus.ACTIVE,
                        Agency.deleted_at.is_(None)
                    ).all()