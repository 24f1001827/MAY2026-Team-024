from flask import Blueprint, jsonify, request
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required

from app.middleware import role_required
from app.models import UserRole, UserStatus
from app.schemas import (
    UserResponseSchema,
    UpdateUserStatusSchema,
    UpdateMaxWorkloadSchema,
)
from app.services import AdminUserService
from app.tasks.email_task import send_agency_approve_email,send_officer_approve_email

admin_user_bp = Blueprint(
    "admin_user",
    __name__,
    url_prefix="/api/v1/admin/users",
)

user_response_schema = UserResponseSchema(many=True)
update_status_schema = UpdateUserStatusSchema()
update_max_workload_schema = UpdateMaxWorkloadSchema()

@admin_user_bp.get("")
@jwt_required()
@role_required(UserRole.ADMIN)
def get_users():
    """
    Retrieve all users.
    """

    try:

        role = request.args.get("role")
        status = request.args.get("status")

        if role:
            role = UserRole(role)

        if status:
            status = UserStatus(status)

        users = AdminUserService.get_all_users(
            role=role,
            status=status,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Users retrieved successfully.",
                    "data": user_response_schema.dump(users),
                }
            ),
            200,
        )

    except ValueError as e:

        return (
            jsonify(
                {
                    "success": False,
                    "message": str(e),
                }
            ),
            400,
        )

    except PermissionError as e:

        return (
            jsonify(
                {
                    "success": False,
                    "message": str(e),
                }
            ),
            403,
        )

    except Exception as err:

        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error.",
                    "error":str(err)
                }
            ),
            500,
        )

@admin_user_bp.patch("/<uuid:user_id>/status")
@jwt_required()
@role_required(UserRole.ADMIN)
def update_user_status(user_id):
    """
    Update user status.
    """

    try:

        data = update_status_schema.load(
            request.get_json()
        )

        user, old_status = AdminUserService.update_user_status(
            user_id,
            data,
        )

        new_status = user.status

        if (
            old_status in {
                UserStatus.PENDING_APPROVAL,
                UserStatus.REJECTED,
            }
            and new_status == UserStatus.ACTIVE
        ):

            if user.role == UserRole.AGENCY:

                send_agency_approve_email.delay(
                    "Agency account approved",
                    [user.email],
                    user.name,
                    user.updated_at,
                    user.status.value,
                )

            elif user.role == UserRole.OFFICER:

                department_name = None

                if (
                    user.officer
                    and user.officer.department
                ):
                    department_name = (
                        user.officer.department.name
                    )

                send_officer_approve_email.delay(
                    "Officer account approved",
                    [user.email],
                    user.name,
                    department_name,
                    user.updated_at,
                    user.status.value,
                )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "User status updated successfully.",
                    "data": UserResponseSchema().dump(user),
                }
            ),
            200,
        )

    except ValidationError as e:

        return (
            jsonify(
                {
                    "success": False,
                    "message": "Validation failed.",
                    "errors": e.messages,
                }
            ),
            422,
        )

    except ValueError as e:

        return (
            jsonify(
                {
                    "success": False,
                    "message": str(e),
                }
            ),
            400,
        )

    except PermissionError as e:

        return (
            jsonify(
                {
                    "success": False,
                    "message": str(e),
                }
            ),
            403,
        )

    except Exception as err:

        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error.",
                    "error": str(err),
                }
            ),
            500,
        )

@admin_user_bp.patch("/<uuid:user_id>/max-workload")
@jwt_required()
@role_required(UserRole.ADMIN)
def update_officer_max_workload(user_id):
    """
    Set an officer's maximum workload (capacity).
    """

    try:

        data = update_max_workload_schema.load(request.get_json())

        user = AdminUserService.update_officer_max_workload(user_id, data)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Officer max workload updated successfully.",
                    "data": UserResponseSchema().dump(user),
                }
            ),
            200,
        )

    except ValidationError as e:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Validation failed.",
                    "errors": e.messages,
                }
            ),
            422,
        )

    except ValueError as e:
        return (
            jsonify({"success": False, "message": str(e)}),
            404,
        )

    except Exception as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error.",
                    "error": str(err),
                }
            ),
            500,
        )