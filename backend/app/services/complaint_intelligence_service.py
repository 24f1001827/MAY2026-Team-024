"""Explainable complaint triage and grouping baseline.

Kept provider-free deliberately: deployments work immediately and an LLM adapter can
replace `suggest_department` / `semantic_similarity` without changing workflows.
"""
import math
import re
from collections import Counter

from app.models import ComplaintPriority


class ComplaintIntelligenceService:
    CATEGORY_KEYWORDS = {
        "Roads": ("pothole", "road", "street", "footpath", "traffic", "bridge"),
        "Water Supply": ("water", "pipe", "leak", "sewage", "drain", "flood"),
        "Sanitation": ("garbage", "waste", "trash", "clean", "toilet", "mosquito"),
        "Electricity": ("electric", "power", "wire", "streetlight", "light", "pole"),
        "Public Safety": ("danger", "hazard", "fire", "accident", "unsafe", "collapse"),
    }
    STOP_WORDS = {"the", "a", "an", "is", "at", "in", "on", "of", "and", "to", "for", "with", "near"}

    @classmethod
    def _tokens(cls, text):
        return {word for word in re.findall(r"[a-z0-9]+", (text or "").lower()) if word not in cls.STOP_WORDS}

    @classmethod
    def suggest_department(cls, title, description, departments):
        text = f"{title} {description}".lower()
        scores = {
            department.name: sum(text.count(keyword) for keyword in cls.CATEGORY_KEYWORDS.get(department.name, ()))
            for department in departments
        }
        name, score = max(scores.items(), key=lambda item: item[1], default=(None, 0))
        if not name or score == 0:
            return {"department_id": None, "department_name": None, "confidence": 0, "reason": "No confident department match."}
        return {"department_id": next(d.id for d in departments if d.name == name), "department_name": name, "confidence": min(95, 55 + score * 15), "reason": "Matched issue keywords to the department's service area."}

    @classmethod
    def classify(cls, title, description):
        text = f"{title} {description}".lower()
        category = max(cls.CATEGORY_KEYWORDS, key=lambda key: sum(text.count(word) for word in cls.CATEGORY_KEYWORDS[key]))
        severity_terms = ("death", "fire", "collapse", "electrocution", "gas leak", "flood", "accident")
        high_terms = ("danger", "unsafe", "major", "hospital", "school", "blocked")
        score = 35 + 35 * sum(term in text for term in severity_terms) + 15 * sum(term in text for term in high_terms)
        return category, min(100, score)

    @classmethod
    def similarity(cls, first, second):
        first_words, second_words = cls._tokens(f"{first.title} {first.description}"), cls._tokens(f"{second.title} {second.description}")
        text_score = len(first_words & second_words) / len(first_words | second_words) if first_words | second_words else 0
        if first.latitude is None or second.latitude is None:
            distance_score = 0
        else:
            # Approximate metres; sufficient only as a prefilter / explainable score.
            lat_delta = float(first.latitude) - float(second.latitude)
            lng_delta = float(first.longitude) - float(second.longitude)
            metres = math.sqrt(lat_delta ** 2 + lng_delta ** 2) * 111_000
            distance_score = max(0, 1 - metres / 250)
        category_score = 1 if first.ai_category == second.ai_category else 0
        return round(0.55 * text_score + 0.30 * distance_score + 0.15 * category_score, 3)

    @staticmethod
    def priority_from_score(score):
        if score >= 85:
            return ComplaintPriority.CRITICAL
        if score >= 65:
            return ComplaintPriority.HIGH
        if score >= 40:
            return ComplaintPriority.MEDIUM
        return ComplaintPriority.LOW

    @classmethod
    def cluster_score(cls, base_score, members):
        # One boost per unique reporter; cap prevents priority manipulation.
        reporters = len({member.citizen_id for member in members})
        return min(100, base_score + min(30, max(0, reporters - 1) * 8))
