from app.extensions import db
from app.models import ComplaintAssignment


class ComplaintAssignmentRepository:
    """
    Repository for complaint assignment database operations.
    """

    @staticmethod
    def create(data):
        """
        Create a new complaint assignment.
        """
        assignment = ComplaintAssignment(**data)

        db.session.add(assignment)

        return assignment

    @staticmethod
    def get_by_id(assignment_id):
        """
        Retrieve an assignment by its ID.
        """
        return ComplaintAssignment.query.filter_by(
            id=assignment_id,
            deleted_at=None,
        ).first()

    @staticmethod
    def get_by_complaint_id(complaint_id):
        """
        Retrieve the current assignment for a complaint.
        """
        return ComplaintAssignment.query.filter_by(
            complaint_id=complaint_id,
            deleted_at=None,
        ).first()

    @staticmethod
    def get_by_officer_id(officer_id):
        """
        Retrieve all assignments assigned to a specific officer.
        """
        return (
            ComplaintAssignment.query.filter_by(
                officer_id=officer_id,
                deleted_at=None,
            )
            .order_by(ComplaintAssignment.created_at.desc())
            .all()
        )

    @staticmethod
    def update():
        """
        Commit any updates made to an assignment.
        """
        db.session.commit()