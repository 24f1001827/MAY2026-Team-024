from app.extensions import db
from app.models import ReviewReport


class ReviewReportRepository:
    """
    Repository for review report database operations.
    """

    @staticmethod
    def create(data):
        """
        Create a review report.
        """
        review_report = ReviewReport(**data)

        db.session.add(review_report)

        return review_report

    @staticmethod
    def get_by_complaint_id(complaint_id):
        """
        Retrieve review report by complaint ID.
        """
        return ReviewReport.query.filter_by(
            complaint_id=complaint_id,
            deleted_at=None,
        ).first()

    @staticmethod
    def update():
        """
        Commit changes.
        """
        db.session.commit()