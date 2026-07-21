"""
Auth routes: citizen registration and email/password login.
"""

from flask import Blueprint, jsonify, request, url_for,redirect

from marshmallow import ValidationError

from app.schemas import (
    RegisterCitizenSchema,
    RegisterAgencySchema,
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

@auth_bp.post("/register/agency")
def register_agency():
    """
    Register a new agency.

    Validates the request body against RegisterAgencySchema,
    then delegates account creation to AuthService.register_agency.

    Responses:
        201: agency registered successfully.
        422: request body failed schema validation.
        409: email/registration/license already exists.
        401
        500: unexpected server error.
    """

    try:

        data = RegisterAgencySchema().load(
            request.get_json()
        )

        user = AuthService.register_agency(data)

        return (
            jsonify(
                {
                    "success": True,
                    "message": (
                        "Agency registered successfully. "
                        "Awaiting admin approval."
                    ),
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

@auth_bp.get("/google/login")
def google_login():
    """
    Redirect the user to Google's OAuth 2.0 consent screen.
 
    This is the entry point for "Login with Google" — the frontend
    should navigate the browser here directly (not call it via
    fetch/AJAX), since Google needs to redirect the actual browser,
    not just return JSON to a background request.
    """
 
    redirect_uri = url_for(
        "auth.google_callback",
        _external=True,
    )
 
    return oauth.google.authorize_redirect(
        redirect_uri,
        prompt="consent",  # forces the consent screen every time,
                            # instead of Google silently re-authorizing
                            # returning users
    )
 
 
@auth_bp.get("/google/callback")
def google_callback():
    """
    Handle Google's redirect back after the user grants consent.
 
    Exchanges the authorization code for a token, extracts the
    user's profile (email, name, sub), and delegates to
    AuthService.google_login to find-or-create the local User and
    issue app-level access/refresh tokens.
 
    Responses:
        200: login successful, returns user info + access/refresh tokens.
        401: token exchange with Google failed (e.g. user denied consent).
        400: Google didn't return a usable email/profile.
        409: an account with this email already exists under a
             different provider.
        500: unexpected server error while creating/logging in the user.
    """
 
    try:
        token = oauth.google.authorize_access_token()
    except Exception as err:
 
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Google authentication failed.",
                    "error": str(err),
                }
            ),
            401,
        )
 
    # userinfo is usually embedded in the token response; fall back
    # to the userinfo endpoint if a given scope/flow omits it
    user_info = token.get("userinfo")
 
    if not user_info:
        user_info = oauth.google.userinfo(token=token)
 
    if not user_info or not user_info.get("email"):
 
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Could not retrieve account details from Google.",
                }
            ),
            400,
        )
 
    try:
        response = AuthService.google_login(user_info)
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
    
            