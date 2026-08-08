from marshmallow import Schema, fields


class AllocateBudgetSchema(Schema):
    """
    Request schema for allocating budget.
    """

    amount = fields.Decimal(
        required=True,
        as_string=True,
    )


class DepartmentBudgetSchema(Schema):
    """
    A department's year-wise budget. `available` is derived (total - allocated).
    """

    id = fields.Integer()

    department_id = fields.Integer()

    department_name = fields.String(attribute="department.name")

    financial_year = fields.String()

    total_amount = fields.Decimal(as_string=True)

    allocated_amount = fields.Decimal(as_string=True)

    available_amount = fields.Method("get_available")

    created_at = fields.DateTime()

    updated_at = fields.DateTime()

    def get_available(self, obj):
        total = obj.total_amount or 0
        allocated = obj.allocated_amount or 0
        return str(total - allocated)


class AddDepartmentBudgetSchema(Schema):
    """
    Request schema for funding a department's budget for a financial year.
    """

    department_id = fields.Integer(required=True)

    amount = fields.Decimal(required=True, as_string=True)

    financial_year = fields.String(required=False, allow_none=True)


class BudgetLedgerEntrySchema(Schema):
    """
    One budget ledger entry (addition or allocation). `complaint_id`/
    `complaint_title` are set only for allocations.
    """

    id = fields.Integer()

    financial_year = fields.String()

    entry_type = fields.String()

    amount = fields.Decimal(as_string=True)

    complaint_id = fields.UUID(allow_none=True)

    complaint_title = fields.String(
        attribute="complaint.title",
        allow_none=True,
    )

    note = fields.String(allow_none=True)

    created_at = fields.DateTime()