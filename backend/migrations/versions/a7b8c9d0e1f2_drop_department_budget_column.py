"""drop the legacy departments.budget column

Department budgets are now year-wise (`department_budgets` table); the single
`departments.budget` column is redundant and no longer mapped by the model.

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-08-08 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a7b8c9d0e1f2'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('departments', 'budget')


def downgrade():
    op.add_column(
        'departments',
        sa.Column(
            'budget',
            sa.Numeric(precision=12, scale=2),
            nullable=True,
            server_default='0',
        ),
    )
