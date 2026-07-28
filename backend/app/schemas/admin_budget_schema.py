from marshmallow import Schema, fields


class AllocateBudgetSchema(Schema):
    """
    Request schema for allocating budget.
    """

    amount = fields.Decimal(
        required=True,
        as_string=True,
    )