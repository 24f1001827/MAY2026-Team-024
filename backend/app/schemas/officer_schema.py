from marshmallow import Schema, ValidationError, fields, validates
from marshmallow_enum import EnumField

from app.models import (
    AssignmentStatus,
    AvailabilityStatus,
    ComplaintPriority,
    ComplaintStatus,
    ReviewDecision,
    TenderStatus,
    ProposalStatus,
)
from app.schemas.complaint_schema import ComplaintResponseSchema


class OfficerComplaintResponseSchema(Schema):
    """
    Response schema for complaints assigned to an officer.
    """

    complaint_id = fields.UUID(
        attribute="complaint.id",
    )

    title = fields.String(
        attribute="complaint.title",
    )

    priority = EnumField(
        ComplaintPriority,
        attribute="complaint.priority",
        by_value=True,
    )

    complaint_status = EnumField(
        ComplaintStatus,
        attribute="complaint.status",
        by_value=True,
    )

    assignment_status = EnumField(
        AssignmentStatus,
        attribute="status",
        by_value=True,
    )

    department = fields.String(
        attribute="complaint.department.name",
    )

    city = fields.String(
        attribute="complaint.city",
    )

    assigned_at = fields.DateTime(
        attribute="created_at",
    )


class ComplaintAssignmentResponseSchema(Schema):
    """
    Response schema for complaint assignment.
    """

    complaint_id = fields.UUID()

    assignment_status = EnumField(
        AssignmentStatus,
        attribute="status",
        by_value=True,
    )

    accepted_at = fields.DateTime(
        allow_none=True,
    )

    officer_id = fields.UUID()

    officer_name = fields.Method("get_officer_name")

    rejection_reason = fields.String(allow_none=True)

    rejected_at = fields.DateTime(allow_none=True)

    def get_officer_name(self, obj):
        return obj.officer.user.name if obj.officer and obj.officer.user else None


class RejectAssignmentSchema(Schema):
    """
    The officer's reason for handing a complaint back. Optional, but the
    department head has nothing to go on without it, so it is encouraged in
    the UI and capped here.
    """

    reason = fields.String(required=False, allow_none=True, load_default=None)

    @validates("reason")
    def validate_reason(self, value, **kwargs):
        if value is None:
            return

        if len(value.strip()) and len(value.strip()) < 5:
            raise ValidationError("Give at least 5 characters, or leave it blank.")

        if len(value) > 500:
            raise ValidationError("Reason cannot exceed 500 characters.")


class CreateReviewReportSchema(Schema):
    """
    Request schema for submitting a review report.
    """

    findings = fields.String(
        required=True,
    )

    estimated_cost = fields.Decimal(
        required=False,
        allow_none=True,
    )

    estimated_duration_days = fields.Integer(
        required=False,
        allow_none=True,
    )

    decision = EnumField(
        ReviewDecision,
        required=True,
        by_value=True,
    )


class ReviewReportResponseSchema(Schema):
    """
    Response schema for review report.
    """

    complaint_id = fields.UUID()

    findings = fields.String()

    estimated_cost = fields.Decimal(
        allow_none=True,
    )

    estimated_duration_days = fields.Integer(
        allow_none=True,
    )

    decision = EnumField(
        ReviewDecision,
        by_value=True,
    )

    review_date = fields.DateTime()

class ReviewReportDetailSchema(Schema):
    findings = fields.String()
    estimated_cost = fields.Decimal(allow_none=True)
    estimated_duration_days = fields.Integer(allow_none=True)

    decision = EnumField(
        ReviewDecision,
        by_value=True,
    )

    review_date = fields.DateTime()


class OfficerComplaintDetailSchema(Schema):

    complaint_id = fields.UUID(attribute="complaint.id")

    title = fields.String(attribute="complaint.title")

    description = fields.String(attribute="complaint.description")

    priority = EnumField(
        ComplaintPriority,
        attribute="complaint.priority",
        by_value=True,
    )

    complaint_status = EnumField(
        ComplaintStatus,
        attribute="complaint.status",
        by_value=True,
    )

    assignment_status = EnumField(
        AssignmentStatus,
        attribute="status",
        by_value=True,
    )

    assignment_note = fields.String()

    assigned_at = fields.DateTime(attribute="created_at")

    accepted_at = fields.DateTime()

    department = fields.String(
        attribute="complaint.department.name"
    )

    latitude = fields.Float(attribute="complaint.latitude")

    longitude = fields.Float(attribute="complaint.longitude")

    address = fields.String(attribute="complaint.address")

    locality = fields.String(attribute="complaint.locality")

    city = fields.String(attribute="complaint.city")

    state = fields.String(attribute="complaint.state")

    pincode = fields.String(attribute="complaint.pincode")

    ai_category = fields.String(
        attribute="complaint.ai_category"
    )

    ai_priority_score = fields.Float(
        attribute="complaint.ai_priority_score"
    )

    images = fields.Method("get_images")
    def get_images(self, obj):
        return [img.image_url for img in obj.complaint.images]

    review_report = fields.Nested(
        ReviewReportDetailSchema,
        attribute="complaint.review_report",
        allow_none=True,
    )

