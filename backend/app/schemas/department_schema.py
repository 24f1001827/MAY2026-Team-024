from marshmallow import (
    Schema,
    ValidationError,
    fields,
    post_load,
    validate,
)


class CreateDepartmentSchema(Schema):
    """
    Schema for creating a department.
    """

    name = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=100,
        ),
        error_messages={
            "required": "Department name is required.",
        },
    )

    description = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=500,
        ),
    )

    budget = fields.Decimal(
        required=False,
        places=2,
        as_string=True,
    )

    @post_load
    def strip_fields(self, data, **kwargs):
        name = data.get("name", "").strip()
        data["name"] = name

        if not name:
            raise ValidationError(
                {"name": ["Department name cannot be empty."]}
            )

        if data.get("description"):
            data["description"] = data["description"].strip()

        return data


class UpdateDepartmentSchema(Schema):
    """
    Schema for updating a department.
    """

    name = fields.String(
        validate=validate.Length(
            min=2,
            max=100,
        ),
    )

    description = fields.String(
        allow_none=True,
        validate=validate.Length(
            max=500,
        ),
    )

    budget = fields.Decimal(
        places=2,
        as_string=True,
    )

    @post_load
    def strip_fields(self, data, **kwargs):
        if "name" in data:
            name = data.get("name", "").strip()
            data["name"] = name

            if not name:
                raise ValidationError(
                    {"name": ["Department name cannot be empty."]}
                )

        if data.get("description"):
            data["description"] = data["description"].strip()

        return data


class DepartmentResponseSchema(Schema):
    """
    Schema for department response.
    """

    id = fields.Integer(
        dump_only=True,
    )

    name = fields.String()

    description = fields.String(
        allow_none=True,
    )

    budget = fields.Decimal(
        places=2,
        as_string=True,
    )

    created_at = fields.DateTime(
        dump_only=True,
    )

    updated_at = fields.DateTime(
        dump_only=True,
    )