"""budget ledger (addition + allocation history)

Audit trail of department budget events — one row per Addition (funding) or
Allocation (committed to a complaint) — powering the budget history views.

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-08-08 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b8c9d0e1f2a3'
down_revision = 'a7b8c9d0e1f2'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'budget_ledger',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=False),
        sa.Column('financial_year', sa.String(length=9), nullable=False),
        sa.Column('entry_type', sa.String(length=20), nullable=False),
        sa.Column(
            'amount', sa.Numeric(precision=14, scale=2), nullable=False
        ),
        sa.Column('complaint_id', sa.UUID(as_uuid=True), nullable=True),
        sa.Column('note', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id']),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('budget_ledger')
