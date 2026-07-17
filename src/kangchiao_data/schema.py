"""Shared schema helpers for Kang Chiao AI Navigator data layer."""

from __future__ import annotations

from typing import Any, Literal, TypedDict


Role = Literal["teacher", "student"]
Level = Literal["elementary", "middle", "high", "university"]
FreeStatus = Literal["free", "freemium", "paid", "unknown"]
ToolStatus = Literal["active", "unknown", "deprecated", "needs_review"]
PageStatus = Literal["placeholder", "draft", "complete"]
Confidence = Literal["high", "medium", "low", "unknown"]


class LocalizedText(TypedDict):
    zh_TW: str
    en: str


# JSON keys use zh-TW with hyphen for frontend compatibility.
def loc(zh: str, en: str) -> dict[str, str]:
    return {"zh-TW": zh, "en": en}


DIFFICULTY_STAR_TO_LABEL = {
    1: "easy",
    2: "easy",
    3: "medium",
    4: "advanced",
    5: "advanced",
}


def difficulty_label(stars: int) -> str:
    return DIFFICULTY_STAR_TO_LABEL.get(int(stars), "unknown")


def validate_tool_minimal(tool: dict[str, Any]) -> list[str]:
    """Return list of missing/invalid field messages."""
    required = [
        "id",
        "slug",
        "name",
        "categories",
        "tasks",
        "roles",
        "levels",
        "languages",
        "freeStatus",
        "difficultyStars",
        "shortDescription",
        "status",
        "pageStatus",
    ]
    errors: list[str] = []
    for key in required:
        if key not in tool or tool[key] in (None, "", []):
            errors.append(f"missing:{key}")
    stars = tool.get("difficultyStars")
    if stars is not None and stars not in (1, 2, 3, 4, 5):
        errors.append("invalid:difficultyStars")
    return errors
