from app.repositories import (
    UserRepository,
    DepartmentRepository,
    ComplaintRepository,
    ComplaintImageRepository,
    WorkOrderRepository,
    ComplaintAssignmentRepository,
    AgencyRepository,
    OfficerRepository
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

        admins = UserRepository.get_all(
            role=UserRole.ADMIN,
        )

        for admin in admins:

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
