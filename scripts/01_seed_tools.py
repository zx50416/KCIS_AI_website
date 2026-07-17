#!/usr/bin/env python3
"""Seed curated tools.json and source allowlist files."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from kangchiao_data.crawl.allowlist import write_default_sources  # noqa: E402
from kangchiao_data.schema import validate_tool_minimal  # noqa: E402
from kangchiao_data.seed_tools import build_catalog  # noqa: E402


def main() -> int:
    catalog = build_catalog()
    errors = []
    for tool in catalog["tools"]:
        errs = validate_tool_minimal(tool)
        if errs:
            errors.append({"id": tool.get("id"), "errors": errs})

    out = ROOT / "data" / "curated" / "tools.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")

    labels = {
        "tasks": sorted({t for tool in catalog["tools"] for t in tool["tasks"]}),
        "categories": sorted({c for tool in catalog["tools"] for c in tool["categories"]}),
        "roles": ["teacher", "student"],
        "levels": ["elementary", "middle", "high", "university"],
        "difficultyStars": [1, 2, 3, 4, 5],
    }
    (ROOT / "data" / "curated" / "labels.json").write_text(
        json.dumps(labels, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    write_default_sources(ROOT / "data" / "sources")

    print(f"Wrote {out} ({catalog['count']} tools)")
    print(f"Validation errors: {len(errors)}")
    for e in errors:
        print(" ", e)
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
