"""add is_department_head flag to officers

Denormalized flag marking an officer as the head of their department. Kept in
sync with departments.head_officer_id via the department create/update flow.
Used for allotment authorization (admin or head) and the officer login landing.

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-08-07 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('officers', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'is_department_head',
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )

    # Backfill from the existing head_officer_id links so current heads keep
    # their status, then drop the server default (the model sets it going
    # forward).
    op.execute(
        "UPDATE officers SET is_department_head = TRUE "
        "WHERE user_id IN (SELECT head_officer_id FROM departments "
        "WHERE head_officer_id IS NOT NULL)"
    )

    with op.batch_alter_table('officers', schema=None) as batch_op:
        batch_op.alter_column('is_department_head', server_default=None)


def downgrade():
    with op.batch_alter_table('officers', schema=None) as batch_op:
        batch_op.drop_column('is_department_head')
