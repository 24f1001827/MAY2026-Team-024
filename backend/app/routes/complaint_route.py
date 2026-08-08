from flask import Blueprint, jsonify, request
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required,get_jwt_identity

from app.models import UserRole
from app.middleware import role_required
from app.schemas import (
    ComplaintSchema,
    ComplaintResponseSchema,
    ComplaintDetailResponseSchema,
    ReopenComplaintSchema,
)
from app.services import ComplaintService
from app.utils import validate_images

complaint_bp = Blueprint(
    "complaint",
    __name__,
    url_prefix="/api/v1/complaints",
)


@complaint_bp.post("")
@jwt_required()
@role_required(UserRole.CITIZEN)
def create_complaint():
    """
    Create a new complaint.

    Allows an authenticated citizen to submit a new complaint along with
    optional supporting images.

    Method: POST
    URL: /api/v1/complaints
    Auth: JWT required (role: CITIZEN)

    Request:
        Content-Type: multipart/form-data
        Form fields: complaint fields as defined by ComplaintSchema
        Files: "images" (list of image files, optional)

    Responses:
        201: Complaint created successfully. Returns the new complaint's ID.
        422: Validation failed on the submitted form data.
        404: A referenced resource (e.g. category/location) was not found.
        403: The user does not have permission to perform this action.
        500: Internal server error.
    """

    try:
        validated_data = ComplaintSchema().load(request.form.to_dict())

        images = request.files.getlist("images")
        validate_images(images)

        complaint = ComplaintService.create_complaint(
            validated_data,
            images,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaint created successfully.",
                    "data": ComplaintResponseSchema().dump(complaint),
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


@complaint_bp.get("/my")
@jwt_required()
@role_required(UserRole.CITIZEN)
def get_my_complaints():
    """
    Retrieve all complaints filed by the currently logged-in citizen.

    Method: GET
    URL: /api/v1/complaints/my
    Auth: JWT required (role: CITIZEN)

    Responses:
        200: Complaints retrieved successfully. Returns a list of the
             logged-in user's complaints, serialized via
             ComplaintResponseSchema.
        404: No complaints found for the user.
        403: The user does not have permission to perform this action.
        500: Internal server error.
    """

    try:

        complaints = ComplaintService.get_my_complaints()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaints retrieved successfully.",
                    "data": ComplaintResponseSchema(many=True).dump(complaints),
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


@complaint_bp.get("/<uuid:complaint_id>")
@jwt_required()
def get_complaint(complaint_id):
    """
    Retrieve a single complaint by its ID.

    Accessible to any authenticated user; access-level restrictions
    (e.g. citizen vs. staff) are enforced within the service layer.

    Method: GET
    URL: /api/v1/complaints/<complaint_id>
    Auth: JWT required (any role)

    Path Parameters:
        complaint_id (uuid): The unique identifier of the complaint.

    Responses:
        200: Complaint retrieved successfully.
        404: No complaint found with the given ID.
        403: The user does not have permission to view this complaint.
        500: Internal server error.
    """

    try:

        complaint = ComplaintService.get_complaint_by_id(complaint_id)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaint retrieved successfully.",
                    "data": ComplaintDetailResponseSchema().dump(complaint),
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


@complaint_bp.put("/<uuid:complaint_id>")
@jwt_required()
@role_required(UserRole.CITIZEN)
def update_complaint(complaint_id):
    """
    Update an existing complaint.

    Allows the citizen who owns the complaint to modify its details
    and/or replace its supporting images.

    Method: PUT
    URL: /api/v1/complaints/<complaint_id>
    Auth: JWT required (role: CITIZEN)

    Path Parameters:
        complaint_id (uuid): The unique identifier of the complaint to update.

    Request:
        Content-Type: multipart/form-data
        Form fields: updated complaint fields as defined by ComplaintSchema
        Files: "images" (list of image files, optional)

    Responses:
        200: Complaint updated successfully. Returns the updated complaint.
        422: Validation failed on the submitted form data.
        404: No complaint found with the given ID.
        403: The user does not own this complaint / lacks permission.
        500: Internal server error.
    """

    try:

        validated_data = ComplaintSchema().load(request.form.to_dict())

        images = request.files.getlist("images")
        if images:
            validate_images(images)

        complaint = ComplaintService.update_complaint(
            complaint_id,
            validated_data,
            images,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaint updated successfully.",
                    "data": ComplaintResponseSchema().dump(complaint),
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


@complaint_bp.delete("/<uuid:complaint_id>")
@jwt_required()
@role_required(UserRole.CITIZEN)
def delete_complaint(complaint_id):
    """
    Delete an existing complaint.

    Allows the citizen who owns the complaint to permanently remove it.

    Method: DELETE
    URL: /api/v1/complaints/<complaint_id>
    Auth: JWT required (role: CITIZEN)

    Path Parameters:
        complaint_id (uuid): The unique identifier of the complaint to delete.

    Responses:
        200: Complaint deleted successfully.
        404: No complaint found with the given ID.
        403: The user does not own this complaint / lacks permission.
        500: Internal server error.
    """

    try:

        ComplaintService.delete_complaint(complaint_id)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaint deleted successfully.",
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


@complaint_bp.patch("/<uuid:complaint_id>/reopen")
@jwt_required()
@role_required(UserRole.CITIZEN)
def reopen_complaint(
    complaint_id,
):
    """
    Reopen a resolved complaint.
    """

    try:

        data = ReopenComplaintSchema().load(request.get_json())

        complaint = ComplaintService.reopen_complaint(
            complaint_id,
            data,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaint reopened successfully.",
                    "data": ComplaintResponseSchema().dump(complaint),
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


@complaint_bp.patch("/<uuid:complaint_id>/close")
@jwt_required()
@role_required(UserRole.CITIZEN)
def close_complaint(
    complaint_id,
):
    """
    Close a resolved complaint.
    """

    try:

        complaint = ComplaintService.close_complaint(
            get_jwt_identity(),
            complaint_id,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaint closed successfully.",
                    "data": {
                        "id": complaint.id,
                        "status": complaint.status.value,
                    },
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
            400,
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


@complaint_bp.post("/<uuid:complaint_id>/remark")
@jwt_required()
@role_required(UserRole.OFFICER, UserRole.ADMIN)
def add_remark(complaint_id):
    """
    Add a remark to a complaint's activity timeline (officer or admin).
    """

    try:
        body = request.get_json() or {}
        message = (body.get("message") or "").strip()

        if not message:
            return (
                jsonify({"success": False, "message": "Message is required."}),
                400,
            )

        ComplaintService.add_remark(complaint_id, message)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Remark added successfully.",
                }
            ),
            201,
        )

    except ValueError as err:
        return (
            jsonify({"success": False, "message": str(err)}),
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
