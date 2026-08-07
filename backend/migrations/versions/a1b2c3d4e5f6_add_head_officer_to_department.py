"""add head_officer_id to departments

Revision ID: a1b2c3d4e5f6
Revises: 570dc497aa3b
Create Date: 2026-08-07 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '570dc497aa3b'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('departments', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('head_officer_id', sa.UUID(), nullable=True)
        )
        batch_op.create_foreign_key(
            'fk_departments_head_officer_id_users',
            'users',
            ['head_officer_id'],
            ['id'],
        )


def downgrade():
    with op.batch_alter_table('departments', schema=None) as batch_op:
        batch_op.drop_constraint(
            'fk_departments_head_officer_id_users',
            type_='foreignkey',
        )
        batch_op.drop_column('head_officer_id')
