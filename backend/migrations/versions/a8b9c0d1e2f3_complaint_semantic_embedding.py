"""store semantic embeddings for complaint duplicate detection

Revision ID: a8b9c0d1e2f3
Revises: f7a8b9c0d1e2
"""
from alembic import op
import sqlalchemy as sa

revision = "a8b9c0d1e2f3"
down_revision = "f7a8b9c0d1e2"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("complaints", sa.Column("semantic_embedding", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("complaints", "semantic_embedding")
