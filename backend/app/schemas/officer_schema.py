from marshmallow import Schema, fields
from marshmallow_enum import EnumField

from app.models import (
    AssignmentStatus,
    ComplaintPriority,
    ComplaintStatus,
    ReviewDecision,
    TenderStatus,
    ProposalStatus,
)


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

class OfficerProposalListSchema(Schema):

    proposal_id = fields.Integer(
        attribute="id",
    )

    agency_id = fields.UUID()

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

class OfficerProposalDetailSchema(Schema):

    proposal_id = fields.Integer(
        attribute="id",
    )

    tender_id = fields.Integer()

    agency_id = fields.UUID()

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

class UpdateProposalStatusSchema(Schema):

    status = EnumField(
        ProposalStatus,
        by_value=True,
        required=True,
    )