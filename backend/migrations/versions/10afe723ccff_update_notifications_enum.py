"""update notifications enum

Revision ID: 10afe723ccff
Revises: b911cbaf92a5
Create Date: 2026-07-30 16:02:00.990276

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '10afe723ccff'
down_revision = 'b911cbaf92a5'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE notificationtype RENAME TO notificationtype_old")
    op.execute("""
        CREATE TYPE notificationtype AS ENUM (
            'COMPLAINT_CREATED','COMPLAINT_ASSIGNED','ASSIGNMENT_ACCEPTED',
            'ASSIGNMENT_REJECTED','REVIEW_COMPLETED','BUDGET_REQUESTED',
            'BUDGET_ALLOCATED','STATUS_CHANGE','TENDER_PUBLISHED',
            'TENDER_ALLOTED','WORK_ORDER_CREATED','WORK_ORDER_UPDATED',
            'SLA_BREACH','COMPLAINT_RESOLVED','COMPLAINT_CLOSURE'
        )
    """)
    op.execute("""
        ALTER TABLE notifications
        ALTER COLUMN type TYPE notificationtype
        USING (
            CASE type::text
                WHEN 'ASSIGNMENT' THEN 'COMPLAINT_ASSIGNED'
                WHEN 'REVIEW_DONE' THEN 'REVIEW_COMPLETED'
                WHEN 'BUDGET_PENDING' THEN 'BUDGET_REQUESTED'
                WHEN 'CLOSURE' THEN 'COMPLAINT_CLOSURE'
                ELSE type::text
            END
        )::notificationtype
    """)
    op.execute("DROP TYPE notificationtype_old")


def downgrade():
    op.execute("ALTER TYPE notificationtype RENAME TO notificationtype_new")
    op.execute("""
        CREATE TYPE notificationtype AS ENUM (
            'STATUS_CHANGE','ASSIGNMENT','REVIEW_DONE','TENDER_PUBLISHED',
            'SLA_BREACH','BUDGET_PENDING','CLOSURE'
        )
    """)
    op.execute("""
        ALTER TABLE notifications
        ALTER COLUMN type TYPE notificationtype
        USING (
            CASE type::text
                WHEN 'COMPLAINT_ASSIGNED' THEN 'ASSIGNMENT'
                WHEN 'ASSIGNMENT_ACCEPTED' THEN 'ASSIGNMENT'
                WHEN 'ASSIGNMENT_REJECTED' THEN 'ASSIGNMENT'
                WHEN 'REVIEW_COMPLETED' THEN 'REVIEW_DONE'
                WHEN 'BUDGET_REQUESTED' THEN 'BUDGET_PENDING'
                WHEN 'BUDGET_ALLOCATED' THEN 'BUDGET_PENDING'
                WHEN 'COMPLAINT_CLOSURE' THEN 'CLOSURE'
                ELSE type::text
            END
        )::notificationtype
    """)
    op.execute("DROP TYPE notificationtype_new")
