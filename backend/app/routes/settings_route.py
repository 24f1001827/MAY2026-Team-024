from flask import Blueprint, jsonify, request
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required

from app.middleware import role_required
from app.models import UserRole
from app.schemas import SettingsResponseSchema, UpdateSettingsSchema
from app.services import SettingsService


settings_bp = Blueprint(
    "settings",
    __name__,
    url_prefix="/api/v1/settings",
)

settings_response_schema = SettingsResponseSchema()
update_settings_schema = UpdateSettingsSchema()


@settings_bp.get("")
@jwt_required()
def get_settings():
    """
    Read organization-wide settings. Any authenticated user may read (e.g. the
    department dashboard shows whether allotment is manual or automatic).
    """

    try:
        settings = SettingsService.get_settings()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Settings retrieved successfully.",
                    "data": settings_response_schema.dump(settings),
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


@settings_bp.patch("")
@jwt_required()
@role_required(UserRole.ADMIN)
def update_settings():
    """
    Update organization-wide settings. Admin only.
    """

    try:
        data = update_settings_schema.load(request.get_json())

        settings = SettingsService.update_settings(data)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Settings updated successfully.",
                    "data": settings_response_schema.dump(settings),
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
