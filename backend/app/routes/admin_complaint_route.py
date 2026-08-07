from flask import Blueprint, jsonify,request
from flask_jwt_extended import jwt_required

from app.middleware import role_required
from app.models import UserRole
from app.schemas import (
    ComplaintResponseSchema,
    ComplaintDetailResponseSchema,
    AssignComplaintSchema,
)
from app.services import AdminComplaintService,AdminBudgetService
from marshmallow import ValidationError

from app.schemas import AllocateBudgetSchema


admin_complaint_bp = Blueprint(
    "admin_complaint",
    __name__,
    url_prefix="/api/v1/admin/complaints",
)

allocate_budget_schema = AllocateBudgetSchema()

@admin_complaint_bp.get("")
@jwt_required()
@role_required(UserRole.ADMIN)
def get_all_complaints():
    """
    Retrieve all complaints.

    Allows an authenticated administrator to view all complaints
    submitted by citizens.

    Method: GET
    URL: /api/v1/admin/complaints
    Auth: JWT required (role: ADMIN)

    Responses:
        200: Complaints retrieved successfully.
        403: User does not have permission.
        500: Internal server error.
    """

    try:

        complaints = AdminComplaintService.get_all_complaints()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaints retrieved successfully.",
                    "data": ComplaintResponseSchema(
                        many=True
                    ).dump(complaints),
                }
            ),
            200,
        )

    except ValueError as err:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": str(err),
                    }
                ),
                404,
            )

    except PermissionError as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": str(err),
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

@admin_complaint_bp.get("/<uuid:complaint_id>")
@jwt_required()
@role_required(UserRole.ADMIN)
def get_complaint(complaint_id):
    """
    Retrieve details of a complaint.

    Allows an authenticated administrator to view the complete
    details of a complaint.

    Method: GET
    URL: /api/v1/admin/complaints/<complaint_id>
    Auth: JWT required (role: ADMIN)

    Responses:
        200: Complaint retrieved successfully.
        404: Complaint not found.
        403: User does not have permission.
        500: Internal server error.
    """

    try:

        complaint = AdminComplaintService.get_complaint(
            complaint_id
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaint retrieved successfully.",
                    "data": ComplaintDetailResponseSchema().dump(
                        complaint
                    ),
                }
            ),
            200,
        )

    except ValueError as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": str(err),
                }
            ),
            404,
        )

    except PermissionError as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": str(err),
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

@admin_complaint_bp.get("/<uuid:complaint_id>/officers")
@jwt_required()
@role_required(UserRole.ADMIN)
def get_department_officers(complaint_id):
    """
    Retrieve officers belonging to the complaint's department.
    """

    try:

        officers = AdminComplaintService.get_department_officers(
            complaint_id
        )

        data = [
            {
                "user_id": officer.user_id,
                "name": officer.user.name,
                "email": officer.user.email,
                "phone": officer.user.phone,
                "availability_status": officer.availability_status.value,
                "current_workload": officer.current_workload,
                "max_workload": officer.max_workload,
            }
            for officer in officers 
        ]

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Department officers retrieved successfully.",
                    "data": data,
                }
            ),
            200,
        )

    except ValueError as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": str(err),
                }
            ),
            404,
        )

    except PermissionError as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": str(err),
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

@admin_complaint_bp.post("/<uuid:complaint_id>/assign")
@jwt_required()
@role_required(UserRole.ADMIN)
def assign_complaint(complaint_id):
    """
    Assign a complaint to an officer.
    """

    try:

        data = AssignComplaintSchema().load(
            request.get_json()
        )

        AdminComplaintService.assign_complaint(
            complaint_id,
            data,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaint assigned successfully.",
                }
            ),
            200,
        )

    except ValidationError as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Validation failed.",
                    "errors": err.messages,
                }
            ),
            422,
        )

    except ValueError as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": str(err),
                }
            ),
            404,
        )

    except PermissionError as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": str(err),
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

@admin_complaint_bp.patch("/<uuid:complaint_id>/allocate-budget")
@jwt_required()
@role_required(UserRole.ADMIN)
def allocate_budget(complaint_id):

    try:

        data = allocate_budget_schema.load(
            request.get_json()
        )

        complaint = AdminBudgetService.allocate_budget(
            complaint_id,
            data,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Budget allocated successfully.",
                    "data": {
                        "complaint_id": complaint.id,
                        "department_budget": str(
                            complaint.department.budget
                        ),
                        "status": complaint.status.value,
                    },
                }
            ),
            200,
        )

    except ValidationError as err:

        return (
            jsonify(
                {
                    "success": False,
                    "message": "Validation failed.",
                    "errors": err.messages,
                }
            ),
            422,
        )

    except ValueError as err:

        return (
            jsonify(
                {
                    "success": False,
                    "message": str(err),
                }
            ),
            400,
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