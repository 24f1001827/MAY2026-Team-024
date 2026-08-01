from marshmallow import Schema, fields, validate
from app.models import WorkOrderStatus


class CreateWorkOrderSchema(Schema):
    scope_of_work = fields.String(
        required=True,
        validate=validate.Length(
            min=10,
            max=2000,
        ),
    )

    remarks = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=1000,
        ),
    )

class UpdateWorkOrderStatusSchema(Schema):
    status = fields.Enum(
        WorkOrderStatus,
        required=True,
        by_value=True,
    )

class MarkWorkOrderIncompleteSchema(Schema):
    remarks = fields.String(
        required=True,
        validate=validate.Length(
            min=10,
            max=500,
        ),
    )