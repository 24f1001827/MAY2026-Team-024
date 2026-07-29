from marshmallow import Schema, fields
from marshmallow_enum import EnumField

from app.models import TenderStatus,ProposalStatus


class TenderListSchema(Schema):
    id = fields.Integer()

    complaint_id = fields.UUID()

    title = fields.String()

    estimated_cost = fields.Decimal(
        as_string=True,
    )

    closing_date = fields.DateTime()

    status = EnumField(
        TenderStatus,
        by_value=True,
    )

class TenderDetailSchema(Schema):
    id = fields.Integer()

    complaint_id = fields.UUID()

    title = fields.String()

    description = fields.String()

    estimated_cost = fields.Decimal(
        as_string=True,
    )

    closing_date = fields.DateTime()

    status = EnumField(
        TenderStatus,
        by_value=True,
    )

    created_at = fields.DateTime()

class CreateProposalSchema(Schema):
    proposal_amount = fields.Decimal(
        required=True,
        as_string=True,
    )

    remarks = fields.String(
        required=False,
        allow_none=True,
    )


class ProposalResponseSchema(Schema):
    proposal_id = fields.Integer(
        attribute="id"
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

class AgencyProposalListSchema(Schema):

    proposal_id = fields.Integer(
        attribute="id",
    )

    tender_id = fields.Integer()

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