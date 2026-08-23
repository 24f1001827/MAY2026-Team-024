from app.extensions import db
from app.models import ComplaintAssignment, AssignmentStatus


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

    #: Assignment states that no longer put a complaint on anyone's plate.
    INACTIVE_STATUSES = (AssignmentStatus.REJECTED, AssignmentStatus.ESCALATED)

    @staticmethod
    def get_by_complaint_id(complaint_id):
        """
        Retrieve the latest assignment for a complaint, whatever its state.

        Use `get_active_by_complaint_id` to ask "is someone handling this?" —
        this one includes rejected rows and is for history/most-recent lookups.
        """
        return (
            ComplaintAssignment.query.filter_by(
                complaint_id=complaint_id,
                deleted_at=None,
            )
            .order_by(ComplaintAssignment.created_at.desc())
            .first()
        )

    @staticmethod
    def get_active_by_complaint_id(complaint_id):
        """
        The assignment currently putting this complaint on an officer's plate,
        or None when it is unowned (never allotted, or the last one rejected).

        Mirrors `ComplaintResponseSchema.get_assigned_officer_id`, so the API's
        idea of "assigned" and the allotment guard's cannot drift apart.
        """
        return (
            ComplaintAssignment.query.filter(
                ComplaintAssignment.complaint_id == complaint_id,
                ComplaintAssignment.deleted_at.is_(None),
                ComplaintAssignment.status.notin_(
                    ComplaintAssignmentRepository.INACTIVE_STATUSES
                ),
            )
            .order_by(ComplaintAssignment.created_at.desc())
            .first()
        )

    @staticmethod
    def get_all_by_complaint_id(complaint_id):
        """Every assignment ever made for a complaint, newest first."""
        return (
            ComplaintAssignment.query.filter_by(
                complaint_id=complaint_id,
                deleted_at=None,
            )
            .order_by(ComplaintAssignment.created_at.desc())
            .all()
        )

    @staticmethod
    def get_rejected_officer_ids(complaint_id):
        """
        Officers who have already rejected this complaint — so re-allotment
        doesn't hand it straight back to someone who just refused it.
        """
        rows = (
            ComplaintAssignment.query.with_entities(
                ComplaintAssignment.officer_id
            )
            .filter(
                ComplaintAssignment.complaint_id == complaint_id,
                ComplaintAssignment.deleted_at.is_(None),
                ComplaintAssignment.status == AssignmentStatus.REJECTED,
            )
            .all()
        )
        return {row.officer_id for row in rows}

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
    def get_by_officer_and_complaint(officer_id, complaint_id):
        """
        Retrieve an assignment for a specific officer and complaint.
        """
        return (
            ComplaintAssignment.query.filter_by(
                officer_id=officer_id,
                complaint_id=complaint_id,
                deleted_at=None,
            )
            .order_by(ComplaintAssignment.created_at.desc())
            .first()
        )

    @staticmethod
    def update():
        """
        Commit any updates made to an assignment.
        """
        db.session.commit()