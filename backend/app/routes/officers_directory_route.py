from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app.schemas import OfficerDirectorySchema
from app.services import OfficerService


officers_bp = Blueprint(
    "officers",
    __name__,
    url_prefix="/api/v1/officers",
)

officer_directory_schema = OfficerDirectorySchema(many=True)


@officers_bp.get("")
@jwt_required()
def get_officer_directory():
    """
    Shared officer directory — all active officers with name, department, and
    availability. Readable by any authenticated user (citizens included); no
    contact info or workload is exposed.
    """

    try:
        officers = OfficerService.get_officer_directory()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Officers retrieved successfully.",
                    "data": officer_directory_schema.dump(officers),
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
