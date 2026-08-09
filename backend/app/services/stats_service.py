from app.models import (
    Complaint,
    ComplaintStatus,
    Tender,
    TenderStatus,
    Agency,
    User,
    UserStatus,
)


class StatsService:
    """
    Aggregate, non-sensitive platform statistics for the public landing page.
    """

    @staticmethod
    def get_public_stats():
        # Soft-deleted rows are excluded everywhere, so the public counts
        # match what the rest of the app considers live data.
        total = Complaint.query.filter(Complaint.deleted_at.is_(None)).count()

        resolved = Complaint.query.filter(
            Complaint.deleted_at.is_(None),
            Complaint.status.in_(
                [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]
            ),
        ).count()

        resolved_pct = round(resolved / total * 100) if total else 0

        tenders_awarded = Tender.query.filter(
            Tender.deleted_at.is_(None),
            Tender.status == TenderStatus.AWARDED,
        ).count()

        agencies_total = (
            Agency.query.join(User)
            .filter(
                User.status == UserStatus.ACTIVE,
                Agency.deleted_at.is_(None),
            )
            .count()
        )

        return {
            "complaints_total": total,
            "resolved_pct": resolved_pct,
            "tenders_awarded": tenders_awarded,
            "agencies_total": agencies_total,
        }
