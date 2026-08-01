"""add complaint and work order enum values

Revision ID: 44a07291e9e4
Revises: 10afe723ccff
Create Date: 2026-08-01 14:37:25.182983

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '44a07291e9e4'
down_revision = '10afe723ccff'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TYPE complaintstatus ADD VALUE IF NOT EXISTS 'REOPENED';"
    )

    op.execute(
        "ALTER TYPE workorderstatus ADD VALUE IF NOT EXISTS 'INCOMPLETE';"
    )


def downgrade():
    pass
