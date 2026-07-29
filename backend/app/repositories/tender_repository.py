from app.extensions import db
from app.models import Tender,TenderStatus


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
    def get_open_tenders():
        """
        Retrieve all open tenders.
        """

        return (
            Tender.query.filter_by(
                status=TenderStatus.OPEN,
                deleted_at=None,
            )
            .order_by(Tender.created_at.desc())
            .all()
        )

    @staticmethod
    def update():
        db.session.commit()

    @staticmethod
    def get_by_id(tender_id):
        """
        Retrieve a tender by its ID.
        """

        return Tender.query.filter_by(
            id=tender_id,
            deleted_at=None,
        ).first()