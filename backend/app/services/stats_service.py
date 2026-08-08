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
        total = Complaint.query.count()

        resolved = Complaint.query.filter(
            Complaint.status.in_(
                [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED]
            )
        ).count()

        resolved_pct = round(resolved / total * 100) if total else 0

        tenders_awarded = Tender.query.filter_by(
            status=TenderStatus.AWARDED
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
