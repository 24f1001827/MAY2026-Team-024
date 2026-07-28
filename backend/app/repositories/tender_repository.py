from app.extensions import db
from app.models import Tender


class TenderRepository:
    """
    Repository for tender database operations.
    """

    @staticmethod
    def create(data):
        tender = Tender(**data)

        db.session.add(tender)

        return tender

    @staticmethod
    def get_by_complaint_id(complaint_id):
        return Tender.query.filter_by(
            complaint_id=complaint_id,
            deleted_at=None,
        ).first()

    @staticmethod
    def update():
        db.session.commit()