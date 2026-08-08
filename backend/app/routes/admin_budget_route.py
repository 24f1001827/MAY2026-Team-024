from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError

from app.middleware import role_required
from app.models import UserRole
from app.schemas import (
    DepartmentBudgetSchema,
    AddDepartmentBudgetSchema,
    BudgetLedgerEntrySchema,
)
from app.services import AdminBudgetService

admin_budget_bp = Blueprint(
    "admin_budget",
    __name__,
    url_prefix="/api/v1/admin/budgets",
)

budget_list_schema = DepartmentBudgetSchema(many=True)
budget_schema = DepartmentBudgetSchema()
add_budget_schema = AddDepartmentBudgetSchema()
ledger_list_schema = BudgetLedgerEntrySchema(many=True)


@admin_budget_bp.get("")
@jwt_required()
@role_required(UserRole.ADMIN)
def get_budgets():
    """
    All department budgets across years (admin budget console).
    """

    try:
        budgets = AdminBudgetService.list_budgets()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Budgets retrieved successfully.",
                    "data": budget_list_schema.dump(budgets),
                }
            ),
            200,
        )

    except Exception as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error.",
                    "error": str(err),
                }
            ),
            500,
        )


@admin_budget_bp.get("/departments/<int:department_id>/history")
@jwt_required()
@role_required(UserRole.ADMIN)
def get_department_history(department_id):
    """
    A department's budget history — additions and allocations (utilization).
    """

    try:
        history = AdminBudgetService.get_department_history(department_id)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Budget history retrieved successfully.",
                    "data": {
                        "additions": ledger_list_schema.dump(
                            history["additions"]
                        ),
                        "allocations": ledger_list_schema.dump(
                            history["allocations"]
                        ),
                    },
                }
            ),
            200,
        )

    except ValueError as err:
        return (
            jsonify({"success": False, "message": str(err)}),
            404,
        )

    except Exception as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error.",
                    "error": str(err),
                }
            ),
            500,
        )


@admin_budget_bp.post("")
@jwt_required()
@role_required(UserRole.ADMIN)
def add_budget():
    """
    Fund a department's budget for a financial year (create or top up).
    """

    try:
        data = add_budget_schema.load(request.get_json())

        budget = AdminBudgetService.add_budget(data)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Budget updated successfully.",
                    "data": budget_schema.dump(budget),
                }
            ),
            201,
        )

    except ValidationError as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Validation failed.",
                    "errors": err.messages,
                }
            ),
            422,
        )

    except ValueError as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": str(err),
                }
            ),
            400,
        )

    except Exception as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error.",
                    "error": str(err),
                }
            ),
            500,
        )
