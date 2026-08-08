from marshmallow import Schema, fields
from marshmallow_enum import EnumField

from app.models.enums import UserStatus


class AdminAgencySchema(Schema):
    """
    Agency row for the admin agencies directory — joins the agency profile with
    its owning user (name/email/phone/status). The agency PK is the shared
    `user_id`, exposed as `id` for the frontend.
    """

    id = fields.UUID(attribute="user_id")

    name = fields.String(attribute="user.name")

    email = fields.String(attribute="user.email")

    phone = fields.String(attribute="user.phone", allow_none=True)

    status = EnumField(
        UserStatus,
        attribute="user.status",
        by_value=True,
    )

    registration_number = fields.String()

    license_number = fields.String()

    contact_person = fields.String(allow_none=True)

    current_projects = fields.Integer()

    max_projects = fields.Integer()

    created_at = fields.DateTime()
