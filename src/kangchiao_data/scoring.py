"""Tag scoring baseline for tool recommendation (no LLM required)."""

from __future__ import annotations

from typing import Any


DEFAULT_WEIGHTS = {
    "task": 5,
    "role": 3,
    "level": 2,
    "language": 1,
    "free": 3,
    "specialized": 2,
}


def score_tool(tool: dict[str, Any], need: dict[str, Any], weights: dict[str, int] | None = None) -> tuple[int, list[str]]:
    """Return (score, reason_codes). Hard exclusions return score -10_000."""
    w = weights or DEFAULT_WEIGHTS
    reasons: list[str] = []
    score = 0

    status = tool.get("status")
    if status == "deprecated":
        return -10_000, ["excluded:deprecated"]

    if need.get("freeOnly"):
        free = tool.get("freeStatus")
        if free == "paid":
            return -10_000, ["excluded:not_free"]
        if free in ("free", "freemium"):
            score += w["free"]
            reasons.append("free_ok")
        elif free == "unknown":
            reasons.append("free_unknown")

    task = need.get("task")
    if task and task in (tool.get("tasks") or []):
        score += w["task"]
        reasons.append("task_match")

    role = need.get("role")
    if role and role in (tool.get("roles") or []):
        score += w["role"]
        reasons.append("role_match")

    level = need.get("level")
    if level and level in (tool.get("levels") or []):
        score += w["level"]
        reasons.append("level_match")

    lang = need.get("language")
    if lang and lang in (tool.get("languages") or []):
        score += w["language"]
        reasons.append("language_match")

    # Light boost for specialized categories when task is simulation/music/video/coding
    specialized_tasks = {"simulation", "music", "video", "coding", "reading"}
    if task in specialized_tasks and "subject_specialized" in (tool.get("categories") or []):
        score += w["specialized"]
        reasons.append("specialized_boost")
    if task == "music" and "media_music" in (tool.get("categories") or []):
        score += w["specialized"]
        reasons.append("media_boost")
    if task in {"coding"} and "devtools" in (tool.get("categories") or []):
        score += w["specialized"]
        reasons.append("devtools_boost")
    if task in {"research", "summary"} and "reading_research" in (tool.get("categories") or []):
        score += w["specialized"]
        reasons.append("research_boost")

    return score, reasons


def rank_tools(
    tools: list[dict[str, Any]],
    need: dict[str, Any],
    top_k: int = 3,
) -> list[dict[str, Any]]:
    ranked: list[dict[str, Any]] = []
    for tool in tools:
        score, reasons = score_tool(tool, need)
        if score <= -10_000:
            continue
        ranked.append(
            {
                "id": tool["id"],
                "name": tool["name"],
                "score": score,
                "reasons": reasons,
                "difficultyStars": tool.get("difficultyStars"),
                "freeStatus": tool.get("freeStatus"),
                "officialUrl": tool.get("officialUrl"),
            }
        )
    ranked.sort(key=lambda x: (-x["score"], x["name"]))
    return ranked[:top_k]


def shortlist(
    tools: list[dict[str, Any]],
    need: dict[str, Any],
    k: int = 8,
) -> list[dict[str, Any]]:
    """First-stage shortlist for future LLM re-ranking."""
    return rank_tools(tools, need, top_k=k)
