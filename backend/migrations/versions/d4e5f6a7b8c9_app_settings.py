"""add app_settings singleton (manual_allotment)

Organization-wide settings, one row (id = 1). Seeds the row with
manual_allotment = TRUE (queue for the department head by default).

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-08-07 15:00:00.000000

"""
from datetime import datetime, timezone

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'app_settings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            'manual_allotment',
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    # Seed the singleton row.
    now = datetime.now(timezone.utc)
    op.bulk_insert(
        sa.table(
            'app_settings',
            sa.column('id', sa.Integer),
            sa.column('manual_allotment', sa.Boolean),
            sa.column('created_at', sa.DateTime(timezone=True)),
            sa.column('updated_at', sa.DateTime(timezone=True)),
        ),
        [{'id': 1, 'manual_allotment': True, 'created_at': now, 'updated_at': now}],
    )


def downgrade():
    op.drop_table('app_settings')
