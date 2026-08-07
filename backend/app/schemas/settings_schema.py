from marshmallow import Schema, fields


class SettingsResponseSchema(Schema):
    """Organization-wide settings response."""

    manual_allotment = fields.Boolean()


class UpdateSettingsSchema(Schema):
    """Input for updating organization-wide settings."""

    manual_allotment = fields.Boolean(required=True)
