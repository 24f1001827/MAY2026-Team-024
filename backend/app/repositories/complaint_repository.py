from app.extensions import db
from app.models.complaint import Complaint
from datetime import datetime, timedelta
from app.models import IST
from sqlalchemy import and_, func

class ComplaintRepository:
    """
    Repository for complaint database operations.
    """

    @staticmethod
    def create(data):
        """
        Create a new complaint.
        """

        complaint = Complaint(**data)

        db.session.add(complaint)

        return complaint

    @staticmethod
    def get_by_id(complaint_id):
        """
        Retrieve a complaint by its ID.
        """

        return Complaint.query.filter_by(
            id=complaint_id,
            deleted_at=None,
        ).first()

    @staticmethod
    def get_by_citizen_id(citizen_id):
        """
        Retrieve all complaints created by a citizen.
        """

        return (
            Complaint.query.filter_by(
                citizen_id=citizen_id,
                deleted_at=None,
            )
            .order_by(Complaint.created_at.desc())
            .all()
        )

    @staticmethod
    def get_all(status=None, department_id=None):
        """
        Retrieve all complaints.
        """

        query = Complaint.query.filter_by(deleted_at=None)

        if status:
            query = query.filter_by(status=status)

        if department_id:
            query = query.filter_by(department_id=department_id)

        return query.order_by(
            Complaint.created_at.desc()
        ).all()


    @staticmethod
    def get_by_department(department_id):
        """
        Retrieve complaints belonging to a department.
        """

        return (
            Complaint.query.filter_by(
                department_id=department_id,
                deleted_at=None,
            )
            .order_by(Complaint.created_at.desc())
            .all()
        )

    @staticmethod
    def get_cluster_members(cluster_id):
        return Complaint.query.filter_by(cluster_id=cluster_id, deleted_at=None).all()

    @staticmethod
    def get_cluster_candidates(locality, city, latitude, longitude, exclude_id=None):
        """Cheap geographical prefilter before semantic comparison."""
        query = Complaint.query.filter(
            Complaint.deleted_at.is_(None),
            Complaint.cluster_id.isnot(None),
            Complaint.locality.ilike(locality),
            Complaint.city.ilike(city),
        )
        if exclude_id is not None:
            query = query.filter(Complaint.id != exclude_id)
        # Candidate reports are deliberately limited; semantic matching happens in service.
        return query.order_by(Complaint.created_at.desc()).limit(100).all()

    @staticmethod
    def update():
        """
        Commit pending complaint updates.
        """

        db.session.commit()

    @staticmethod
    def delete(complaint):
        """
        Soft delete a complaint.
        """
        complaint.deleted_at = datetime.now(IST)
        db.session.commit()
