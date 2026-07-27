from marshmallow import Schema, fields, validate
from marshmallow_enum import EnumField

from app.models.enums import UserRole, UserStatus


class UserResponseSchema(Schema):
    """
    Schema for user details returned to the admin.
    """

    id = fields.UUID()

    name = fields.String()

    email = fields.Email()

    phone = fields.String()

    role = EnumField(UserRole)

    status = EnumField(UserStatus)


class UpdateUserStatusSchema(Schema):
    """
    Schema for updating a user's status.
    """

    status = fields.Enum(
        UserStatus,
        required=True,

        by_value=True,
    )