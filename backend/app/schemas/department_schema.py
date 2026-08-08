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

    head_officer_id = fields.UUID(
        required=False,
        allow_none=True,
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

    head_officer_id = fields.UUID(
        allow_none=True,
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


class PublicDepartmentSchema(Schema):
    """
    Minimal, safe-to-expose department fields for unauthenticated consumers
    (e.g. the officer registration dropdown). Only id and name — no budget,
    description, or timestamps.
    """

    id = fields.Integer(
        dump_only=True,
    )

    name = fields.String()


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

    # Current-financial-year budget summary, sourced from the year-wise budget
    # module (not a legacy column): { financial_year, total, allocated, available }.
    budget = fields.Method("get_budget")

    head_officer_id = fields.UUID(
        allow_none=True,
        dump_only=True,
    )

    def get_budget(self, obj):
        from app.services.admin_budget_service import department_budget_summary

        return department_budget_summary(obj)

    # The head officer's display name, resolved via the `head_officer`
    # relationship. Null when no head is assigned.
    head_officer_name = fields.String(
        attribute="head_officer.name",
        allow_none=True,
        dump_only=True,
    )

    created_at = fields.DateTime(
        dump_only=True,
    )

    updated_at = fields.DateTime(
        dump_only=True,
    )