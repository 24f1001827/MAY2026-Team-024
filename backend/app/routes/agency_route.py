from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    get_jwt_identity,
    jwt_required,
)
from marshmallow import ValidationError

from app.middleware import role_required
from app.models import UserRole
from app.schemas import TenderListSchema,TenderDetailSchema, CreateProposalSchema,ProposalResponseSchema,AgencyProposalListSchema
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
                    "data": tender_list_schema.dump(
                        tenders
                    ),
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

        data = create_proposal_schema.load(
            request.form
        )

        proposal_document = request.files.get(
            "proposal_document"
        )

        validate_document(proposal_document)

        if not proposal_document:
            raise ValueError("Proposal document is required")

        proposal = AgencyService.submit_proposal(
            get_jwt_identity(),
            tender_id,
            data,
            proposal_document
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

