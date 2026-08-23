"""record why a complaint grouping was disputed and how staff settled it

Also merges the two heads left behind by the parallel budget-ledger and
semantic-embedding branches (`b8c9d0e1f2a3` and `a8b9c0d1e2f3`), which had
diverged from `f6a7b8c9d0e1` and made `flask db upgrade` ambiguous.

Revision ID: c1d2e3f4a5b6
Revises: b8c9d0e1f2a3, a8b9c0d1e2f3
"""
from alembic import op
import sqlalchemy as sa

revision = "c1d2e3f4a5b6"
down_revision = ("b8c9d0e1f2a3", "a8b9c0d1e2f3")
branch_labels = None
depends_on = None


dispute_outcome = sa.Enum("UPHELD", "REJECTED", name="disputeoutcome")


def upgrade():
    dispute_outcome.create(op.get_bind(), checkfirst=True)

    op.add_column("complaints", sa.Column("dispute_reason", sa.Text(), nullable=True))
    op.add_column(
        "complaints", sa.Column("dispute_raised_at", sa.DateTime(), nullable=True)
    )
    op.add_column(
        "complaints",
        sa.Column("dispute_outcome", dispute_outcome, nullable=True),
    )
    op.add_column(
        "complaints", sa.Column("dispute_resolution_note", sa.Text(), nullable=True)
    )
    op.add_column(
        "complaints", sa.Column("dispute_resolved_at", sa.DateTime(), nullable=True)
    )
    op.add_column(
        "complaints",
        sa.Column("dispute_resolved_by", sa.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_complaints_dispute_resolved_by_users",
        "complaints",
        "users",
        ["dispute_resolved_by"],
        ["id"],
    )


def downgrade():
    op.drop_constraint(
        "fk_complaints_dispute_resolved_by_users", "complaints", type_="foreignkey"
    )
    op.drop_column("complaints", "dispute_resolved_by")
    op.drop_column("complaints", "dispute_resolved_at")
    op.drop_column("complaints", "dispute_resolution_note")
    op.drop_column("complaints", "dispute_outcome")
    op.drop_column("complaints", "dispute_raised_at")
    op.drop_column("complaints", "dispute_reason")

    dispute_outcome.drop(op.get_bind(), checkfirst=True)
