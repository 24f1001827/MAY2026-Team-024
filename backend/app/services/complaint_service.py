import os
from datetime import datetime, timezone

from app.repositories import (
    UserRepository,
    DepartmentRepository,
    ComplaintRepository,
    ComplaintImageRepository,
    WorkOrderRepository,
    ComplaintAssignmentRepository,
    AgencyRepository,
    OfficerRepository,
    ComplaintClusterRepository,
)

from app.models import (
    ComplaintPriority,
    ComplaintStatus,
    UserRole,
    NotificationType,
    WorkOrderStatus,
    AvailabilityStatus,
    AssignmentStatus,
    AssignedBy,
    DisputeOutcome,
)
from app.extensions import db
from marshmallow import ValidationError
from flask_jwt_extended import get_jwt_identity
from app.utils import upload_image, delete_image
from app.services.notification_service import NotificationService
from app.services.settings_service import SettingsService
from app.services.activity_service import ActivityService
from app.services.complaint_intelligence_service import ComplaintIntelligenceService
from sqlalchemy import text

from app.models import User


class ComplaintService:
    """
    Service layer for complaint-related business logic.
    """

    @staticmethod
    def _auto_assign(complaint, exclude_officer_ids=None):
        """
        Auto-assign a complaint to the least-loaded available officer in its
        department (availability = Available, below capacity). Sets the
        assignment PENDING, bumps the officer's workload, and marks the
        complaint ASSIGNED. If no officer is eligible, the complaint stays in the
        queue (SUBMITTED) for manual allotment. Returns the officer or None.

        `exclude_officer_ids` skips officers who shouldn't get it — on
        re-allotment after a rejection, that's whoever already turned it down,
        so the case can't bounce straight back to them.
        """

        officers = OfficerRepository.get_by_department_id(
            complaint.department_id
        )

        excluded = exclude_officer_ids or set()

        eligible = [
            o
            for o in officers
            if o.availability_status == AvailabilityStatus.AVAILABLE
            and o.current_workload < o.max_workload
            and o.user_id not in excluded
        ]

        if not eligible:
            return None

        officer = min(eligible, key=lambda o: o.current_workload)

        ComplaintAssignmentRepository.create(
            {
                "complaint_id": complaint.id,
                "officer_id": officer.user_id,
                "assigned_by": AssignedBy.SYSTEM,
                "status": AssignmentStatus.PENDING,
                "assignment_note": None,
            }
        )

        complaint.status = ComplaintStatus.ASSIGNED
        officer.current_workload += 1

        ActivityService.record(
            complaint.id,
            f"Auto-assigned to {officer.user.name}.",
            user_id=None,
            status_from=ComplaintStatus.SUBMITTED,
            status_to=ComplaintStatus.ASSIGNED,
        )

        return officer

    @staticmethod
    def _resolve_department(data):
        """
        Resolve the target department from either department_id (preferred) or
        department (name). Raises ValidationError (-> HTTP 422) if it can't be
        found: an unknown department is bad input on a request-body field, not
        a missing resource at the requested URL.
        """

        department = None
        field = "department_id"

        if data.get("department_id") is not None:
            department = DepartmentRepository.get_by_id(data["department_id"])
        elif data.get("department"):
            field = "department"
            department = DepartmentRepository.get_by_name(data["department"])

        if not department:
            raise ValidationError({field: ["Department not found."]})

        return department

    @staticmethod
    def suggest_department(data):
        """Return a non-binding department recommendation for the form."""
        return ComplaintIntelligenceService.suggest_department(
            data["title"], data["description"], DepartmentRepository.get_all()
        )

    @staticmethod
    def _lock_cluster_bucket(complaint):
        """Serialize same-area grouping on PostgreSQL without a long AI transaction."""
        if db.engine.dialect.name == "postgresql":
            bucket = f"{complaint.locality.lower()}:{complaint.city.lower()}"
            db.session.execute(text("SELECT pg_advisory_xact_lock(hashtext(:bucket))"), {"bucket": bucket})

    @staticmethod
    def _refresh_cluster(cluster):
        members = ComplaintRepository.get_cluster_members(cluster.id)
        score = ComplaintIntelligenceService.cluster_score(cluster.base_priority_score, members)
        priority = ComplaintIntelligenceService.priority_from_score(score)
        cluster.ai_priority_score = score
        cluster.priority = priority
        for member in members:
            member.priority = priority
            member.ai_priority_score = score

    @staticmethod
    def notify_cluster_citizens(complaint, status, exclude_citizen_id=None):
        """Send one status notification to every distinct reporter in the issue."""
        members = ComplaintRepository.get_cluster_members(complaint.cluster_id) if complaint.cluster_id else [complaint]
        recipients = {member.citizen_id for member in members if member.citizen_id}
        recipients.discard(exclude_citizen_id)
        for citizen_id in recipients:
            NotificationService.create_notification({
                "user_id": citizen_id,
                "type": NotificationType.STATUS_CHANGE,
                "title": "Linked complaint updated",
                "message": f"The issue behind your complaint '{complaint.title}' is now {status.value}.",
            })

    @staticmethod
    def _cluster_complaint(complaint, exclude_cluster_ids=None):
        """
        Attach to the closest high-confidence issue, or start a new issue.

        `exclude_cluster_ids` keeps specific issues off the table. Unlinking
        passes the issue it just left: a human (or an upheld dispute) has said
        "this is not that issue", and without this the duplicate detector would
        score it as a match all over again and silently re-attach it.
        """
        ComplaintService._lock_cluster_bucket(complaint)
        candidates = ComplaintRepository.get_cluster_candidates(
            complaint.locality.strip().lower(), complaint.city.strip().lower(), complaint.pincode.strip(), complaint.id,
            limit=int(os.getenv("DUPLICATE_MAX_CANDIDATES", "20")),
        )
        excluded = exclude_cluster_ids or set()
        candidates = [item for item in candidates if item.cluster_id not in excluded]
        candidates = [item for item in candidates if ComplaintIntelligenceService.passes_distance_filter(complaint, item)]
        scored = [(ComplaintIntelligenceService.duplicate_score(complaint, item), item) for item in candidates]
        scored = [(score, item) for score, item in scored if score is not None]
        best_score, best = max(scored, default=(None, None), key=lambda item: item[0])
        if best and best_score >= ComplaintIntelligenceService.duplicate_threshold():
            complaint.cluster_id = best.cluster_id
            complaint.is_cluster_primary = False
            cluster = best.cluster or ComplaintClusterRepository.get_by_id(best.cluster_id)
            if not cluster:
                raise ValueError("Cluster not found for candidate complaint.")
            NotificationService.create_notification({
                "user_id": complaint.citizen_id,
                "type": NotificationType.STATUS_CHANGE,
                "title": "Complaint linked to an existing issue",
                "message": f"Your complaint was linked to the primary complaint '{best.title}' for the same issue. You can view it or dispute the link.",
            })
        else:
            cluster = ComplaintClusterRepository.create({
                "category": complaint.ai_category,
                "priority": complaint.priority,
                "ai_priority_score": complaint.ai_priority_score,
                "base_priority_score": complaint.ai_priority_score,
                "latitude": complaint.latitude,
                "longitude": complaint.longitude,
                "locality": complaint.locality,
                "city": complaint.city,
            })
            db.session.flush()
            complaint.cluster_id = cluster.id
            complaint.is_cluster_primary = True
        db.session.flush()
        ComplaintService._refresh_cluster(cluster)
        return cluster

    @staticmethod
    def create_complaint(data, images):
        """
        Create a new complaint.
        """

        try:
            user_id = get_jwt_identity()

            user = UserRepository.get_by_id(user_id)

            if not user:
                raise ValueError("User not found.")

            if user.role != UserRole.CITIZEN:
                raise PermissionError("Only citizens can create complaints.")

            department = ComplaintService._resolve_department(data)

            complaint = ComplaintRepository.create(
                {
                    "title": data["title"],
                    "description": data["description"],
                    "citizen_id": user.id,
                    "department_id": department.id,
                    "latitude": data["latitude"],
                    "longitude": data["longitude"],
                    "address": data["address"],
                    "locality": data["locality"],
                    "city": data["city"],
                    "district": data.get("district"),
                    "state": data["state"],
                    "country": data.get("country"),
                    "pincode": data["pincode"],
                    "status": ComplaintStatus.SUBMITTED,
                    "priority": ComplaintPriority.MEDIUM,
                    "ai_category": "Unclassified",
                    "ai_priority_score": 0,
                }
            )

            db.session.flush()

            category, base_score = ComplaintIntelligenceService.classify(
                complaint.title, complaint.description
            )
            complaint.ai_category = category
            complaint.ai_priority_score = base_score
            complaint.priority = ComplaintIntelligenceService.priority_from_score(base_score)
            ComplaintService._cluster_complaint(complaint)

            ActivityService.record(
                complaint.id,
                "Complaint filed.",
                user_id=user.id,
                status_to=ComplaintStatus.SUBMITTED,
            )

            for image in images:

                uploaded = upload_image(image)

                ComplaintImageRepository.create(
                    {
                        "complaint_id": complaint.id,
                        "uploaded_by": user.id,
                        "image_url": uploaded["image_url"],
                        "public_id": uploaded["public_id"],
                    }
                )

            # Auto-assign when the org setting is not manual allotment.
            assigned_officer = None
            if not SettingsService.is_manual_allotment():
                assigned_officer = ComplaintService._auto_assign(complaint)

            db.session.commit()

            NotificationService.create_notification(
                {
                    "user_id": complaint.citizen_id,
                    "type": NotificationType.COMPLAINT_CREATED,
                    "title": "Complaint Submitted",
                    "message": (
                        f"Your complaint '{complaint.title}' has been submitted "
                        f"successfully.your complaint id is {complaint.id}"
                    ),
                }
            )

            if assigned_officer is not None:
                NotificationService.create_notification(
                    {
                        "user_id": assigned_officer.user_id,
                        "type": NotificationType.COMPLAINT_ASSIGNED,
                        "title": "Complaint Assigned",
                        "message": (
                            f"You have been auto-assigned complaint "
                            f"'complaint ID: {complaint.id}, "
                            f"Complaint title: {complaint.title}'."
                        ),
                    }
                )

            return complaint

        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def get_my_complaints():
        """
        Retrieve all complaints of the logged-in citizen.
        """

        user_id = get_jwt_identity()

        user = UserRepository.get_by_id(user_id)

        if not user:
            raise ValueError("User not found.")

        if user.role != UserRole.CITIZEN:
            raise PermissionError("Only citizens can view their complaints.")

        complaints = ComplaintRepository.get_by_citizen_id(user.id)

        return complaints

    @staticmethod
    def dispute_cluster(complaint_id, reason):
        """
        The reporting citizen contests their complaint being linked to an
        issue, giving a reason staff can act on.
        """
        # Compare against the loaded user's id, not the raw JWT identity: the
        # column is a UUID and the token carries a string, so a direct `!=`
        # is always true and would reject every owner.
        user = UserRepository.get_by_id(get_jwt_identity())
        complaint = ComplaintRepository.get_by_id(complaint_id)
        if not complaint:
            raise ValueError("Complaint not found.")
        if not user or complaint.citizen_id != user.id:
            raise PermissionError("You are not authorized to dispute this grouping.")
        if complaint.cluster_disputed:
            raise ValueError("This grouping is already disputed.")

        members = (
            ComplaintRepository.get_cluster_members(complaint.cluster_id)
            if complaint.cluster_id
            else []
        )
        if len(members) < 2:
            raise ValueError(
                "This complaint isn't linked to any other complaint, so there is "
                "nothing to dispute."
            )

        complaint.cluster_disputed = True
        complaint.dispute_reason = reason
        complaint.dispute_raised_at = datetime.now(timezone.utc)
        # A re-raised dispute starts clean — the previous outcome no longer
        # describes the open one.
        complaint.dispute_outcome = None
        complaint.dispute_resolution_note = None
        complaint.dispute_resolved_at = None
        complaint.dispute_resolved_by = None

        # Tell whoever is handling the complaint that its reporter has objected.
        assignment = ComplaintAssignmentRepository.get_by_complaint_id(complaint.id)
        if assignment:
            NotificationService.create_notification({
                "user_id": assignment.officer_id,
                "type": NotificationType.STATUS_CHANGE,
                "title": "Complaint link disputed",
                "message": (
                    f"The reporter of '{complaint.title}' disputes it being linked "
                    f"to this issue. Reason: {reason}"
                ),
            })

        db.session.commit()
        return complaint

    @staticmethod
    def resolve_dispute(complaint_id, outcome, note=None):
        """
        Staff settle an open dispute.

        `UPHELD` agrees with the citizen and splits the complaint back out into
        its own issue (reusing `unlink_complaint`'s re-clustering); `REJECTED`
        keeps it linked. Either way the trail — who, when, why — is recorded on
        the complaint, and the reporter is told the result.
        """
        actor = UserRepository.get_by_id(get_jwt_identity())
        complaint = ComplaintRepository.get_by_id(complaint_id)
        if not complaint:
            raise ValueError("Complaint not found.")
        if not complaint.cluster_disputed:
            raise ValueError("This complaint has no open dispute.")

        if actor.role == UserRole.OFFICER:
            officer = OfficerRepository.get_by_user_id(actor.id)
            if not officer or complaint.department_id != officer.department_id:
                raise PermissionError(
                    "Officers can resolve disputes only within their department."
                )

        if outcome == DisputeOutcome.UPHELD:
            # Splitting the complaint out is exactly what unlink already does,
            # including re-clustering and repairing the old issue's primary.
            ComplaintService.unlink_complaint(complaint_id)

        complaint.cluster_disputed = False
        complaint.dispute_outcome = outcome
        complaint.dispute_resolution_note = note
        complaint.dispute_resolved_at = datetime.now(timezone.utc)
        complaint.dispute_resolved_by = actor.id

        if complaint.citizen_id:
            NotificationService.create_notification({
                "user_id": complaint.citizen_id,
                "type": NotificationType.STATUS_CHANGE,
                "title": "Grouping dispute resolved",
                "message": (
                    f"Your dispute about '{complaint.title}' was "
                    f"{outcome.value.lower()}."
                    + (f" {note}" if note else "")
                ),
            })

        db.session.commit()
        return complaint

    @staticmethod
    def get_cluster_members(complaint_id):
        """
        Every complaint linked to the same real-world issue as this one,
        primary first then newest, so the UI can list the whole group.

        A complaint that was never clustered returns just itself.
        """
        complaint = ComplaintRepository.get_by_id(complaint_id)
        if not complaint:
            raise ValueError("Complaint not found.")
        if not complaint.cluster_id:
            return [complaint]

        members = ComplaintRepository.get_cluster_members(complaint.cluster_id)
        return sorted(
            members,
            key=lambda item: (not item.is_cluster_primary, -item.created_at.timestamp()),
        )

    @staticmethod
    def link_complaint(complaint_id, target_complaint_id):
        """Staff override: add a complaint to the target complaint's incident."""
        actor = UserRepository.get_by_id(get_jwt_identity())
        complaint = ComplaintRepository.get_by_id(complaint_id)
        target = ComplaintRepository.get_by_id(target_complaint_id)
        if not complaint or not target:
            raise ValueError("Complaint not found.")
        if complaint.id == target.id:
            raise ValueError("A complaint cannot be linked to itself.")
        if actor.role == UserRole.OFFICER:
            officer = OfficerRepository.get_by_user_id(actor.id)
            if not officer or complaint.department_id != officer.department_id or target.department_id != officer.department_id:
                raise PermissionError("Officers can link complaints only within their department.")
        if not target.cluster_id:
            ComplaintService._cluster_complaint(target)
        old_cluster = complaint.cluster
        complaint.cluster_id = target.cluster_id
        complaint.is_cluster_primary = False
        complaint.cluster_disputed = False
        ComplaintService._refresh_cluster(target.cluster)
        if old_cluster and old_cluster.id != target.cluster_id:
            remaining = ComplaintRepository.get_cluster_members(old_cluster.id)
            if remaining:
                if not any(item.is_cluster_primary for item in remaining):
                    remaining[0].is_cluster_primary = True
                ComplaintService._refresh_cluster(old_cluster)
            else:
                old_cluster.deleted_at = complaint.updated_at
        db.session.commit()
        return complaint

    @staticmethod
    def unlink_complaint(complaint_id):
        actor = UserRepository.get_by_id(get_jwt_identity())
        complaint = ComplaintRepository.get_by_id(complaint_id)
        if not complaint:
            raise ValueError("Complaint not found.")
        old_cluster = complaint.cluster
        if not old_cluster or complaint.is_cluster_primary:
            raise ValueError("The primary complaint cannot be unlinked.")
        if actor.role == UserRole.OFFICER:
            officer = OfficerRepository.get_by_user_id(actor.id)
            if not officer or complaint.department_id != officer.department_id:
                raise PermissionError("Officers can unlink complaints only within their department.")
        complaint.cluster_id = None
        complaint.cluster_disputed = False
        # Never straight back into the issue it was just pulled out of — the
        # unlink is a human decision that outranks the similarity score. It may
        # still join a *different* nearby issue, or start its own.
        ComplaintService._cluster_complaint(
            complaint, exclude_cluster_ids={old_cluster.id}
        )
        ComplaintService._refresh_cluster(old_cluster)
        db.session.commit()
        return complaint

    @staticmethod
    def add_remark(complaint_id, message):
        """
        Add a remark to a complaint's activity timeline, attributed to the
        current user (officer or admin).
        """

        user_id = get_jwt_identity()

        complaint = ComplaintRepository.get_by_id(complaint_id)

        if not complaint:
            raise ValueError("Complaint not found.")

        ActivityService.record(complaint_id, message, user_id=user_id)

        db.session.commit()

        return complaint

    @staticmethod
    def get_public_complaints():
        """
        All complaints for the public (anonymized) map/list. No auth.
        """

        return ComplaintRepository.get_all()

    @staticmethod
    def get_public_complaint(complaint_id):
        """
        A single complaint for the public (anonymized) detail. No auth.

        Raises:
            ValueError: if the complaint doesn't exist.
        """

        complaint = ComplaintRepository.get_by_id(complaint_id)

        if not complaint:
            raise ValueError("Complaint not found.")

        return complaint

    @staticmethod
    def get_complaint_by_id(complaint_id):
        """
        Retrieve a complaint by its ID.
        """

        user_id = get_jwt_identity()

        user = UserRepository.get_by_id(user_id)

        if not user:
            raise ValueError("User not found.")

        complaint = ComplaintRepository.get_by_id(complaint_id)

        if not complaint:
            raise ValueError("Complaint not found.")

        return complaint

    @staticmethod
    def update_complaint(
        complaint_id,
        data,
        images,
    ):
        """
        Update an existing complaint.
        """
        try:
            user_id = get_jwt_identity()

            user = UserRepository.get_by_id(user_id)

            if not user:
                raise ValueError("User not found.")

            complaint = ComplaintRepository.get_by_id(complaint_id)

            if not complaint:
                raise ValueError("Complaint not found.")

            if complaint.citizen_id != user.id:
                raise PermissionError(
                    "You are not authorized to update this complaint."
                )

            if complaint.status != ComplaintStatus.SUBMITTED:
                raise ValueError("Only submitted complaints can be updated.")

            department = ComplaintService._resolve_department(data)

            complaint.title = data["title"]
            complaint.description = data["description"]

            complaint.department_id = department.id

            complaint.latitude = data["latitude"]
            complaint.longitude = data["longitude"]

            complaint.address = data["address"]
            complaint.locality = data["locality"]
            complaint.city = data["city"]
            complaint.district = data.get("district")
            complaint.state = data["state"]
            complaint.country = data.get("country")
            complaint.pincode = data["pincode"]

            if images:

                for old_image in complaint.images:
                    delete_image(old_image.public_id)
                    db.session.delete(old_image)

                db.session.flush()

                for image in images:

                    uploaded = upload_image(image)

                    complaint_image = ComplaintImageRepository.create(
                        {
                            "complaint_id": complaint.id,
                            "uploaded_by": user.id,
                            "image_url": uploaded["image_url"],
                            "public_id": uploaded["public_id"],
                        }
                    )

                    db.session.add(complaint_image)

            ActivityService.record(
                complaint.id,
                "Complaint details updated.",
                user_id=user.id,
            )

            ComplaintRepository.update()

            return complaint

        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def delete_complaint(complaint_id):
        """
        Soft delete a complaint.
        """

        user_id = get_jwt_identity()

        user = UserRepository.get_by_id(user_id)

        if not user:
            raise ValueError("User not found.")

        complaint = ComplaintRepository.get_by_id(complaint_id)

        if not complaint:
            raise ValueError("Complaint not found.")

        if complaint.citizen_id != user.id:
            raise PermissionError("You are not authorized to delete this complaint.")

        if complaint.status != ComplaintStatus.SUBMITTED:
            raise ValueError("Only submitted complaints can be deleted.")

        ComplaintRepository.delete(complaint)

    @staticmethod
    def reopen_complaint(
        complaint_id,
        data,
    ):
        """
        Reopen a resolved complaint.
        """

        citizen = UserRepository.get_by_id(
            get_jwt_identity(),
        )

        if citizen is None:
            raise PermissionError("Citizen not found.")

        complaint = ComplaintRepository.get_by_id(
            complaint_id,
        )

        if complaint is None:
            raise ValueError("Complaint not found.")

        if complaint.citizen_id != citizen.id:
            raise PermissionError("You are not authorized to reopen this complaint.")

        if complaint.status != ComplaintStatus.RESOLVED:
            raise ValueError("Only resolved complaints can be reopened.")

        previous_status = complaint.status
        complaint.status = ComplaintStatus.REOPENED
        ComplaintService.notify_cluster_citizens(complaint, ComplaintStatus.REOPENED)

        ActivityService.record(
            complaint.id,
            f"Complaint reopened. Reason: {data['reason']}",
            user_id=citizen.id,
            status_from=previous_status,
            status_to=ComplaintStatus.REOPENED,
        )

        ComplaintRepository.update()

        assignment = ComplaintAssignmentRepository.get_by_complaint_id(
            complaint.id,
        )

        if assignment:
            NotificationService.create_notification(
                {
                    "user_id": assignment.officer_id,
                    "type": NotificationType.STATUS_CHANGE,
                    "title": "Complaint Reopened",
                    "message": (
                        f"Complaint '{complaint.title}' has been reopened by the citizen.\n"
                        f"Reason: {data['reason']}"
                    ),
                }
            )

        return complaint

    @staticmethod
    def close_complaint(
        user_id,
        complaint_id,
    ):
        """
        Close a resolved complaint.
        """

        citizen = UserRepository.get_by_id(
            user_id,
        )

        if citizen is None:
            raise PermissionError(
                "Citizen not found."
            )

        complaint = ComplaintRepository.get_by_id(
            complaint_id,
        )

        if complaint is None:
            raise ValueError(
                "Complaint not found."
            )

        if complaint.citizen_id != citizen.id:
            raise PermissionError(
                "You are not authorized to close this complaint."
            )

        if complaint.status != ComplaintStatus.RESOLVED:
            raise ValueError(
                "Only resolved complaints can be closed."
            )

        work_order = WorkOrderRepository.get_by_tender_id(
            complaint.tender.id,
        )

        assignment = ComplaintAssignmentRepository.get_by_complaint_id(
            complaint.id,
        )

        officer = OfficerRepository.get_by_user_id(
            assignment.officer_id,
        )

        agency = AgencyRepository.get_by_user_id(
            work_order.agency_id,
        )

        complaint.status = ComplaintStatus.CLOSED
        ComplaintService.notify_cluster_citizens(complaint, ComplaintStatus.CLOSED, complaint.citizen_id)

        work_order.status = WorkOrderStatus.CLOSED

        ActivityService.record(
            complaint.id,
            "Complaint closed.",
            user_id=complaint.citizen_id,
            status_from=ComplaintStatus.RESOLVED,
            status_to=ComplaintStatus.CLOSED,
        )

        # Case leaves the officer's plate on closure. `max(0, …)` guards against
        # ever going negative; the trailing commas here were a bug (they made
        # these tuples instead of ints).
        officer.current_workload = max(0, officer.current_workload - 1)

        agency.current_projects = max(0, agency.current_projects - 1)

        NotificationService.create_notification(
            {
                "user_id": complaint.citizen_id,
                "type": NotificationType.COMPLAINT_CLOSURE,
                "title": "Complaint Closed",
                "message": (
                    f"Your complaint '{complaint.title}' "
                    "has been closed successfully."
                ),
            }
        )

        NotificationService.create_notification(
            {
                "user_id": assignment.officer_id,
                "type": NotificationType.COMPLAINT_CLOSURE,
                "title": "Complaint Closed",
                "message": (
                    f"Complaint '{complaint.title}' "
                    "has been closed by the citizen."
                ),
            }
        )

        NotificationService.create_notification(
            {
                "user_id": work_order.agency_id,
                "type": NotificationType.WORK_ORDER_UPDATED,
                "title": "Work Order Closed",
                "message": (
                    f"The work order for complaint "
                    f"'{complaint.title}' has been closed."
                ),
            }
        )

        admin=User.query.filter_by(role=UserRole.ADMIN).first()
        NotificationService.create_notification(
            {
                "user_id": admin.id,
                    "type": NotificationType.COMPLAINT_CLOSURE,
                    "title": "Complaint Closed",
                    "message": (
                        f"Complaint '{complaint.title}' "
                        "has been closed by the citizen."
                    ),
                }
            )



        ComplaintRepository.update()

        return complaint

    @staticmethod
    def auto_close_complaint(complaint_id):
        """
        Automatically close a resolved complaint after
        the 7-day waiting period.
        """

        complaint = ComplaintRepository.get_by_id(
            complaint_id
        )

        if complaint is None:
            return {
                "success": False,
                "message": "Complaint not found.",
            }

        # --------------------------------
        # Important:
        # Do nothing if the complaint is
        # no longer RESOLVED.
        # --------------------------------

        if complaint.status != ComplaintStatus.RESOLVED:
            return {
                "success": True,
                "message": "Complaint is no longer resolved.",
            }

        # --------------------------------
        # Get work order
        # --------------------------------

        work_order = WorkOrderRepository.get_by_tender_id(
            complaint.tender.id,
        )

        if work_order is None:
            return {
                "success": False,
                "message": "Work order not found.",
            }

        # --------------------------------
        # Get assignment
        # --------------------------------

        assignment = (
            ComplaintAssignmentRepository
            .get_by_complaint_id(
                complaint.id,
            )
        )

        if assignment is None:
            return {
                "success": False,
                "message": "Complaint assignment not found.",
            }

        # --------------------------------
        # Get officer
        # --------------------------------

        officer = OfficerRepository.get_by_user_id(
            assignment.officer_id,
        )

        # --------------------------------
        # Get agency
        # --------------------------------

        agency = AgencyRepository.get_by_user_id(
            work_order.agency_id,
        )

        # --------------------------------
        # Close complaint
        # --------------------------------

        previous_status = complaint.status

        complaint.status = ComplaintStatus.CLOSED

        # --------------------------------
        # Close work order
        # --------------------------------

        work_order.status = WorkOrderStatus.CLOSED

        # --------------------------------
        # Release officer workload
        # --------------------------------

        if officer is not None:
            officer.current_workload = max(
                0,
                officer.current_workload - 1,
            )

        # --------------------------------
        # Release agency project
        # --------------------------------

        if agency is not None:
            agency.current_projects = max(
                0,
                agency.current_projects - 1,
            )

        # --------------------------------
        # Timeline
        # --------------------------------

        ActivityService.record(
            complaint.id,
            (
                "Complaint automatically closed by "
                "the system after 7 days."
            ),
            user_id=None,
            status_from=previous_status,
            status_to=ComplaintStatus.CLOSED,
        )

        # --------------------------------
        # Citizen notification
        # --------------------------------

        NotificationService.create_notification(
            {
                "user_id": complaint.citizen_id,
                "type": NotificationType.COMPLAINT_CLOSURE,
                "title": "Complaint Automatically Closed",
                "message": (
                    f"Your complaint '{complaint.title}' "
                    "has been automatically closed because "
                    "no further action was requested within "
                    "7 days."
                ),
            }
        )

        # --------------------------------
        # Officer notification
        # --------------------------------

        NotificationService.create_notification(
            {
                "user_id": assignment.officer_id,
                "type": NotificationType.COMPLAINT_CLOSURE,
                "title": "Complaint Automatically Closed",
                "message": (
                    f"Complaint '{complaint.title}' "
                    "has been automatically closed by the system."
                ),
            }
        )

        # --------------------------------
        # Agency notification
        # --------------------------------

        NotificationService.create_notification(
            {
                "user_id": work_order.agency_id,
                "type": NotificationType.WORK_ORDER_UPDATED,
                "title": "Work Order Closed",
                "message": (
                    f"The work order for complaint "
                    f"'{complaint.title}' has been automatically closed."
                ),
            }
        )

        # --------------------------------
        # Admin notification
        # --------------------------------

        admin=User.query.filter_by(role=UserRole.ADMIN).first()
        NotificationService.create_notification(
            {
                "user_id": admin.id,
                "type": NotificationType.COMPLAINT_CLOSURE,
                "title": "Complaint Automatically Closed",
                "message": (
                    f"Complaint '{complaint.title}' "
                        "has been automatically closed by the system."
                    ),
                }
            )

        # --------------------------------
        # Commit
        # --------------------------------

        ComplaintRepository.update()

        return {
            "success": True,
            "message": "Complaint automatically closed.",
            "complaint_id": str(complaint.id),
        }
