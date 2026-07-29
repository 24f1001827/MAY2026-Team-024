from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)
from marshmallow import ValidationError

from app.middleware import role_required
from app.models import UserRole
from app.schemas import (
    TenderListSchema,
    TenderDetailSchema,
    CreateProposalSchema,
    ProposalResponseSchema,
    AgencyProposalListSchema,
    UpdateWorkOrderStatusSchema,
)
from app.services import AgencyService
from app.utils import upload_document,validate_document

agency_bp = Blueprint(
    "agency",
    __name__,
    url_prefix="/api/v1/agency",
)

tender_list_schema = TenderListSchema(many=True)
tender_detail_schema = TenderDetailSchema()
create_proposal_schema = CreateProposalSchema()
proposal_response_schema = ProposalResponseSchema()
proposal_list_schema = AgencyProposalListSchema(
    many=True,
)


@agency_bp.get("/tenders")
@jwt_required()
@role_required(UserRole.AGENCY)
def get_open_tenders():
    """
    Retrieve all open tenders.
    """

    try:

        tenders = AgencyService.get_open_tenders()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Open tenders retrieved successfully.",
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


@agency_bp.get("/tenders/<int:tender_id>")
@jwt_required()
@role_required(UserRole.AGENCY)
def get_tender_details(tender_id):
    """
    Retrieve details of a tender.
    """

    try:

        tender = AgencyService.get_tender_details(
            tender_id,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Tender details retrieved successfully.",
                    "data": tender_detail_schema.dump(
                        tender,
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


@agency_bp.post("/tenders/<int:tender_id>/proposal")
@jwt_required()
@role_required(UserRole.AGENCY)
def submit_proposal(tender_id):
    """
    Submit proposal for a tender.
    """

    try:

        data = create_proposal_schema.load(request.form)

        proposal_document = request.files.get("proposal_document")

        validate_document(proposal_document)

        if not proposal_document:
            raise ValueError("Proposal document is required")

        proposal = AgencyService.submit_proposal(
            get_jwt_identity(), tender_id, data, proposal_document
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Proposal submitted successfully.",
                    "data": proposal_response_schema.dump(
                        proposal,
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


@agency_bp.get("/proposals")
@jwt_required()
@role_required(UserRole.AGENCY)
def get_proposals():
    """
    Retrieve proposals submitted by the logged-in agency.
    """

    try:

        proposals = AgencyService.get_proposals(
            get_jwt_identity(),
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Agency proposals retrieved successfully.",
                    "data": proposal_list_schema.dump(
                        proposals,
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


@agency_bp.get("/work-orders")
@jwt_required()
@role_required(UserRole.AGENCY)
def get_work_orders():
    """
    Get all work orders assigned to the logged-in agency.
    """

    try:
        work_orders = AgencyService.get_work_orders(
            get_jwt_identity(),
        )

        response = []

        for work_order in work_orders:
            response.append(
                {
                    "id": work_order.id,
                    "tender_id": work_order.tender_id,
                    "scope_of_work": work_order.scope_of_work,
                    "status": work_order.status.value,
                    "remarks": work_order.remarks,
                    "created_at": work_order.created_at.isoformat(),
                }
            )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Work orders retrieved successfully.",
                    "data": response,
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


@agency_bp.get("/work-orders/<int:work_order_id>")
@jwt_required()
@role_required(UserRole.AGENCY)
def get_work_order(
    work_order_id,
):
    """
    Get work order details.
    """

    try:

        work_order = AgencyService.get_work_order(
            get_jwt_identity(),
            work_order_id,
        )

        response = {
            "id": work_order.id,
            "tender_id": work_order.tender_id,
            "scope_of_work": work_order.scope_of_work,
            "status": work_order.status.value,
            "start_date": (
                work_order.start_date.isoformat() if work_order.start_date else None
            ),
            "end_date": (
                work_order.end_date.isoformat() if work_order.end_date else None
            ),
            "completion_proof_url": work_order.completion_proof_url,
            "remarks": work_order.remarks,
            "created_at": work_order.created_at.isoformat(),
            "updated_at": work_order.updated_at.isoformat(),
        }

        return (
            jsonify(
                {
                    "success": True,
                    "data": response,
                }
            ),
            200,
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


@agency_bp.patch("/work-orders/<int:work_order_id>/status")
@jwt_required()
@role_required(UserRole.AGENCY)
def update_work_order_status(work_order_id):
    """
    Update work order status.
    """

    try:
        data = UpdateWorkOrderStatusSchema().load(
            request.form
        )

        completion_proof = request.files.get(
            "completion_proof"
        )

        work_order = AgencyService.update_work_order_status(
            get_jwt_identity(),
            work_order_id,
            data,
            completion_proof,
        )

        response = {
            "id": work_order.id,
            "status": work_order.status.value,
            "start_date": (
                work_order.start_date.isoformat()
                if work_order.start_date
                else None
            ),
            "end_date": (
                work_order.end_date.isoformat()
                if work_order.end_date
                else None
            ),
            "completion_proof_url": (
                work_order.completion_proof_url
            ),
            "updated_at": (
                work_order.updated_at.isoformat()
                if work_order.updated_at
                else None
            ),
        }

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Work order status updated successfully.",
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