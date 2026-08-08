from flask import Blueprint, jsonify

from app.services.stats_service import StatsService

stats_bp = Blueprint(
    "stats",
    __name__,
    url_prefix="/api/v1/stats",
)


@stats_bp.get("/public")
def public_stats():
    """
    Public, unauthenticated platform statistics for the landing page.
    """

    try:
        data = StatsService.get_public_stats()

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Stats retrieved successfully.",
                    "data": data,
                }
            ),
            200,
        )

    except Exception as err:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Internal server error.",
                    "error": str(err),
                }
            ),
            500,
        )
