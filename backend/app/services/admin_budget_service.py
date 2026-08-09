from decimal import Decimal
from datetime import datetime

from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import ComplaintStatus, NotificationType, IST
from app.models import BudgetLedger
from app.repositories import (
    ComplaintRepository,
    ReviewReportRepository,
    ComplaintAssignmentRepository,
    DepartmentRepository,
    DepartmentBudgetRepository,
    BudgetLedgerRepository,
)
from app.services.notification_service import NotificationService
from app.services.activity_service import ActivityService
from app.services.complaint_service import ComplaintService


def current_financial_year():
    """
    The current Indian financial year (Apr–Mar), e.g. "2026-27".
    """

    now = datetime.now(IST)
    start = now.year if now.month >= 4 else now.year - 1
    return f"{start}-{str(start + 1)[2:]}"


def department_budget_summary(department):
    """
    The department's current-financial-year budget as a plain dict (strings),
    for embedding in department responses. Sourced from the year-wise
    `DepartmentBudget` rows, not any legacy column.
    """

    fy = current_financial_year()
    budgets = getattr(department, "budgets", None) or []
    match = next(
        (
            b
            for b in budgets
            if b.financial_year == fy and b.deleted_at is None
        ),
        None,
    )
    total = (match.total_amount if match else 0) or Decimal("0")
    allocated = (match.allocated_amount if match else 0) or Decimal("0")
    return {
        "financial_year": fy,
        "total": str(total),
        "allocated": str(allocated),
        "available": str(total - allocated),
    }


class AdminBudgetService:

    @staticmethod
    def list_budgets():
        """
        All department budgets (across departments and years) for the admin
        budget console.
        """

        return DepartmentBudgetRepository.list_all()

    @staticmethod
    def add_budget(data):
        """
        Fund a department's budget for a financial year. Creates the year's
        budget row if absent, otherwise tops up its total.

        data: { department_id, amount, financial_year? }
        """

        department = DepartmentRepository.get_by_id(data["department_id"])

        if department is None:
            raise ValueError("Department not found.")

        amount = Decimal(str(data["amount"]))

        if amount <= 0:
            raise ValueError("Amount must be greater than zero.")

        financial_year = data.get("financial_year") or current_financial_year()

        budget = DepartmentBudgetRepository.get_by_dept_and_year(
            department.id,
            financial_year,
        )

        if budget is None:
            budget = DepartmentBudgetRepository.create(
                {
                    "department_id": department.id,
                    "financial_year": financial_year,
                    "total_amount": amount,
                    "allocated_amount": Decimal("0"),
                }
            )
        else:
            budget.total_amount = (budget.total_amount or Decimal("0")) + amount

        BudgetLedgerRepository.create(
            {
                "department_id": department.id,
                "financial_year": financial_year,
                "entry_type": BudgetLedger.ADDITION,
                "amount": amount,
            }
        )

        db.session.commit()

        return budget

    @staticmethod
    def get_department_history(department_id):
        """
        The department's budget ledger, split into additions and allocations
        (for the two history tabs). Raises if the department doesn't exist.
        """

        department = DepartmentRepository.get_by_id(department_id)

        if department is None:
            raise ValueError("Department not found.")

        entries = BudgetLedgerRepository.get_by_department(department_id)

        additions = [e for e in entries if e.entry_type == BudgetLedger.ADDITION]
        allocations = [
            e for e in entries if e.entry_type == BudgetLedger.ALLOCATION
        ]

        return {"additions": additions, "allocations": allocations}

    @staticmethod
    def allocate_budget(complaint_id, data):
        """
        Commit budget to a complaint, drawn from its department's budget for the
        current financial year. Deducts from available (allocated += amount) and
        refuses if the year has no budget or insufficient funds.
        """

        complaint = ComplaintRepository.get_by_id(complaint_id)

        if complaint is None:
            raise ValueError("Complaint not found.")

        if complaint.status != ComplaintStatus.AWAITING_BUDGET:
            raise ValueError(
                "Budget can only be allocated for complaints awaiting budget."
            )

        report = ReviewReportRepository.get_by_complaint_id(complaint_id)

        if report is None:
            raise ValueError("Review report not found.")

        assignment = ComplaintAssignmentRepository.get_by_complaint_id(
            complaint_id
        )

        if assignment is None:
            raise ValueError("This complaint is not assigned to any officer")

        amount = Decimal(str(data["amount"]))

        if amount <= 0:
            raise ValueError("Amount must be greater than zero.")

        financial_year = current_financial_year()

        budget = DepartmentBudgetRepository.get_by_dept_and_year(
            complaint.department_id,
            financial_year,
        )

        if budget is None:
            raise ValueError(
                f"No budget set for this department in {financial_year}. "
                "Add budget before allocating."
            )

        available = (budget.total_amount or Decimal("0")) - (
            budget.allocated_amount or Decimal("0")
        )

        if amount > available:
            raise ValueError(
                f"Insufficient department budget for {financial_year}. "
                f"Available: {available}, requested: {amount}."
            )

        budget.allocated_amount = (
            budget.allocated_amount or Decimal("0")
        ) + amount

        _prev = complaint.status
        complaint.allocated_budget = amount
        complaint.budget_year = financial_year
        complaint.status = ComplaintStatus.BUDGET_ALLOCATED
        ComplaintService.notify_cluster_citizens(complaint, ComplaintStatus.BUDGET_ALLOCATED, complaint.citizen_id)

        ActivityService.record(
            complaint_id,
            f"Budget of {amount} allocated for {financial_year}.",
            user_id=get_jwt_identity(),
            status_from=_prev,
            status_to=ComplaintStatus.BUDGET_ALLOCATED,
        )

        BudgetLedgerRepository.create(
            {
                "department_id": complaint.department_id,
                "financial_year": financial_year,
                "entry_type": BudgetLedger.ALLOCATION,
                "amount": amount,
                "complaint_id": complaint.id,
            }
        )

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
