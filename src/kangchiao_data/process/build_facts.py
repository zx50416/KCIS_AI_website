"""Build Layer A tool fact records from seed catalog + crawl extracts."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any


def _fact(
    tool_id: str,
    field: str,
    value_zh: str | None,
    value_en: str | None,
    *,
    source_type: str,
    source_url: str | None,
    confidence: str,
    license_note: str = "reference_only",
) -> dict[str, Any]:
    return {
        "toolId": tool_id,
        "field": field,
        "value_zh": value_zh,
        "value_en": value_en,
        "sourceType": source_type,
        "sourceUrl": source_url,
        "retrievedAt": date.today().isoformat(),
        "confidence": confidence,
        "licenseNote": license_note,
    }


def facts_from_tool(tool: dict[str, Any]) -> list[dict[str, Any]]:
    """Deterministic facts from curated seed (high confidence for tags only)."""
    tid = tool["id"]
    desc = tool.get("shortDescription") or {}
    out = [
        _fact(
            tid,
            "short_description",
            desc.get("zh-TW"),
            desc.get("en"),
            source_type="curated_seed",
            source_url=tool.get("officialUrl"),
            confidence="medium",
        ),
        _fact(
            tid,
            "categories",
            ", ".join(tool.get("categories") or []),
            ", ".join(tool.get("categories") or []),
            source_type="curated_seed",
            source_url=None,
            confidence="high",
        ),
        _fact(
            tid,
            "tasks",
            ", ".join(tool.get("tasks") or []),
            ", ".join(tool.get("tasks") or []),
            source_type="curated_seed",
            source_url=None,
            confidence="high",
        ),
        _fact(
            tid,
            "free_status",
            tool.get("freeStatus"),
            tool.get("freeStatus"),
            source_type="curated_seed",
            source_url=tool.get("officialUrl"),
            confidence="low" if tool.get("freeStatus") == "unknown" else "medium",
        ),
        _fact(
            tid,
            "difficulty_stars",
            str(tool.get("difficultyStars")),
            str(tool.get("difficultyStars")),
            source_type="curated_subjective",
            source_url=None,
            confidence="medium",
        ),
    ]
    if tool.get("officialUrl"):
        out.append(
            _fact(
                tid,
                "official_url",
                tool["officialUrl"],
                tool["officialUrl"],
                source_type="curated_seed",
                source_url=tool["officialUrl"],
                confidence="medium",
            )
        )
    return out


def facts_from_extract(tool_ids: list[str], extract: dict[str, Any]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    desc = extract.get("description")
    title = extract.get("ogTitle") or extract.get("title")
    url = extract.get("sourceUrl")
    for tid in tool_ids:
        if title:
            out.append(
                _fact(
                    tid,
                    "official_page_title",
                    title,
                    title,
                    source_type="official_docs",
                    source_url=url,
                    confidence=extract.get("confidence", "medium"),
                )
            )
        if desc:
            out.append(
                _fact(
                    tid,
                    "official_meta_description",
                    desc,
                    desc,
                    source_type="official_docs",
                    source_url=url,
                    confidence=extract.get("confidence", "medium"),
                )
            )
    return out


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows
