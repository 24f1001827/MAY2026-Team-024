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


class ComplaintService:
    """
    Service layer for complaint-related business logic.
    """

    @staticmethod
    def _auto_assign(complaint):
        """
        Auto-assign a freshly created complaint to the least-loaded available
        officer in its department (availability = Available, below capacity).
        Sets the assignment PENDING, bumps the officer's workload, and marks the
        complaint ASSIGNED. If no officer is eligible, the complaint stays in the
        queue (SUBMITTED) for manual allotment. Returns the officer or None.
        """

        officers = OfficerRepository.get_by_department_id(
            complaint.department_id
        )

        eligible = [
            o
            for o in officers
            if o.availability_status == AvailabilityStatus.AVAILABLE
            and o.current_workload < o.max_workload
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
        if db.session.bind.dialect.name == "postgresql":
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
    def notify_cluster_citizens(complaint, status):
        """Send one status notification to every distinct reporter in the issue."""
        members = ComplaintRepository.get_cluster_members(complaint.cluster_id) if complaint.cluster_id else [complaint]
        recipients = {member.citizen_id for member in members}
        for citizen_id in recipients:
            NotificationService.create_notification({
                "user_id": citizen_id,
                "type": NotificationType.STATUS_CHANGE,
                "title": "Related complaint updated",
                "message": f"The reported issue related to '{complaint.title}' is now {status.value}.",
            })

    @staticmethod
    def _cluster_complaint(complaint):
        """Attach to the closest high-confidence issue, or start a new issue."""
        ComplaintService._lock_cluster_bucket(complaint)
        candidates = ComplaintRepository.get_cluster_candidates(
            complaint.locality, complaint.city, complaint.latitude, complaint.longitude, complaint.id
        )
        best = max(candidates, key=lambda item: ComplaintIntelligenceService.similarity(complaint, item), default=None)
        if best and ComplaintIntelligenceService.similarity(complaint, best) >= 0.68:
            complaint.cluster_id = best.cluster_id
            complaint.is_cluster_primary = False
            cluster = best.cluster
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
    def dispute_cluster(complaint_id):
        user_id = get_jwt_identity()
        complaint = ComplaintRepository.get_by_id(complaint_id)
        if not complaint:
            raise ValueError("Complaint not found.")
        if complaint.citizen_id != user_id:
            raise PermissionError("You are not authorized to dispute this grouping.")
        complaint.cluster_disputed = True
        db.session.commit()
        return complaint

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
        ComplaintService._cluster_complaint(complaint)
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
        ComplaintService.notify_cluster_citizens(complaint, ComplaintStatus.CLOSED)

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

        admins = UserRepository.get_all(
            role=UserRole.ADMIN,
        )

        for admin in admins:

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
