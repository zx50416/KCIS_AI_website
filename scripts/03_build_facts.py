#!/usr/bin/env python3
"""Build Layer A tool_facts.jsonl from curated tools + crawl extracts."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from kangchiao_data.process.build_facts import (  # noqa: E402
    facts_from_extract,
    facts_from_tool,
    load_jsonl,
    write_jsonl,
)
from kangchiao_data.scoring import rank_tools  # noqa: E402


def main() -> int:
    tools_path = ROOT / "data" / "curated" / "tools.json"
    catalog = json.loads(tools_path.read_text(encoding="utf-8"))
    tools = catalog["tools"]

    facts = []
    for tool in tools:
        facts.extend(facts_from_tool(tool))

    extracts = load_jsonl(ROOT / "data" / "processed" / "page_extracts.jsonl")
    for ex in extracts:
        facts.extend(facts_from_extract(ex.get("toolIds") or [], ex))

    out = ROOT / "data" / "processed" / "tool_facts.jsonl"
    write_jsonl(out, facts)

    # Smoke-test tag scoring
    demo_need = {
        "role": "teacher",
        "level": "high",
        "task": "research",
        "language": "zh-TW",
        "freeOnly": True,
    }
    ranked = rank_tools(tools, demo_need, top_k=3)
    demo_path = ROOT / "data" / "processed" / "scoring_smoke.json"
    demo_path.write_text(
        json.dumps({"need": demo_need, "top3": ranked}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"facts={len(facts)} -> {out}")
    print(f"scoring smoke -> {demo_path}")
    for row in ranked:
        print(f"  {row['score']:3d} {row['id']} {row['reasons']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
