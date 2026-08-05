from flask import Blueprint, jsonify, request
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required

from app.middleware import role_required
from app.models import UserRole
from app.schemas import (
    CreateDepartmentSchema,
    UpdateDepartmentSchema,
    DepartmentResponseSchema,
)
from app.services import DepartmentService


admin_department_bp = Blueprint(
    "admin_department",
    __name__,
    url_prefix="/api/v1/admin/departments",
)

create_department_schema = CreateDepartmentSchema()
update_department_schema = UpdateDepartmentSchema()

department_response_schema = DepartmentResponseSchema()
departments_response_schema = DepartmentResponseSchema(many=True)

@admin_department_bp.post("")
@jwt_required()
@role_required(UserRole.ADMIN)
def create_department():
    """
    Create a department.
    
    """

    try:

        data = create_department_schema.load(
            request.get_json()
        )

        department = DepartmentService.create_department(
            data,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Department created successfully.",
                    "data": department_response_schema.dump(
                        department
                    ),
                }
            ),
            201,
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

@admin_department_bp.get("")
@jwt_required()
@role_required(UserRole.ADMIN)
def get_departments():
    """
    Retrieve all departments.
    """

    try:

        departments = (
            DepartmentService.get_all_departments()
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Departments retrieved successfully.",
                    "data": departments_response_schema.dump(
                        departments
                    ),
                }
            ),
            200,
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

@admin_department_bp.get("/<int:department_id>")
@jwt_required()
@role_required(UserRole.ADMIN)
def get_department(
    department_id,
):
    """
    Retrieve department details.
    """

    try:

        department = (
            DepartmentService.get_department_by_id(
                department_id,
            )
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Department retrieved successfully.",
                    "data": department_response_schema.dump(
                        department
                    ),
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

@admin_department_bp.patch("/<int:department_id>")
@jwt_required()
@role_required(UserRole.ADMIN)
def update_department(
    department_id,
):
    """
    Update department.
    """

    try:

        data = update_department_schema.load(
            request.get_json()
        )

        department = (
            DepartmentService.update_department(
                department_id,
                data,
            )
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Department updated successfully.",
                    "data": department_response_schema.dump(
                        department,
                    ),
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

@admin_department_bp.delete("/<int:department_id>")
@jwt_required()
@role_required(UserRole.ADMIN)
def delete_department(
    department_id,
):
    """
    Delete department.
    """

    try:

        DepartmentService.delete_department(
            department_id,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Department deleted successfully.",
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