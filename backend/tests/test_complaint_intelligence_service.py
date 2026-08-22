from types import SimpleNamespace

from app.models import ComplaintPriority
from app.services.complaint_intelligence_service import ComplaintIntelligenceService


def complaint(title, description, latitude=9.9312, longitude=76.2673, category="Roads", citizen_id="citizen-1"):
    return SimpleNamespace(
        title=title,
        description=description,
        latitude=latitude,
        longitude=longitude,
        ai_category=category,
        citizen_id=citizen_id,
        semantic_embedding=None,
    )


def test_department_suggestion_is_non_binding_and_matches_keywords():
    departments = [SimpleNamespace(id=1, name="Roads"), SimpleNamespace(id=2, name="Water Supply")]

    suggestion = ComplaintIntelligenceService.suggest_department(
        "Large pothole", "A dangerous pothole has opened on the road.", departments
    )

    assert suggestion["department_id"] == 1
    assert suggestion["confidence"] > 0


def test_similar_reports_score_higher_than_distant_different_reports():
    original = complaint("Pothole near bus stop", "Large pothole causing accidents")
    similar = complaint("Dangerous pothole at bus stop", "Road pothole causing accidents", 9.9313, 76.2674)
    unrelated = complaint("Water pipe leak", "Water is leaking", 9.9500, 76.2900, "Water Supply")

    original.semantic_embedding = [1.0, 0.0, 0.0]
    similar.semantic_embedding = [0.95, 0.05, 0.0]
    unrelated.semantic_embedding = [0.0, 1.0, 0.0]

    assert ComplaintIntelligenceService.similarity(original, similar) >= 0.84
    assert ComplaintIntelligenceService.similarity(original, unrelated) == 0


def test_distance_filter_uses_hard_configured_radius(monkeypatch):
    original = complaint("Pothole", "Large pothole", 9.9312, 76.2673)
    nearby = complaint("Pothole", "Large pothole", 9.9320, 76.2673)
    far = complaint("Pothole", "Large pothole", 9.9340, 76.2673)
    monkeypatch.setenv("DUPLICATE_MAX_DISTANCE_METERS", "100")

    assert ComplaintIntelligenceService.passes_distance_filter(original, nearby)
    assert not ComplaintIntelligenceService.passes_distance_filter(original, far)


def test_cluster_priority_boost_counts_unique_reporters_only():
    reports = [
        complaint("Pothole", "Road damaged", citizen_id="one"),
        complaint("Pothole", "Road damaged", citizen_id="two"),
        complaint("Pothole", "Road damaged", citizen_id="two"),
    ]

    assert ComplaintIntelligenceService.cluster_score(60, reports) == 68
    assert ComplaintIntelligenceService.priority_from_score(68) == ComplaintPriority.HIGH
