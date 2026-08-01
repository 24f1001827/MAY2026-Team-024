"""add closed enum to work order

Revision ID: 570dc497aa3b
Revises: 44a07291e9e4
Create Date: 2026-08-01 19:11:48.318553

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '570dc497aa3b'
down_revision = '44a07291e9e4'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TYPE workorderstatus ADD VALUE IF NOT EXISTS 'CLOSED';"
    )


def downgrade():
    pass
