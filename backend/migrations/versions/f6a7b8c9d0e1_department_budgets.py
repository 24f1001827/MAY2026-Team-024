"""year-wise department budgets + per-complaint allocated budget

Adds a `department_budgets` table (one row per department + financial year,
tracking total vs allocated), and `allocated_budget` / `budget_year` columns on
`complaints` so an allocation is recorded per complaint and drawn from a year's
budget.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'department_budgets',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=False),
        sa.Column('financial_year', sa.String(length=9), nullable=False),
        sa.Column(
            'total_amount',
            sa.Numeric(precision=14, scale=2),
            nullable=False,
            server_default='0',
        ),
        sa.Column(
            'allocated_amount',
            sa.Numeric(precision=14, scale=2),
            nullable=False,
            server_default='0',
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'department_id',
            'financial_year',
            name='uq_department_budget_year',
        ),
    )

    op.add_column(
        'complaints',
        sa.Column(
            'allocated_budget',
            sa.Numeric(precision=14, scale=2),
            nullable=True,
        ),
    )
    op.add_column(
        'complaints',
        sa.Column('budget_year', sa.String(length=9), nullable=True),
    )


def downgrade():
    op.drop_column('complaints', 'budget_year')
    op.drop_column('complaints', 'allocated_budget')
    op.drop_table('department_budgets')
