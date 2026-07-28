from app.extensions import db
from app.models.enums import ComplaintStatus
from app.repositories import ComplaintRepository
from app.repositories import ReviewReportRepository


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

        amount = data["amount"]

        department = complaint.department

        department.budget += amount

        complaint.status = ComplaintStatus.BUDGET_ALLOCATED

        db.session.commit()

        return complaint