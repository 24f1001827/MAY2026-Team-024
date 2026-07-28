from flask import Blueprint, jsonify,request
from marshmallow import ValidationError
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)

from app.middleware.role_required import role_required
from app.models.enums import UserRole
from app.schemas import (
    OfficerComplaintResponseSchema,
    ComplaintAssignmentResponseSchema,
    CreateReviewReportSchema,
    ReviewReportResponseSchema,
    OfficerComplaintDetailSchema,
    CreateTenderSchema,
    TenderResponseSchema,
)
from app.services import OfficerService

officer_bp = Blueprint(
    "officer",
    __name__,
    url_prefix="/api/v1/officer",
)

complaints_schema = OfficerComplaintResponseSchema(many=True)
assignment_schema = ComplaintAssignmentResponseSchema()
create_review_report_schema = CreateReviewReportSchema()
review_report_response_schema = ReviewReportResponseSchema()
officer_complaint_detail_schema = OfficerComplaintDetailSchema()
create_tender_schema = CreateTenderSchema()
tender_response_schema = TenderResponseSchema()


@officer_bp.get("/complaints")
@jwt_required()
@role_required(UserRole.OFFICER)
def get_my_complaints():
    """
    Retrieve complaints assigned to the logged-in officer.
    """
    try:
        user_id = get_jwt_identity()

        assignments = OfficerService.get_my_complaints(
            user_id,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Assigned complaints retrieved successfully.",
                    "data": complaints_schema.dump(assignments),
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


@officer_bp.patch("/complaints/<uuid:complaint_id>/accept")
@jwt_required()
@role_required(UserRole.OFFICER)
def accept_assignment(complaint_id):
    """
    Accept a complaint assignment.
    """
    try:
        user_id = get_jwt_identity()

        assignment = OfficerService.accept_assignment(
            user_id,
            complaint_id,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaint assignment accepted successfully.",
                    "data": assignment_schema.dump(assignment),
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
            400,
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


@officer_bp.patch("/complaints/<uuid:complaint_id>/reject")
@jwt_required()
@role_required(UserRole.OFFICER)
def reject_assignment(complaint_id):
    """
    Reject a complaint assignment.
    """
    try:
        user_id = get_jwt_identity()

        assignment = OfficerService.reject_assignment(
            user_id,
            complaint_id,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaint assignment rejected successfully.",
                    "data": assignment_schema.dump(assignment),
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
            400,
        )

    except Exception:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Failed to reject complaint assignment.",
                }
            ),
            500,
        )

@officer_bp.post("/complaints/<uuid:complaint_id>/review-report")
@jwt_required()
@role_required(UserRole.OFFICER)
def submit_review_report(complaint_id):
    """
    Submit a review report for an assigned complaint.
    """

    try:

        data = create_review_report_schema.load(
            request.get_json()
        )

        report = OfficerService.submit_review_report(
            get_jwt_identity(),
            complaint_id,
            data,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Review report submitted successfully.",
                    "data": review_report_response_schema.dump(
                        report
                    ),
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

@officer_bp.get("/complaints/<uuid:complaint_id>")
@jwt_required()
@role_required(UserRole.OFFICER)
def get_complaint_details(complaint_id):
    """
    Retrieve details of a complaint assigned to the logged-in officer.
    """

    try:

        assignment = OfficerService.get_complaint_details(
            get_jwt_identity(),
            complaint_id,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaint details retrieved successfully.",
                    "data": officer_complaint_detail_schema.dump(
                        assignment
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

@officer_bp.post("/complaints/<uuid:complaint_id>/budget-request")
@jwt_required()
@role_required(UserRole.OFFICER)
def request_budget(complaint_id):
    """
    Request budget allocation for a complaint.
    """

    try:

        complaint = OfficerService.request_budget(
            get_jwt_identity(),
            complaint_id,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Budget request submitted successfully.",
                    "data": {
                        "complaint_id": complaint.id,
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

@officer_bp.post("/complaints/<uuid:complaint_id>/tender")
@jwt_required()
@role_required(UserRole.OFFICER)
def create_tender(complaint_id):
    """
    Create a tender for a complaint.
    """

    try:

        data = create_tender_schema.load(
            request.get_json()
        )

        tender = OfficerService.create_tender(
            get_jwt_identity(),
            complaint_id,
            data,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Tender created successfully.",
                    "data": tender_response_schema.dump(
                        tender
                    ),
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