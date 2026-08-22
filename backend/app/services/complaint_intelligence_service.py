"""Provider-agnostic complaint triage and semantic duplicate detection."""
import math
import json
import os
import logging
from app.models import ComplaintPriority

logger = logging.getLogger(__name__)

class ComplaintIntelligenceService:
    CATEGORY_KEYWORDS = {
        "Roads": ("pothole", "road", "street", "footpath", "traffic", "bridge"),
        "Water Supply": ("water", "pipe", "leak", "sewage", "drain", "flood"),
        "Sanitation": ("garbage", "waste", "trash", "clean", "toilet", "mosquito"),
        "Electricity": ("electric", "power", "wire", "streetlight", "light", "pole"),
        "Public Safety": ("danger", "hazard", "fire", "accident", "unsafe", "collapse"),
    }
    @staticmethod
    def _provider():
        return os.getenv("LLM_PROVIDER", "google").strip().lower()

    @staticmethod
    def _embedding_provider():
        return os.getenv("EMBEDDING_PROVIDER", "google").strip().lower()

    @classmethod
    def _chat_model(cls):
        """Build the configured LangChain chat model without coupling workflows to a provider."""
        provider = cls._provider()
        model = os.getenv("LLM_MODEL")
        if provider == "google":
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(model=model or os.getenv("GEMINI_MODEL", "gemini-2.5-flash"), google_api_key=os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"), temperature=0.1)
        if provider == "openai":
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(model=model or "gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY"), temperature=0.1)
        if provider == "anthropic":
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(model=model or "claude-3-5-haiku-latest", api_key=os.getenv("ANTHROPIC_API_KEY"), temperature=0.1)
        if provider == "ollama":
            from langchain_ollama import ChatOllama
            return ChatOllama(model=model or "llama3.2", temperature=0.1)
        if provider == "groq":
            from langchain_groq import ChatGroq
            return ChatGroq(model=model or "openai/gpt-oss-20b", api_key=os.getenv("GROQ_API_KEY"), temperature=0.1)
        raise ValueError(f"Unsupported LLM_PROVIDER: {provider}")

    @classmethod
    def _embeddings(cls):
        """Build the configured LangChain embeddings model.

        Anthropic has no embeddings API, so deployments using it for chat should
        configure EMBEDDING_PROVIDER separately (for example, openai or ollama).
        """
        provider = cls._embedding_provider()
        model = os.getenv("EMBEDDING_MODEL")
        if provider == "google":
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            return GoogleGenerativeAIEmbeddings(model=model or "models/gemini-embedding-001", google_api_key=os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"))
        if provider == "openai":
            from langchain_openai import OpenAIEmbeddings
            return OpenAIEmbeddings(model=model or "text-embedding-3-small", api_key=os.getenv("OPENAI_API_KEY"))
        if provider == "ollama":
            from langchain_ollama import OllamaEmbeddings
            return OllamaEmbeddings(model=model or "nomic-embed-text")
        raise ValueError(f"Unsupported EMBEDDING_PROVIDER: {provider}")

    @classmethod
    def suggest_department(cls, title, description, departments):
        analysis = cls._llm_analysis(title, description, departments)
        if analysis and analysis.get("department_name"):
            matched = next((d for d in departments if d.name.casefold() == analysis["department_name"].casefold()), None)
            if matched:
                logger.info("[department-suggestion] source=llm provider=%s department=%s", cls._provider(), matched.name)
                return {
                    "department_id": matched.id,
                    "department_name": matched.name,
                    "confidence": analysis["confidence"],
                    "reason": analysis["reason"],
                }
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
        analysis = cls._llm_analysis(title, description, [])
        if analysis:
            return analysis["category"], analysis["priority_score"]
        text = f"{title} {description}".lower()
        category = max(cls.CATEGORY_KEYWORDS, key=lambda key: sum(text.count(word) for word in cls.CATEGORY_KEYWORDS[key]))
        severity_terms = ("death", "fire", "collapse", "electrocution", "gas leak", "flood", "accident")
        high_terms = ("danger", "unsafe", "major", "hospital", "school", "blocked")
        score = 35 + 35 * sum(term in text for term in severity_terms) + 15 * sum(term in text for term in high_terms)
        return category, min(100, score)

    @classmethod
    def _llm_analysis(cls, title, description, departments):
        """Use the configured LangChain chat model; malformed responses fall back safely."""
        if not os.getenv("LLM_PROVIDER") and not os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
            logger.warning("[complaint-triage] LLM skipped: no provider credentials configured")
            return None
        
        department_names = [department.name for department in departments]
        prompt = f"""You triage civic complaints. Return JSON only, with keys category,
priority_score, department_name, confidence, and reason. priority_score is an integer
0-100 based on public safety, service disruption, vulnerable locations, and scale.
department_name must be one of {department_names!r} or null. Never treat reporting
volume as severity. category is a concise issue category, max 100 characters.
confidence must be an integer from 0 to 100.If department_name is not null, confidence must be at least 1.
Use 0 only when department_name is null.
Complaint title: {title!r}
Complaint description: {description!r}"""
        try:
            response = cls._chat_model().invoke(prompt)
            text = response.content if isinstance(response.content, str) else "".join(str(part) for part in response.content)
            if not text:
                return None
            result = json.loads(text)
            if not isinstance(result, dict):
                logger.warning("LLM returned non-object JSON: %s", result)
                return None
            if "category" not in result or "priority_score" not in result:
                logger.warning("LLM response missing required fields: %s", result)
                return None
            score = int(result["priority_score"])
            confidence = int(result.get("confidence", 0))
            category = str(result["category"]).strip()[:100]
            if not category or not 0 <= score <= 100 or not 0 <= confidence <= 100:
                return None
            return {
                "category": category,
                "priority_score": score,
                "department_name": result.get("department_name"),
                "confidence": confidence,
                "reason": str(result.get("reason", "LLM classification."))[:300],
            }
        
        except Exception as exc:
            logger.warning("[complaint-triage] LLM failed; using fallback: %s", exc)
            return None

    @classmethod
    def embedding_text(cls, complaint):
        return f"Title: {complaint.title.strip()}\nDescription: {complaint.description.strip()}"

    @classmethod
    def ensure_embedding(cls, complaint):
        if complaint.semantic_embedding:
            return complaint.semantic_embedding
        try:
            complaint.semantic_embedding = cls._embeddings().embed_query(cls.embedding_text(complaint))
            return complaint.semantic_embedding
        except Exception as exc:  # Network/provider failures must never reject a complaint.
            logger.warning("[duplicate-detection] embedding unavailable; complaint will start a new cluster: %s", exc)
            return None

    @staticmethod
    def cosine_similarity(first_embedding, second_embedding):
        if not first_embedding or not second_embedding or len(first_embedding) != len(second_embedding):
            return None
        denominator = math.sqrt(sum(value * value for value in first_embedding)) * math.sqrt(sum(value * value for value in second_embedding))
        return sum(first * second for first, second in zip(first_embedding, second_embedding)) / denominator if denominator else None

    @staticmethod
    def distance_metres(first, second):
        if None in (first.latitude, first.longitude, second.latitude, second.longitude):
            return None
        lat1, lng1, lat2, lng2 = map(math.radians, (float(first.latitude), float(first.longitude), float(second.latitude), float(second.longitude)))
        dlat, dlng = lat2 - lat1, lng2 - lng1
        value = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
        return 6_371_000 * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))

    @classmethod
    def passes_distance_filter(cls, first, second):
        mode = os.getenv("DUPLICATE_DISTANCE_MODE", "hard_filter").strip().lower()
        if mode in {"disabled", "score"}:
            return True
        if mode != "hard_filter":
            raise ValueError("DUPLICATE_DISTANCE_MODE must be 'hard_filter', 'score', or 'disabled'.")
        distance = cls.distance_metres(first, second)
        return distance is not None and distance <= float(os.getenv("DUPLICATE_MAX_DISTANCE_METERS", "150"))

    @classmethod
    def distance_score(cls, first, second):
        """Optional proximity score for deployments that prefer ranking over a hard radius."""
        distance = cls.distance_metres(first, second)
        radius = float(os.getenv("DUPLICATE_DISTANCE_SCORE_RADIUS_METERS", "250"))
        return max(0, 1 - distance / radius) if distance is not None and radius > 0 else 0

    @classmethod
    def similarity(cls, first, second):
        return cls.cosine_similarity(cls.ensure_embedding(first), cls.ensure_embedding(second))

    @staticmethod
    def duplicate_threshold():
        return float(os.getenv("DUPLICATE_EMBEDDING_THRESHOLD", "0.84"))

    @classmethod
    def duplicate_score(cls, first, second):
        embedding_score = cls.similarity(first, second)
        if embedding_score is None:
            return None
        if os.getenv("DUPLICATE_DISTANCE_MODE", "hard_filter").strip().lower() != "score":
            return embedding_score
        weight = float(os.getenv("DUPLICATE_DISTANCE_WEIGHT", "0.15"))
        weight = min(1, max(0, weight))
        return (1 - weight) * embedding_score + weight * cls.distance_score(first, second)

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
