from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import (
    User,
    UserRole,
    ComplaintAssignment,
    ComplaintStatus,
    AssignmentStatus,
    AssignedBy,
    NotificationType,
)

from app.repositories import (
    UserRepository,
    OfficerRepository,
    ComplaintAssignmentRepository,
    ComplaintRepository,
    ReviewReportRepository,
)

from app.services.notification_service import NotificationService
from app.services.activity_service import ActivityService
from app.services.complaint_service import ComplaintService


class AdminComplaintService:
    """
    Service layer for admin complaint management.
    """

    @staticmethod
    def get_all_complaints():
        """
        Retrieve all complaints in the system.
        """

        user_id = get_jwt_identity()

        user = UserRepository.get_by_id(user_id)

        if not user:
            raise ValueError("User not found.")

        if user.role != UserRole.ADMIN:
            raise PermissionError(
                "Only admins can access this resource."
            )

        complaints = ComplaintRepository.get_all()

        return complaints

    @staticmethod
    def get_review_report(complaint_id):
        """
        The officer's review report for a complaint, or None if not submitted.
        Raises if the complaint doesn't exist.
        """

        complaint = ComplaintRepository.get_by_id(complaint_id)

        if complaint is None:
            raise ValueError("Complaint not found.")

        return ReviewReportRepository.get_by_complaint_id(complaint_id)

    @staticmethod
    def assign_complaint(complaint_id, data):
        """
        Assign a complaint to an officer.
        """

        admin_id = get_jwt_identity()

        admin = UserRepository.get_by_id(admin_id)

        if admin is None:
            raise ValueError("User not found.")

        if admin.role != UserRole.ADMIN:
            raise PermissionError(
                "Only administrators can assign complaints."
            )

        complaint = ComplaintRepository.get_by_id(complaint_id)

        if complaint is None:
            raise ValueError("Complaint not found.")

        officer = OfficerRepository.get_by_user_id(
            data["officer_id"]
        )

        if officer is None:
            raise ValueError("Officer not found.")

        if officer.department_id != complaint.department_id:
            raise ValueError(
                "Officer does not belong to the complaint department."
            )

        existing_assignment = (
            ComplaintAssignmentRepository.get_by_complaint_id(
                complaint_id
            )
        )

        if existing_assignment:
            raise ValueError(
                "Complaint has already been assigned."
            )

        assignment=ComplaintAssignmentRepository.create(
                {
                "complaint_id": complaint.id,
                "officer_id": officer.user_id,
                "assigned_by": AssignedBy.ADMIN,
                "status": AssignmentStatus.PENDING,
                "assignment_note": data.get("assignment_note"),
                }
            )

        previous_status = complaint.status
        complaint.status = ComplaintStatus.ASSIGNED
        ComplaintService.notify_cluster_citizens(complaint, ComplaintStatus.ASSIGNED)
        # Count the case toward the assignee's workload immediately (released on
        # reject / closure).
        officer.current_workload += 1

        ActivityService.record(
            complaint.id,
            f"Assigned to {officer.user.name} by admin.",
            user_id=admin.id,
            status_from=previous_status,
            status_to=ComplaintStatus.ASSIGNED,
        )

        db.session.commit()
        NotificationService.create_notification(
            {
                "user_id": officer.user_id,
                "type": NotificationType.COMPLAINT_ASSIGNED,
                "title": "Complaint Assigned",
                "message": (
                    f"You have been assigned complaint "
                    f"'complaint ID: {complaint.id}, Complaint title: {complaint.title}'."
                ),
            }
        )
                

        return assignment

    @staticmethod
    def get_complaint(complaint_id):
        """
        Retrieve a complaint by its ID.
        """

        user_id = get_jwt_identity()

        user = UserRepository.get_by_id(user_id)

        if user is None:
            raise ValueError("User not found.")

        if user.role != UserRole.ADMIN:
            raise PermissionError(
                "Only administrators can access this resource."
            )

        complaint = ComplaintRepository.get_by_id(
            complaint_id
        )

        if complaint is None:
            raise ValueError("Complaint not found.")

        return complaint

    @staticmethod
    def get_department_officers(complaint_id):
        """
        Retrieve officers belonging to the complaint's department.
        """

        user_id = get_jwt_identity()

        user = UserRepository.get_by_id(user_id)

        if user is None:
            raise ValueError("User not found.")

        if user.role != UserRole.ADMIN:
            raise PermissionError(
                "Only administrators can access this resource."
            )

        complaint = ComplaintRepository.get_by_id(
            complaint_id
        )

        if complaint is None:
            raise ValueError("Complaint not found.")

        officers = OfficerRepository.get_by_department_id(
            complaint.department_id
        )

        return officers
