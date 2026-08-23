"""record why an officer handed a complaint back, so the head can re-allot it

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
"""
from alembic import op
import sqlalchemy as sa

revision = "d2e3f4a5b6c7"
down_revision = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "complaint_assignments",
        sa.Column("rejection_reason", sa.Text(), nullable=True),
    )
    op.add_column(
        "complaint_assignments",
        sa.Column("rejected_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_column("complaint_assignments", "rejected_at")
    op.drop_column("complaint_assignments", "rejection_reason")
