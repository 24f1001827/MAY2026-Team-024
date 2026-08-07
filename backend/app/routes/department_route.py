from flask import (
    Blueprint,
    jsonify,
)

from flask_jwt_extended import jwt_required

from app.schemas import (
    DepartmentResponseSchema,
    PublicDepartmentSchema,
)
from app.services import DepartmentService

departments_response_schema = DepartmentResponseSchema(
    many=True,
)

public_departments_schema = PublicDepartmentSchema(
    many=True,
)

department_bp = Blueprint(
    "department",
    __name__,
    url_prefix="/api/v1/departments",
)


@department_bp.get("/public")
def get_public_departments():
    """
    Retrieve the public list of departments (id + name only).

    Unauthenticated on purpose: the officer registration form needs to show the
    real department names before the user has an account/token. Exposes no
    sensitive fields (no budget, description, or timestamps).
    """

    try:

        departments = DepartmentService.get_all_departments()

        return (
            jsonify(
                {
                    "success": True,
                    "message": ("Departments retrieved successfully."),
                    "data": public_departments_schema.dump(departments),
                }
            ),
            200,
        )

    except Exception as err:

        return (
            jsonify(
                {
                    "success": False,
                    "message": ("Internal server error."),
                    "error": str(err),
                }
            ),
            500,
        )


@department_bp.get("")
@jwt_required()
def get_departments():
    """
    Retrieve all departments.
    """

    try:

        departments = DepartmentService.get_all_departments()

        return (
            jsonify(
                {
                    "success": True,
                    "message": ("Departments retrieved successfully."),
                    "data": departments_response_schema.dump(departments),
                }
            ),
            200,
        )

    except Exception as err:

        return (
            jsonify(
                {
                    "success": False,
                    "message": ("Internal server error."),
                    "error": str(err),
                }
            ),
            500,
        )
