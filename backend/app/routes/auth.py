"""
Auth routes: citizen registration and email/password login.
"""

from flask import Blueprint, jsonify, request, url_for

from marshmallow import ValidationError

from app.schemas import (
    RegisterCitizenSchema,
    LoginSchema,
)

from app.services import AuthService
from app.extensions import oauth

auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/v1/auth",
)


@auth_bp.post("/register/citizen")
def register_citizen():
    """
    Register a new citizen.

    Validates the request body against RegisterCitizenSchema, then
    delegates account creation to AuthService.register_citizen.

    Responses:
        201: user created successfully.
        422: request body failed schema validation.
        409: a user with this email already exists.
        500: unexpected server error.
    """

    try:

        data = RegisterCitizenSchema().load(request.get_json())

        user = AuthService.register_citizen(data)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Citizen registered successfully.",
                    "data": {
                        "id": str(user.id),
                        "name": user.name,
                        "email": user.email,
                        "role": user.role.value,
                        "status": user.status.value,
                    },
                }
            ),
            201,
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
            409,
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


@auth_bp.post("/login")
def login():
    """
    Login user with email and password.

    Validates the request body against LoginSchema, then delegates
    credential checking and token issuance to AuthService.login.

    Responses:
        200: login successful, returns user info + access/refresh tokens.
        422: request body failed schema validation.
        401: invalid email/password, or account not active.
        500: unexpected server error.
    """

    try:

        data = LoginSchema().load(request.get_json())

        response = AuthService.login(data)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Login successful.",
                    "data": response,
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
            401,
        )

    except Exception:

        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error.",
                }
            ),
            500,
        )