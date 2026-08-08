from flask import Blueprint, jsonify

from flask_jwt_extended import jwt_required

from app.middleware import role_required
from app.models import UserRole
from app.repositories import TenderRepository
from app.schemas import OfficerTenderListSchema

admin_tender_bp = Blueprint(
    "admin_tender",
    __name__,
    url_prefix="/api/v1/admin/tenders",
)

tender_list_schema = OfficerTenderListSchema(many=True)


@admin_tender_bp.get("")
@jwt_required()
@role_required(UserRole.ADMIN)
def get_all_tenders():
    """
    Every tender in the system (admin oversight).
    """

    try:
        tenders = TenderRepository.get_all()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Tenders retrieved successfully.",
                    "data": tender_list_schema.dump(tenders),
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
