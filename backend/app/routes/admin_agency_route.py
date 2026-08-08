from flask import Blueprint, jsonify

from flask_jwt_extended import jwt_required

from app.middleware import role_required
from app.models import UserRole
from app.schemas.admin_agency_schema import AdminAgencySchema
from app.services.admin_agency_service import AdminAgencyService

admin_agency_bp = Blueprint(
    "admin_agency",
    __name__,
    url_prefix="/api/v1/admin/agencies",
)

admin_agency_list_schema = AdminAgencySchema(many=True)
admin_agency_schema = AdminAgencySchema()


@admin_agency_bp.get("")
@jwt_required()
@role_required(UserRole.ADMIN)
def get_agencies():
    """
    Retrieve all agencies (admin directory).
    """

    try:
        agencies = AdminAgencyService.get_all_agencies()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Agencies retrieved successfully.",
                    "data": admin_agency_list_schema.dump(agencies),
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


@admin_agency_bp.get("/<uuid:agency_id>")
@jwt_required()
@role_required(UserRole.ADMIN)
def get_agency(agency_id):
    """
    Retrieve a single agency by id.
    """

    try:
        agency = AdminAgencyService.get_agency(agency_id)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Agency retrieved successfully.",
                    "data": admin_agency_schema.dump(agency),
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


@admin_agency_bp.get("/<uuid:agency_id>/work-orders")
@jwt_required()
@role_required(UserRole.ADMIN)
def get_agency_work_orders(agency_id):
    """
    Work orders the agency is executing.
    """

    try:
        work_orders = AdminAgencyService.get_agency_work_orders(agency_id)

        data = [
            {
                "id": wo.id,
                "tender_id": wo.tender_id,
                "scope_of_work": wo.scope_of_work,
                "status": wo.status.value,
                "start_date": (
                    wo.start_date.isoformat() if wo.start_date else None
                ),
                "end_date": wo.end_date.isoformat() if wo.end_date else None,
                "created_at": (
                    wo.created_at.isoformat() if wo.created_at else None
                ),
            }
            for wo in work_orders
        ]

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Agency work orders retrieved successfully.",
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
