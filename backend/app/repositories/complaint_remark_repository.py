from app.extensions import db
from app.models import ComplaintRemark


class ComplaintRemarkRepository:
    """
    Repository for complaint remark / activity operations.
    """

    @staticmethod
    def create(data):
        """
        Create a complaint remark (added to the session; caller commits).
        """

        remark = ComplaintRemark(**data)

        db.session.add(remark)

        return remark
