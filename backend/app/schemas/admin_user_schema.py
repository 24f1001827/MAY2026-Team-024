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

    # Officer capacity/load — null for non-officers.
    current_workload = fields.Method("get_current_workload")

    max_workload = fields.Method("get_max_workload")

    def get_current_workload(self, obj):
        return obj.officer.current_workload if obj.officer else None

    def get_max_workload(self, obj):
        return obj.officer.max_workload if obj.officer else None


class UpdateUserStatusSchema(Schema):
    """
    Schema for updating a user's status.
    """

    status = fields.Enum(
        UserStatus,
        required=True,

        by_value=True,
    )


class UpdateMaxWorkloadSchema(Schema):
    """
    Schema for setting an officer's maximum workload (capacity).
    """

    max_workload = fields.Integer(
        required=True,
        validate=validate.Range(min=1, max=1000),
    )