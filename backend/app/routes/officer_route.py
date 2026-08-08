from flask import Blueprint, jsonify, request
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
    OfficerTenderListSchema,
    OfficerProposalListSchema,
    OfficerProposalDetailSchema,
    UpdateProposalStatusSchema,
    CreateWorkOrderSchema,
    MarkWorkOrderIncompleteSchema,
    DepartmentDashboardResponseSchema,
    AssignComplaintSchema,
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
officer_tender_list_schema = OfficerTenderListSchema(many=True)
officer_proposal_list_schema = OfficerProposalListSchema(
    many=True,
)
officer_proposal_detail_schema = OfficerProposalDetailSchema()
update_proposal_status_schema = UpdateProposalStatusSchema()
department_dashboard_schema = DepartmentDashboardResponseSchema()
assign_complaint_schema = AssignComplaintSchema()


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


@officer_bp.get("/department/dashboard")
@jwt_required()
@role_required(UserRole.OFFICER)
def get_department_dashboard():
    """
    Aggregate dashboard for the logged-in officer's department: the department,
    its officers, and its complaints. Allotment is head-only (enforced on the
    allot endpoint); the response includes `is_department_head` so the UI can
    gate the allot controls.
    """
    try:
        user_id = get_jwt_identity()

        dashboard = OfficerService.get_my_department_dashboard(user_id)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Department dashboard retrieved successfully.",
                    "data": department_dashboard_schema.dump(dashboard),
                }
            ),
            200,
        )

    except ValueError as e:
        return (
            jsonify({"success": False, "message": str(e)}),
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


@officer_bp.post("/complaints/<uuid:complaint_id>/allot")
@jwt_required()
@role_required(UserRole.OFFICER)
def allot_complaint(complaint_id):
    """
    Allot (assign) a complaint to an officer in the department. Head-only.
    """
    try:
        user_id = get_jwt_identity()

        data = assign_complaint_schema.load(request.get_json())

        OfficerService.allot_complaint(user_id, complaint_id, data)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Complaint allotted successfully.",
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

    except PermissionError as e:
        return (
            jsonify({"success": False, "message": str(e)}),
            403,
        )

    except ValueError as e:
        return (
            jsonify({"success": False, "message": str(e)}),
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

        data = create_review_report_schema.load(request.get_json())

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
                    "data": review_report_response_schema.dump(report),
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
                    "data": officer_complaint_detail_schema.dump(assignment),
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


@officer_bp.get("/tenders")
@jwt_required()
@role_required(UserRole.OFFICER)
def get_my_tenders():
    """
    Retrieve all tenders the officer has created (oversight list).
    """

    try:
        tenders = OfficerService.get_my_tenders(get_jwt_identity())

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Tenders retrieved successfully.",
                    "data": officer_tender_list_schema.dump(tenders),
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


@officer_bp.post("/complaints/<uuid:complaint_id>/tender")
@jwt_required()
@role_required(UserRole.OFFICER)
def create_tender(complaint_id):
    """
    Create a tender for a complaint.
    """

    try:

        data = create_tender_schema.load(request.get_json())

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
                    "data": tender_response_schema.dump(tender),
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


@officer_bp.get("/tenders/<int:tender_id>/proposals")
@jwt_required()
@role_required(UserRole.OFFICER)
def get_tender_proposals(
    tender_id,
):
    """
    Retrieve proposals submitted for a tender.
    """

    try:

        proposals = OfficerService.get_tender_proposals(
            get_jwt_identity(),
            tender_id,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Tender proposals retrieved successfully.",
                    "data": officer_proposal_list_schema.dump(
                        proposals,
                    ),
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


@officer_bp.get("/proposals/<int:proposal_id>")
@jwt_required()
@role_required(UserRole.OFFICER)
def get_proposal(
    proposal_id,
):
    """
    Retrieve proposal details.
    """

    try:

        proposal = OfficerService.get_proposal(
            get_jwt_identity(),
            proposal_id,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Proposal retrieved successfully.",
                    "data": officer_proposal_detail_schema.dump(
                        proposal,
                    ),
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


@officer_bp.patch("/proposals/<int:proposal_id>/status")
@jwt_required()
@role_required(UserRole.OFFICER)
def update_proposal_status(
    proposal_id,
):
    """
    Update proposal status.
    """

    try:

        data = update_proposal_status_schema.load(request.get_json())

        proposal = OfficerService.update_proposal_status(
            get_jwt_identity(),
            proposal_id,
            data,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Proposal status updated successfully.",
                    "data": officer_proposal_detail_schema.dump(
                        proposal,
                    ),
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


@officer_bp.post("/proposals/<int:proposal_id>/work-order")
@jwt_required()
@role_required(UserRole.OFFICER)
def create_work_order(proposal_id):
    """
    Create work order.
    """

    try:
        data = CreateWorkOrderSchema().load(request.get_json())

        work_order = OfficerService.create_work_order(
            get_jwt_identity(),
            proposal_id,
            data,
        )
        response = {
            "id": work_order.id,
            "tender_id": work_order.tender_id,
            "agency_id": str(work_order.agency_id),
            "assigned_by": str(work_order.assigned_by),
            "scope_of_work": work_order.scope_of_work,
            "status": work_order.status.value,
            "remarks": work_order.remarks,
            "created_at": (
                work_order.created_at.isoformat() if work_order.created_at else None
            ),
            "updated_at": (
                work_order.updated_at.isoformat() if work_order.updated_at else None
            ),
        }

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Work order created successfully.",
                    "data": response,
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


@officer_bp.patch("/work-orders/<int:work_order_id>/verify")
@jwt_required()
@role_required(UserRole.OFFICER)
def verify_work_order(
    work_order_id,
):
    """
    Verify completed work order.
    """

    try:

        work_order = OfficerService.verify_work_order(
            get_jwt_identity(),
            work_order_id,
        )

        response = {
            "id": work_order.id,
            "status": work_order.status.value,
            "verified_by": work_order.verified_by,
            "verified_at": (
                work_order.verified_at.isoformat() if work_order.verified_at else None
            ),
            "updated_at": (
                work_order.updated_at.isoformat() if work_order.updated_at else None
            ),
        }

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Work order verified successfully.",
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


@officer_bp.patch("/work-orders/<int:work_order_id>/mark-incomplete")
@jwt_required()
@role_required(UserRole.OFFICER)
def mark_work_order_incomplete(
    work_order_id,
):
    """
    Mark a work order as incomplete.
    """

    try:

        data = MarkWorkOrderIncompleteSchema().load(request.get_json())

        work_order = OfficerService.mark_work_order_incomplete(
            get_jwt_identity(),
            work_order_id,
            data,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": ("Work order marked as incomplete successfully."),
                    "data": {
                        "id": work_order.id,
                        "status": work_order.status.value,
                    },
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
