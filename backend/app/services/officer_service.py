from datetime import datetime
from app.models import (
    AssignmentStatus,
    IST,
    ComplaintStatus,
    ReviewDecision,
    TenderStatus,
    ProposalStatus,
)

from app.repositories import (
    OfficerRepository,
    ComplaintAssignmentRepository,
    ReviewReportRepository,
    ComplaintRepository,
    TenderRepository,
    AgencyProposalRepository,
)

from app.extensions import db


class OfficerService:
    """
    Service for officer-related operations.
    """

    @staticmethod
    def get_my_complaints(user_id):
        """
        Retrieve all complaints assigned to the logged-in officer.
        """

        officer = OfficerRepository.get_by_user_id(user_id)

        if officer is None:
            raise ValueError("Officer not found.")

        return ComplaintAssignmentRepository.get_by_officer_id(
            officer.user_id,
        )

    @staticmethod
    def get_complaint_details(user_id, complaint_id):
        """
        Retrieve complaint details assigned to the officer.
        """

        officer = OfficerRepository.get_by_user_id(user_id)

        if officer is None:
            raise ValueError("Officer not found.")

        assignment = ComplaintAssignmentRepository.get_by_officer_and_complaint(
            officer.user_id,
            complaint_id,
        )

        if assignment is None:
            raise ValueError("Complaint assignment not found.")

        return assignment

    @staticmethod
    def accept_assignment(user_id, complaint_id):
        """
        Accept a complaint assignment.
        """

        officer = OfficerRepository.get_by_user_id(user_id)

        if officer is None:
            raise ValueError("Officer not found.")

        assignment = ComplaintAssignmentRepository.get_by_officer_and_complaint(
            officer.user_id,
            complaint_id,
        )

        if assignment is None:
            raise ValueError("Complaint assignment not found.")

        if assignment.status != AssignmentStatus.PENDING:
            raise ValueError("Only pending assignments can be accepted.")

        assignment.status = AssignmentStatus.ACCEPTED
        assignment.accepted_at = datetime.now(IST)
        officer.current_workload += 1

        assignment.complaint.status = ComplaintStatus.UNDER_REVIEW

        ComplaintAssignmentRepository.update()

        return assignment

    @staticmethod
    def reject_assignment(user_id, complaint_id):
        """
        Reject a complaint assignment.
        """

        officer = OfficerRepository.get_by_user_id(user_id)

        if officer is None:
            raise ValueError("Officer not found.")

        assignment = ComplaintAssignmentRepository.get_by_officer_and_complaint(
            officer.user_id,
            complaint_id,
        )

        if assignment is None:
            raise ValueError("Complaint assignment not found.")

        if assignment.status != AssignmentStatus.PENDING:
            raise ValueError("Only pending assignments can be rejected.")

        assignment.status = AssignmentStatus.REJECTED

        ComplaintAssignmentRepository.update()

        return assignment

    @staticmethod
    def submit_review_report(user_id, complaint_id, data):
        """
        Submit a review report for an assigned complaint.
        """

        officer = OfficerRepository.get_by_user_id(user_id)

        if officer is None:
            raise ValueError("Officer not found.")

        assignment = ComplaintAssignmentRepository.get_by_officer_and_complaint(
            officer.user_id,
            complaint_id,
        )

        if assignment is None:
            raise ValueError("Complaint assignment not found.")

        if assignment.status != AssignmentStatus.ACCEPTED:
            raise ValueError(
                "You must accept the assignment before submitting a review report."
            )

        complaint = assignment.complaint

        if complaint.status != ComplaintStatus.UNDER_REVIEW:
            raise ValueError(
                "Review report can only be submitted when the complaint is under review."
            )

        existing_report = ReviewReportRepository.get_by_complaint_id(complaint_id)

        if existing_report:
            raise ValueError("Review report has already been submitted.")

        report = ReviewReportRepository.create(
            {
                "complaint_id": complaint.id,
                "officer_id": officer.user_id,
                "findings": data["findings"],
                "estimated_cost": data.get("estimated_cost"),
                "estimated_duration_days": data.get("estimated_duration_days"),
                "decision": data["decision"],
            }
        )

        complaint.status = ComplaintStatus.REPORT_SUBMITTED

        db.session.commit()

        return report

    @staticmethod
    def request_budget(user_id, complaint_id):
        """
        Request budget allocation for a complaint.
        """

        officer = OfficerRepository.get_by_user_id(user_id)

        if officer is None:
            raise ValueError("Officer not found.")

        assignment = ComplaintAssignmentRepository.get_by_officer_and_complaint(
            officer.user_id,
            complaint_id,
        )

        if assignment is None:
            raise ValueError("Complaint assignment not found.")

        complaint = assignment.complaint

        if complaint.status != ComplaintStatus.REPORT_SUBMITTED:
            raise ValueError(
                "Budget can only be requested after submitting the review report."
            )

        review_report = ReviewReportRepository.get_by_complaint_id(complaint_id)

        if review_report is None:
            raise ValueError("Review report not found.")

        if review_report.decision != ReviewDecision.TENDER_REQUIRED:
            raise ValueError("Budget request is allowed only when tender is required.")

        complaint.status = ComplaintStatus.AWAITING_BUDGET

        db.session.commit()

        return complaint

    @staticmethod
    def create_tender(user_id, complaint_id, data):
        """
        Create a tender for a complaint.
        """

        officer = OfficerRepository.get_by_user_id(
            user_id,
        )

        if officer is None:
            raise ValueError("Officer not found.")

        assignment = ComplaintAssignmentRepository.get_by_officer_and_complaint(
            officer.user_id,
            complaint_id,
        )

        if assignment is None:
            raise ValueError("Complaint assignment not found.")

        complaint = assignment.complaint

        if complaint.status != ComplaintStatus.BUDGET_ALLOCATED:
            raise ValueError("Tender can only be created after budget allocation.")

        review_report = ReviewReportRepository.get_by_complaint_id(
            complaint_id,
        )

        if review_report is None:
            raise ValueError("Review report not found.")

        if review_report.decision != ReviewDecision.TENDER_REQUIRED:
            raise ValueError("Tender is not required for this complaint.")

        existing_tender = TenderRepository.get_by_complaint_id(
            complaint_id,
        )

        if existing_tender:
            raise ValueError("Tender already exists for this complaint.")

        tender = TenderRepository.create(
            {
                "complaint_id": complaint.id,
                "created_by": officer.user_id,
                "title": data["title"],
                "description": data.get("description"),
                "estimated_cost": review_report.estimated_cost,
                "closing_date": data["closing_date"],
                "status": TenderStatus.OPEN,
            }
        )

        complaint.status = ComplaintStatus.TENDER_NOTIFICATION_ISSUED

        db.session.commit()

        return tender

    @staticmethod
    def get_tender_proposals(
        user_id,
        tender_id,
    ):
        """
        Retrieve all proposals submitted for a tender.
        """

        officer = OfficerRepository.get_by_user_id(
            user_id,
        )

        if officer is None:
            raise ValueError("Officer not found.")

        tender = TenderRepository.get_by_id(
            tender_id,
        )

        if tender is None:
            raise ValueError("Tender not found.")

        assignment = ComplaintAssignmentRepository.get_by_officer_and_complaint(
            officer.user_id,
            tender.complaint_id,
        )

        if assignment is None:
            raise PermissionError(
                "You are not authorized to view proposals for this tender."
            )

        return AgencyProposalRepository.get_by_tender_id(
            tender_id,
        )

    @staticmethod
    def get_proposal(
        user_id,
        proposal_id,
    ):
        """
        Retrieve proposal details.
        """

        officer = OfficerRepository.get_by_user_id(
            user_id,
        )

        if officer is None:
            raise ValueError("Officer not found.")

        proposal = AgencyProposalRepository.get_by_id(
            proposal_id,
        )

        if proposal is None:
            raise ValueError("Proposal not found.")

        assignment = ComplaintAssignmentRepository.get_by_officer_and_complaint(
            officer.user_id,
            proposal.tender.complaint_id,
        )

        if assignment is None:
            raise PermissionError("You are not authorized to view this proposal.")

        return proposal


    @staticmethod
    def update_proposal_status(
        user_id,
        proposal_id,
        data,
    ):
        """
        Update proposal status.
        """

        officer = OfficerRepository.get_by_user_id(
            user_id,
        )

        if officer is None:
            raise ValueError("Officer not found.")

        proposal = AgencyProposalRepository.get_by_id(
            proposal_id,
        )

        if proposal is None:
            raise ValueError("Proposal not found.")

        assignment = ComplaintAssignmentRepository.get_by_officer_and_complaint(
            officer.user_id,
            proposal.tender.complaint_id,
        )

        if assignment is None:
            raise PermissionError("You are not authorized to update this proposal.")

        new_status = ProposalStatus(data["status"])

        allowed_transitions = {
            ProposalStatus.SUBMITTED: [
                ProposalStatus.SHORTLISTED,
                ProposalStatus.REJECTED,
            ],
            ProposalStatus.SHORTLISTED: [
                ProposalStatus.ACCEPTED,
                ProposalStatus.REJECTED,
            ],
        }

        if (
            proposal.status not in allowed_transitions
            or new_status not in allowed_transitions[proposal.status]
        ):
            raise ValueError("Invalid proposal status transition.")

        if new_status == ProposalStatus.ACCEPTED:

            AgencyProposalRepository.reject_other_proposals(
                proposal.tender_id,
                proposal.id,
            )
            proposal.agency.current_projects += 1
            proposal.tender.complaint.status = ComplaintStatus.TENDER_ALLOTED

        proposal.status = new_status

        AgencyProposalRepository.update()

        return proposal
