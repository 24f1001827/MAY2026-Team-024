from datetime import datetime
from app.models import (
    AssignmentStatus,
    AssignedBy,
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
    DepartmentRepository,
    TenderRepository,
    AgencyProposalRepository,
    WorkOrderRepository,
    AgencyRepository,
    UserRepository
)

from app.services.notification_service import NotificationService
from app.services.complaint_service import ComplaintService
from app.services.settings_service import SettingsService
from app.services.activity_service import ActivityService

from app.extensions import db


from app.tasks.complaint_task import auto_close_complaint
from flask import current_app



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
    def get_officer_directory():
        """
        All active officers for the shared directory (name, department,
        availability). Any authenticated user may read.
        """

        return OfficerRepository.get_all()

    @staticmethod
    def get_my_department_dashboard(user_id):
        """
        Aggregate view for an officer's own department dashboard:
        the department, its officers, and its complaints. Any officer in the
        department may view it; the frontend restricts allotment to the head.
        """

        officer = OfficerRepository.get_by_user_id(user_id)

        if officer is None:
            raise ValueError("Officer not found.")

        department = DepartmentRepository.get_by_id(officer.department_id)

        if department is None:
            raise ValueError("Department not found.")

        officers = OfficerRepository.get_by_department_id(
            officer.department_id
        )

        complaints = ComplaintRepository.get_by_department(
            officer.department_id
        )

        return {
            "department": department,
            "officers": officers,
            "complaints": complaints,
            "is_department_head": officer.is_department_head,
            "manual_allotment": SettingsService.is_manual_allotment(),
        }

    @staticmethod
    def allot_complaint(user_id, complaint_id, data):
        """
        Allot (assign) a complaint to an officer in the department. Only the
        department head may allot, and only within their own department.
        """

        head = OfficerRepository.get_by_user_id(user_id)

        if head is None:
            raise ValueError("Officer not found.")

        if not head.is_department_head:
            raise PermissionError(
                "Only the department head can allot complaints."
            )

        complaint = ComplaintRepository.get_by_id(complaint_id)

        if complaint is None:
            raise ValueError("Complaint not found.")

        if complaint.department_id != head.department_id:
            raise PermissionError(
                "You can only allot complaints in your own department."
            )

        officer = OfficerRepository.get_by_user_id(data["officer_id"])

        if officer is None:
            raise ValueError("Officer not found.")

        if officer.department_id != complaint.department_id:
            raise ValueError(
                "Officer does not belong to the complaint department."
            )

        # Only a *live* assignment blocks allotment. A rejected one means the
        # complaint was handed back and is waiting for exactly this.
        existing = ComplaintAssignmentRepository.get_active_by_complaint_id(
            complaint_id
        )

        if existing:
            raise ValueError("Complaint has already been assigned.")

        # Re-allotting to whoever just rejected it would only bounce again.
        if officer.user_id in ComplaintAssignmentRepository.get_rejected_officer_ids(
            complaint.id
        ):
            raise ValueError(
                f"{officer.user.name} already rejected this complaint. "
                "Allot it to a different officer."
            )

        assignment = ComplaintAssignmentRepository.create(
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
        # The case is now on the assignee's plate — count it toward their
        # workload immediately (released on reject / closure).
        officer.current_workload += 1

        ActivityService.record(
            complaint.id,
            f"Allotted to {officer.user.name} by the department head.",
            user_id=head.user_id,
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
                    f"'complaint ID: {complaint.id}, "
                    f"Complaint title: {complaint.title}'."
                ),
            }
        )

        return assignment

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
        # Workload is counted at allotment (when the case lands on the officer),
        # not on accept — so nothing to increment here.

        previous_status = assignment.complaint.status
        assignment.complaint.status = ComplaintStatus.UNDER_REVIEW
        ComplaintService.notify_cluster_citizens(assignment.complaint, ComplaintStatus.UNDER_REVIEW)

        ActivityService.record(
            assignment.complaint.id,
            f"{officer.user.name} accepted the assignment.",
            user_id=officer.user_id,
            status_from=previous_status,
            status_to=ComplaintStatus.UNDER_REVIEW,
        )

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
    def reject_assignment(user_id, complaint_id, reason=None):
        """
        Reject a complaint assignment and put the complaint back into play.

        Rejecting is a hand-back, not a dead end: the complaint returns to
        SUBMITTED so its status stops claiming someone owns it, and it becomes
        allottable again. Under automatic allotment it is immediately offered to
        the next-best officer — never one who already rejected it — and if
        nobody is eligible it waits in the department's manual queue.
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

        complaint = assignment.complaint

        assignment.status = AssignmentStatus.REJECTED
        assignment.rejection_reason = reason
        assignment.rejected_at = datetime.now(IST)
        # Rejecting releases the case, so it leaves the officer's workload
        # (which was counted at allotment).
        officer.current_workload = max(0, officer.current_workload - 1)

        # The complaint is nobody's until it is allotted again.
        previous_status = complaint.status
        complaint.status = ComplaintStatus.SUBMITTED

        ActivityService.record(
            complaint.id,
            f"{officer.user.name} rejected the assignment."
            + (f" Reason: {reason}" if reason else ""),
            user_id=officer.user_id,
            status_from=previous_status,
            status_to=ComplaintStatus.SUBMITTED,
        )

        # Offer it onward straight away when the org runs on auto-allotment;
        # otherwise it surfaces in the head's queue for a manual decision.
        reassigned_to = None
        if not SettingsService.is_manual_allotment():
            reassigned_to = ComplaintService._auto_assign(
                complaint,
                exclude_officer_ids=(
                    ComplaintAssignmentRepository.get_rejected_officer_ids(
                        complaint.id
                    )
                    | {officer.user_id}
                ),
            )

        ComplaintAssignmentRepository.update()

        OfficerService._notify_rejection(
            complaint, officer, reason, reassigned_to
        )

        return assignment

    @staticmethod
    def _notify_rejection(complaint, officer, reason, reassigned_to):
        """
        Tell the people who need to act on a hand-back: the department head who
        allots (falling back to an admin when the department has no head), and
        the officer it was just passed to, if any.
        """

        detail = f" Reason: {reason}" if reason else ""

        head = OfficerRepository.get_department_head(complaint.department_id)
        recipient_id = head.user_id if head else None

        if recipient_id is None:
            admin = User.query.filter_by(role=UserRole.ADMIN).first()
            recipient_id = admin.id if admin else None

        if recipient_id and recipient_id != officer.user_id:
            NotificationService.create_notification(
                {
                    "user_id": recipient_id,
                    "type": NotificationType.ASSIGNMENT_REJECTED,
                    "title": "Assignment rejected",
                    "message": (
                        f"{officer.user.name} rejected '{complaint.title}'."
                        + detail
                        + (
                            f" It was reassigned to {reassigned_to.user.name}."
                            if reassigned_to
                            else " It is back in the department queue."
                        )
                    ),
                }
            )

        if reassigned_to:
            NotificationService.create_notification(
                {
                    "user_id": reassigned_to.user_id,
                    "type": NotificationType.COMPLAINT_ASSIGNED,
                    "title": "Complaint assigned to you",
                    "message": (
                        f"'{complaint.title}' was reassigned to you after "
                        f"another officer rejected it." + detail
                    ),
                }
            )

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

        _prev = complaint.status
        complaint.status = ComplaintStatus.REPORT_SUBMITTED
        ComplaintService.notify_cluster_citizens(complaint, ComplaintStatus.REPORT_SUBMITTED, complaint.citizen_id)

        ActivityService.record(
            complaint.id,
            "Review report submitted.",
            user_id=user_id,
            status_from=_prev,
            status_to=ComplaintStatus.REPORT_SUBMITTED,
        )

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

        _prev = complaint.status
        complaint.status = ComplaintStatus.AWAITING_BUDGET
        ComplaintService.notify_cluster_citizens(complaint, ComplaintStatus.AWAITING_BUDGET)

        ActivityService.record(
            complaint.id,
            "Budget requested for this complaint.",
            user_id=user_id,
            status_from=_prev,
            status_to=ComplaintStatus.AWAITING_BUDGET,
        )

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
    def get_my_tenders(user_id):
        """
        All tenders the officer has created (oversight list).
        """

        officer = OfficerRepository.get_by_user_id(user_id)

        if officer is None:
            raise ValueError("Officer not found.")

        return TenderRepository.get_by_creator(user_id)

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

        _prev = complaint.status
        complaint.status = ComplaintStatus.TENDER_NOTIFICATION_ISSUED
        ComplaintService.notify_cluster_citizens(complaint, ComplaintStatus.TENDER_NOTIFICATION_ISSUED)

        ActivityService.record(
            complaint.id,
            "Tender created for this complaint.",
            user_id=user_id,
            status_from=_prev,
            status_to=ComplaintStatus.TENDER_NOTIFICATION_ISSUED,
        )

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
            _complaint = proposal.tender.complaint
            _prev = _complaint.status
            _complaint.status = ComplaintStatus.TENDER_ALLOTTED
            ComplaintService.notify_cluster_citizens(_complaint, ComplaintStatus.TENDER_ALLOTTED)

            ActivityService.record(
                _complaint.id,
                "Tender allotted to an agency.",
                user_id=user_id,
                status_from=_prev,
                status_to=ComplaintStatus.TENDER_ALLOTTED,
            )
            tender = proposal.tender
            tender.status = TenderStatus.AWARDED

        elif new_status == ProposalStatus.SHORTLISTED:
            ActivityService.record(
                proposal.tender.complaint_id,
                "A proposal was shortlisted.",
                user_id=user_id,
            )

        elif new_status == ProposalStatus.REJECTED:
            ActivityService.record(
                proposal.tender.complaint_id,
                "A proposal was rejected.",
                user_id=user_id,
            )

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

        ActivityService.record(
            proposal.tender.complaint_id,
            "Work order awarded to the agency.",
            user_id=user_id,
        )

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

        _complaint = work_order.tender.complaint
        _prev = _complaint.status
        _complaint.status = ComplaintStatus.RESOLVED
        ComplaintService.notify_cluster_citizens(_complaint, ComplaintStatus.RESOLVED, _complaint.citizen_id)

        ActivityService.record(
            _complaint.id,
            "Work verified — complaint resolved.",
            user_id=user_id,
            status_from=_prev,
            status_to=ComplaintStatus.RESOLVED,
        )

        db.session.commit()

        # --------------------------------
        # Schedule automatic closure
        # after 7 days
        # --------------------------------


        countdown_seconds = current_app.config.get(
                "COMPLAINT_AUTO_CLOSE_SECONDS",
                7 * 24 * 60 * 60
            )

        auto_close_complaint.apply_async(
            args=[str(_complaint.id)],
            countdown=countdown_seconds
        )

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

        _prev = complaint.status
        complaint.status = ComplaintStatus.WORK_IN_PROGRESS
        ComplaintService.notify_cluster_citizens(complaint, ComplaintStatus.WORK_IN_PROGRESS)

        ActivityService.record(
            complaint.id,
            "Work marked in progress.",
            user_id=user_id,
            status_from=_prev,
            status_to=ComplaintStatus.WORK_IN_PROGRESS,
        )

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
