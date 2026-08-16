"""add complaint clustering and dispute fields

Revision ID: f7a8b9c0d1e2
Revises: f6a7b8c9d0e1
"""
from alembic import op
import sqlalchemy as sa

revision = "f7a8b9c0d1e2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "complaint_clusters",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("priority", sa.Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="complaintpriority", create_type=False), nullable=False),
        sa.Column("ai_priority_score", sa.Integer(), nullable=False),
        sa.Column("base_priority_score", sa.Integer(), nullable=False),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("locality", sa.Text(), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("complaints") as batch:
        batch.add_column(sa.Column("cluster_id", sa.UUID(), nullable=True))
        batch.add_column(sa.Column("is_cluster_primary", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.add_column(sa.Column("cluster_disputed", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch.create_foreign_key("fk_complaints_cluster_id", "complaint_clusters", ["cluster_id"], ["id"])
        batch.create_index("ix_complaints_cluster_id", ["cluster_id"])


def downgrade():
    with op.batch_alter_table("complaints") as batch:
        batch.drop_index("ix_complaints_cluster_id")
        batch.drop_constraint("fk_complaints_cluster_id", type_="foreignkey")
        batch.drop_column("cluster_disputed")
        batch.drop_column("is_cluster_primary")
        batch.drop_column("cluster_id")
    op.drop_table("complaint_clusters")
