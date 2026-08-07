from datetime import datetime
from app.models import (
    AssignmentStatus,
    IST,
    ComplaintStatus,
    ReviewDecision,
    TenderStatus,
    ProposalStatus,
    WorkOrderStatus,
    NotificationType,
    User,
    UserRole
)

from app.repositories import (
    OfficerRepository,
    ComplaintAssignmentRepository,
    ReviewReportRepository,
    ComplaintRepository,
    TenderRepository,
    AgencyProposalRepository,
    WorkOrderRepository,
    AgencyRepository,
    UserRepository
)

from app.services.notification_service import NotificationService

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

        admin=User.query.filter_by(role=UserRole.ADMIN).first()
        
        NotificationService.create_notification(
            {
                "user_id": admin.id,
                "type": NotificationType.ASSIGNMENT_ACCEPTED,
                "title": "Assignment Accepted",
                "message": (
                    "An officer has accepted complaint."
                    f"'complaint ID: {assignment.complaint.id}, Complaint title: {assignment.complaint.title}'."
                ),
            }
        )

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

        admin=User.query.filter_by(role=UserRole.ADMIN).first()

        NotificationService.create_notification(
            {
                "user_id": admin.id,
                "type": NotificationType.ASSIGNMENT_REJECTED,
                "title": "Assignment Rejected",
                "message": (
                    f"The assigned officer rejected complaint "
                    f"'complaint ID: {assignment.complaint.id}, Complaint title: {assignment.complaint.title}'."
                ),
            }
        )

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
        NotificationService.create_notification(
            {
                "user_id": complaint.citizen_id,
                "type": NotificationType.REVIEW_COMPLETED,
                "title": "Review Completed",
                "message": (
                    "The inspection for your complaint has been completed."
                    f"'complaint ID: {complaint.id}, Complaint title: {complaint.title}'."
                ),
            }
        )

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

        admin=User.query.filter_by(role=UserRole.ADMIN).first()

        NotificationService.create_notification(
            {
                "user_id": admin.id,
                "type": NotificationType.BUDGET_REQUESTED,
                "title": "Budget Requested",
                "message": (
                    f"A budget request has been submitted for "
                    f"complaint '{complaint.title}'."
                ),
            }
        )

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
        agencies = AgencyRepository.get_all()

        for agency in agencies:
            NotificationService.create_notification(
                {
                    "user_id": agency.user_id,
                    "type": NotificationType.TENDER_PUBLISHED,
                    "title": "New Tender Published",
                    "message": (
                        f"A new tender is available for "
                        f"'Complaint ID: {complaint.id}, Complaint title:{ complaint.title }'."
                    ),
                }
            )

        

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

        new_status = data["status"]

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
            proposal.tender.complaint.status = ComplaintStatus.TENDER_ALLOTTED
            tender = proposal.tender
            tender.status = TenderStatus.AWARDED


        proposal.status = new_status

        AgencyProposalRepository.update()

        if new_status == ProposalStatus.ACCEPTED:
            NotificationService.create_notification(
                {
                    "user_id": proposal.agency.user_id,
                    "type": NotificationType.TENDER_ALLOTED,
                    "title": "Tender Awarded",
                    "message": (
                        f"Congratulations! Your proposal has been selected for complaint {proposal.tender.complaint_id}. Work will be assigned to you soon"
                    ),
                }
            )
        


        return proposal

    @staticmethod
    def create_work_order(
        user_id,
        proposal_id,
        data,
    ):
        """
        Create work order for an accepted proposal.
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

        if proposal.status != ProposalStatus.ACCEPTED:
            raise ValueError("Only accepted proposals can have work orders.")

        tender = proposal.tender

        if tender is None:
            raise ValueError("Tender not found.")

        existing = WorkOrderRepository.get_by_tender_id(
            proposal.tender_id,
        )

        if existing:
            raise ValueError("Work order already exists.")

        assignment = ComplaintAssignmentRepository.get_by_officer_and_complaint(
            officer.user_id,
            proposal.tender.complaint_id,
        )

        if assignment is None or assignment.status != AssignmentStatus.ACCEPTED:
            raise PermissionError("You are not assigned to this complaint.")

        work_order = WorkOrderRepository.create(
            {
                "tender_id": proposal.tender_id,
                "agency_id": proposal.agency_id,
                "assigned_by": officer.user_id,
                "scope_of_work": data["scope_of_work"],
                "status": WorkOrderStatus.ASSIGNED,
                "remarks": data.get("remarks"),
            }
        )
        # tender.complaint.status=ComplaintStatus.WORK_IN_PROGRESS
        # tender.status=TenderStatus.CLOSED

        db.session.commit()
        NotificationService.create_notification(
            {
                "user_id": work_order.agency.user_id,
                "type": NotificationType.WORK_ORDER_CREATED,
                "title": "Work Order Created",
                "message": (
                    "A work order has been assigned to your agency for the complaint "
                    f"'complaint ID: {work_order.tender.complaint.id}, Complaint title: {work_order.tender.complaint.title}'."
                ),
            }
        )

        return work_order

    @staticmethod
    def verify_work_order(
        user_id,
        work_order_id,
    ):
        """
        Verify a completed work order.
        """

        officer = OfficerRepository.get_by_user_id(
            user_id,
        )

        if officer is None:
            raise ValueError("Officer not found.")

        work_order = WorkOrderRepository.get_by_id(
            work_order_id,
        )

        if work_order is None:
            raise ValueError(
                "Work order not found."
            )
    
        assignment = (
            ComplaintAssignmentRepository
            .get_by_officer_and_complaint(
                officer.user_id,
                work_order.tender.complaint_id
            )
        )

        if assignment is None:
            raise PermissionError("You are not authorized to verify this work order.")

        if work_order.status != WorkOrderStatus.COMPLETED:
            raise ValueError("Only completed work orders can be verified.")

        if not work_order.completion_proof_url:
            raise ValueError("Completion proof has not been uploaded.")

        work_order.status = WorkOrderStatus.VERIFIED
        work_order.verified_by = officer.user_id
        work_order.verified_at = datetime.now(IST)

        work_order.tender.complaint.status = ComplaintStatus.RESOLVED

        db.session.commit()

        admin=User.query.filter_by(role=UserRole.ADMIN).first()

        NotificationService.create_notification(
            {
                "user_id": admin.id,
                "type": NotificationType.COMPLAINT_RESOLVED,
                "title": "Complaint Resolved",
                "message": (
                    f"The complaint : {assignment.complaint.title} complaint Id: {assignment.complaint.id} has been resolved."
                ),
            }
        )

        NotificationService.create_notification(
            {
                "user_id": assignment.complaint.citizen_id,
                "type": NotificationType.COMPLAINT_RESOLVED,
                "title": "Complaint Resolved",
                "message": (
                    f"Your complaint : {assignment.complaint.title} complaint Id: {assignment.complaint.id} has been resolved."
                ),
            }
        )

        return work_order

    @staticmethod
    def mark_work_order_incomplete(
        user_id,
        work_order_id,
        data,
    ):
        """
        Mark a verified work order as incomplete.
        """

        officer = OfficerRepository.get_by_user_id(
            user_id,
        )

        if officer is None:
            raise PermissionError(
                "Officer not found."
            )

        work_order = WorkOrderRepository.get_by_id(
            work_order_id,
        )

        if work_order is None:
            raise ValueError(
                "Work order not found."
            )

        complaint = work_order.tender.complaint

        assignment = ComplaintAssignmentRepository.get_by_complaint_id(
            complaint.id,
        )

        if (
            assignment is None
            or assignment.officer_id != officer.user_id
        ):
            raise PermissionError(
                "You are not assigned to this complaint."
            )


        if work_order.status != WorkOrderStatus.VERIFIED and work_order.status != WorkOrderStatus.COMPLETED:
            raise ValueError(
                "Only verified or completed work orders can be marked incomplete."
            )

        # only if the work order was verified, we reset the verification details
        if work_order.status == WorkOrderStatus.VERIFIED:
            work_order.verified_by = None
            work_order.verified_at = None
            work_order.end_date = None

        work_order.status = WorkOrderStatus.INCOMPLETE

        complaint.status = ComplaintStatus.WORK_IN_PROGRESS

        NotificationService.create_notification(
            {
                "user_id": work_order.agency_id,
                "type": NotificationType.WORK_ORDER_UPDATED,
                "title": "Work Order Reopened",
                "message": (
                    f"The work order for complaint "
                    f"'{complaint.title}' has been marked "
                    "incomplete. Please complete the work as requested.\n"
                    f"Remarks: {data['remarks']}"
                ),
            }
        )

        ComplaintRepository.update()

        return work_order
