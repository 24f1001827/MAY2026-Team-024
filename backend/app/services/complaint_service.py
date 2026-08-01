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
)
from app.extensions import db
from flask_jwt_extended import get_jwt_identity
from app.utils import upload_image, delete_image
from app.services.notification_service import NotificationService


class ComplaintService:
    """
    Service layer for complaint-related business logic.
    """

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

            department = DepartmentRepository.get_by_name(data["department"])

            if not department:
                raise ValueError("Department not found.")

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
                    "state": data["state"],
                    "pincode": data["pincode"],
                    "status": ComplaintStatus.SUBMITTED,
                    "priority": ComplaintPriority.MEDIUM,
                    "ai_category": "Unclassified",
                    "ai_priority_score": 0,
                }
            )

            db.session.flush()

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

            department = DepartmentRepository.get_by_name(data["department"])

            if not department:
                raise ValueError("Department not found.")

            complaint.title = data["title"]
            complaint.description = data["description"]

            complaint.department_id = department.id

            complaint.latitude = data["latitude"]
            complaint.longitude = data["longitude"]

            complaint.address = data["address"]
            complaint.locality = data["locality"]
            complaint.city = data["city"]
            complaint.state = data["state"]
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

        complaint.status = ComplaintStatus.REOPENED

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

        officer.current_workload =officer.current_workload - 1,
    
        agency.current_projects = agency.current_projects - 1,

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
