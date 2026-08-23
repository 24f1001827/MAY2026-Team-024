from app.models import Officer,AvailabilityStatus,User,UserStatus
from app.extensions import db



class OfficerRepository:

    @staticmethod
    def create(data):

        officer = Officer(**data)

        db.session.add(officer)

        return officer

    @staticmethod
    def get_by_user_id(user_id):

        return Officer.query.filter_by(
            user_id=user_id
        ).first()

    @staticmethod
    def get_by_department_id(department_id):
        """
        Retrieve all active officers belonging to a department.
        """

        return (
            Officer.query.join(User)
        .filter(
            Officer.department_id == department_id,
            Officer.deleted_at.is_(None),
            User.status == UserStatus.ACTIVE,
        )
        .order_by(Officer.created_at.asc())
        .all()
        )

    @staticmethod
    def get_department_head(department_id):
        """
        The active officer who heads a department, or None when it has no head.

        Allotment decisions belong to the head, so hand-backs are addressed
        here rather than to an arbitrary admin.
        """

        return (
            Officer.query.join(User)
            .filter(
                Officer.department_id == department_id,
                Officer.is_department_head.is_(True),
                Officer.deleted_at.is_(None),
                User.status == UserStatus.ACTIVE,
            )
            .first()
        )

    @staticmethod
    def get_all():
        """
        Retrieve all active officers (any department), ordered by name — for the
        shared officer directory.
        """

        return (
            Officer.query.join(User)
            .filter(
                Officer.deleted_at.is_(None),
                User.status == UserStatus.ACTIVE,
            )
            .order_by(User.name.asc())
            .all()
        )