class CreateTenderSchema(Schema):

    title = fields.String(required=True)

    description = fields.String(
        required=False,
        allow_none=True,
    )

    closing_date = fields.DateTime(required=True)


class TenderResponseSchema(Schema):

    id = fields.Integer()

    complaint_id = fields.UUID()

    title = fields.String()

    description = fields.String()

    estimated_cost = fields.Decimal()

    closing_date = fields.DateTime()

    status = EnumField(
        TenderStatus,
        by_value=True,
    )

class OfficerTenderListSchema(Schema):
    """
    A tender row for an officer's oversight list — includes the linked complaint
    title so the officer can jump to it (management lives on the complaint).
    """

    id = fields.Integer()

    complaint_id = fields.UUID()

    complaint_title = fields.String(attribute="complaint.title")

    title = fields.String()

    status = EnumField(TenderStatus, by_value=True)

    estimated_cost = fields.Decimal(as_string=True)

    closing_date = fields.DateTime()

    created_at = fields.DateTime()


def _agency_name(obj):
    """Agency's display name via agency → user, tolerant of missing relations."""
    return obj.agency.user.name if obj.agency and obj.agency.user else None


class OfficerProposalListSchema(Schema):

    proposal_id = fields.Integer(
        attribute="id",
    )

    agency_id = fields.UUID()

    # The reviewing officer sees the agency by name, not just its UUID.
    agency_name = fields.Method("get_agency_name")

    contact_person = fields.String(
        attribute="agency.contact_person",
        allow_none=True,
    )

    proposal_amount = fields.Decimal(
        as_string=True,
    )

    proposal_document = fields.String()

    remarks = fields.String()

    status = EnumField(
        ProposalStatus,
        by_value=True,
    )

    created_at = fields.DateTime()

    def get_agency_name(self, obj):
        return _agency_name(obj)

class OfficerProposalDetailSchema(Schema):

    proposal_id = fields.Integer(
        attribute="id",
    )

    tender_id = fields.Integer()

    agency_id = fields.UUID()

    agency_name = fields.Method("get_agency_name")

    contact_person = fields.String(
        attribute="agency.contact_person",
        allow_none=True,
    )

    proposal_amount = fields.Decimal(
        as_string=True,
    )

    proposal_document = fields.String()

    remarks = fields.String()

    status = EnumField(
        ProposalStatus,
        by_value=True,
    )

    created_at = fields.DateTime()

    updated_at = fields.DateTime()

    def get_agency_name(self, obj):
        return _agency_name(obj)

class UpdateProposalStatusSchema(Schema):

    status = EnumField(
        ProposalStatus,
        by_value=True,
        required=True,
    )


class OfficerDirectorySchema(Schema):
    """
    Privacy-safe officer directory entry for any authenticated user (citizens
    included): name, department, availability only — no contact info or
    workload.
    """

    user_id = fields.UUID()

    name = fields.String(attribute="user.name")

    department = fields.String(attribute="department.name")

    availability_status = EnumField(
        AvailabilityStatus,
        by_value=True,
    )


class DepartmentOfficerSchema(Schema):
    """
    An officer within a department, flattened with their user's display fields
    and workload — used by the department dashboard's officer list + allotment.
    """

    user_id = fields.UUID()

    name = fields.String(attribute="user.name")

    email = fields.String(attribute="user.email")

    availability_status = EnumField(
        AvailabilityStatus,
        by_value=True,
    )

    current_workload = fields.Integer()

    max_workload = fields.Integer()

    is_department_head = fields.Boolean()


class DepartmentDashboardResponseSchema(Schema):
    """
    Aggregate payload for the officer's department dashboard: the department,
    its officers, and its complaints (the frontend splits complaints into the
    unassigned queue / the viewer's own / totals via assigned_officer_id).
    """

    is_department_head = fields.Boolean()

    manual_allotment = fields.Boolean()

    department = fields.Method("get_department")

    officers = fields.Nested(
        DepartmentOfficerSchema,
        many=True,
    )

    complaints = fields.Nested(
        ComplaintResponseSchema,
        many=True,
    )

    def get_department(self, obj):
        d = obj["department"]
        from app.services.admin_budget_service import department_budget_summary

        return {
            "id": d.id,
            "name": d.name,
            "description": d.description,
            "budget": department_budget_summary(d),
            "head_officer_id": (
                str(d.head_officer_id) if d.head_officer_id else None
            ),
        }