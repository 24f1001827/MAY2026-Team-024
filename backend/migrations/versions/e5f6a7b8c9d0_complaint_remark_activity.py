"""complaint_remarks activity fields

Adds status_from/status_to to complaint_remarks and makes user_id nullable so
system-generated activity (e.g. auto-assignment) can be recorded without a user
author. This turns complaint_remarks into the complaint activity timeline.

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-08-07 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('complaint_remarks', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('status_from', sa.String(length=50), nullable=True)
        )
        batch_op.add_column(
            sa.Column('status_to', sa.String(length=50), nullable=True)
        )
        batch_op.alter_column(
            'user_id',
            existing_type=sa.UUID(),
            nullable=True,
        )


def downgrade():
    with op.batch_alter_table('complaint_remarks', schema=None) as batch_op:
        batch_op.alter_column(
            'user_id',
            existing_type=sa.UUID(),
            nullable=False,
        )
        batch_op.drop_column('status_to')
        batch_op.drop_column('status_from')
