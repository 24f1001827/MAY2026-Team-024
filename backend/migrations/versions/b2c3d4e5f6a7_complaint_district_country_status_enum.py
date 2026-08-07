"""add district/country to complaints and fix status enum spelling

Adds nullable `district` and `country` columns to `complaints`, and renames the
misspelled `complaintstatus` enum value TENDER_ALLOTED -> TENDER_ALLOTTED to
match the corrected Python enum (and the frontend "TenderAllotted").

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-07 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('complaints', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('district', sa.String(length=100), nullable=True)
        )
        batch_op.add_column(
            sa.Column('country', sa.String(length=100), nullable=True)
        )

    # Native Postgres enums store the member NAME token; rename in place.
    # RENAME VALUE is transaction-safe (Postgres 10+).
    op.execute(
        "ALTER TYPE complaintstatus "
        "RENAME VALUE 'TENDER_ALLOTED' TO 'TENDER_ALLOTTED'"
    )


def downgrade():
    op.execute(
        "ALTER TYPE complaintstatus "
        "RENAME VALUE 'TENDER_ALLOTTED' TO 'TENDER_ALLOTED'"
    )

    with op.batch_alter_table('complaints', schema=None) as batch_op:
        batch_op.drop_column('country')
        batch_op.drop_column('district')
