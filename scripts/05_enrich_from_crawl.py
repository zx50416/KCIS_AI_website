#!/usr/bin/env python3
"""Enrich curated tools with crawl extracts (titles/descriptions) without inventing facts."""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from kangchiao_data.process.build_facts import load_jsonl  # noqa: E402


def main() -> int:
    tools_path = ROOT / "data" / "curated" / "tools.json"
    catalog = json.loads(tools_path.read_text(encoding="utf-8"))
    extracts = load_jsonl(ROOT / "data" / "processed" / "page_extracts.jsonl")

    by_tool: dict[str, list[dict]] = {}
    for ex in extracts:
        for tid in ex.get("toolIds") or []:
            by_tool.setdefault(tid, []).append(ex)

    today = date.today().isoformat()
    updated = 0
    for tool in catalog["tools"]:
        tid = tool["id"]
        rows = by_tool.get(tid) or []
        # Prefer extracts that have a real description and not sign-in walls
        best = None
        for ex in rows:
            title = (ex.get("title") or "").lower()
            if "sign in" in title or "unsupported client" in title:
                continue
            if ex.get("description") or ex.get("title"):
                best = ex
                if ex.get("description"):
                    break
        if not best:
            continue
        tool.setdefault("crawlEnrichment", {})
        tool["crawlEnrichment"] = {
            "pageTitle": best.get("title"),
            "metaDescription": best.get("description"),
            "sourceUrl": best.get("sourceUrl"),
            "retrievedAt": today,
            "confidence": best.get("confidence", "medium"),
        }
        # If Canva education page confirms free for K-12, keep freemium but note
        if tid == "canva" and best.get("description") and "100% free" in (best.get("description") or ""):
            tool["educationUrl"] = "https://www.canva.com/education/"
            tool.setdefault("strengths", [])
            # Avoid duplicating if re-run
            strength = {
                "zh-TW": "Canva Education 官方描述提及 K–12 教師與學生免費方案（以官方頁為準）。",
                "en": "Canva Education page states a free offer for K–12 teachers and students (verify on official page).",
            }
            if strength not in tool["strengths"]:
                tool["strengths"].append(strength)
        if tid == "sora" and best.get("title") and "discontinuation" in (best.get("title") or "").lower():
            tool["status"] = "deprecated"
        tool["lastVerifiedAt"] = today
        updated += 1

    catalog["generatedAt"] = today
    tools_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"enriched {updated} tools -> {tools_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
