from app.extensions import db
from app.models import ComplaintStatus, NotificationType
from app.repositories import ComplaintRepository
from app.repositories import ReviewReportRepository,ComplaintAssignmentRepository
from app.services import NotificationService


class AdminBudgetService:

    @staticmethod
    def allocate_budget(complaint_id, data):
        """
        Allocate budget for a complaint.
        """

        complaint = ComplaintRepository.get_by_id(
            complaint_id,
        )

        if complaint is None:
            raise ValueError("Complaint not found.")

        if complaint.status != ComplaintStatus.AWAITING_BUDGET:
            raise ValueError(
                "Budget can only be allocated for complaints awaiting budget."
            )

        

        report = ReviewReportRepository.get_by_complaint_id(
            complaint_id,
        )

        if report is None:
            raise ValueError("Review report not found.")

        assignment=ComplaintAssignmentRepository.get_by_complaint_id(complaint_id)

        amount = data["amount"]

        department = complaint.department

        department.budget += amount

        complaint.status = ComplaintStatus.BUDGET_ALLOCATED

        db.session.commit()

        NotificationService.create_notification(
            {
                "user_id": complaint.citizen_id,
                "type": NotificationType.BUDGET_ALLOCATED,
                "title": "Budget Allocated",
                "message": (
                    "Budget has been allocated for your complaint."
                    f" Complaint ID: {complaint.id}, Complaint title: {complaint.title}."
                ),
            }
        )

        NotificationService.create_notification(
            {
                "user_id": assignment.officer_id,
                "type": NotificationType.BUDGET_ALLOCATED,
                "title": "Budget Allocated",
                "message": (
                    "Budget has been allocated for complaint."
                    f" Complaint ID: {complaint.id}, Complaint title: {complaint.title}."
                ),
            }
        )


        return complaint