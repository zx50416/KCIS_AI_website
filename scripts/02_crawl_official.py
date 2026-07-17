#!/usr/bin/env python3
"""Crawl official landing pages on the allowlist (rate-limited, robots-aware)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from kangchiao_data.crawl.allowlist import iter_seed_urls, load_allowlist  # noqa: E402
from kangchiao_data.crawl.extract import extract_landing_metadata  # noqa: E402
from kangchiao_data.crawl.fetch import OfficialFetcher  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Crawl official tool landing pages")
    parser.add_argument("--limit", type=int, default=0, help="Max jobs (0 = all)")
    parser.add_argument("--delay", type=float, default=None, help="Override delay seconds")
    args = parser.parse_args()

    allowlist_path = ROOT / "data" / "sources" / "allowlist.yaml"
    allowlist = load_allowlist(allowlist_path)
    jobs = iter_seed_urls(allowlist)
    if args.limit and args.limit > 0:
        jobs = jobs[: args.limit]

    delay = args.delay if args.delay is not None else float(allowlist.get("defaultDelaySeconds", 1.5))
    fetcher = OfficialFetcher(
        raw_dir=ROOT / "data" / "raw",
        manifest_path=ROOT / "data" / "sources" / "crawl_manifest.jsonl",
        user_agent=allowlist.get(
            "userAgent",
            "KangChiaoAINavigatorBot/0.1 (+internal-prototype)",
        ),
        delay_seconds=delay,
        timeout_seconds=float(allowlist.get("timeoutSeconds", 20)),
        max_bytes=int(allowlist.get("maxBytesPerPage", 2_000_000)),
    )

    extracts_path = ROOT / "data" / "processed" / "page_extracts.jsonl"
    # Fresh extracts file for this run append; keep historical by not truncating manifest
    ok = 0
    fail = 0
    with extracts_path.open("w", encoding="utf-8") as ef:
        for job in jobs:
            print(f"FETCH {job['url']} ...", flush=True)
            record = fetcher.fetch_one(job)
            if record.get("ok"):
                ok += 1
                raw_name = record.get("rawPath")
                html_path = (ROOT / "data" / "raw" / raw_name) if raw_name else None
                if html_path and html_path.exists():
                    html = html_path.read_text(encoding="utf-8", errors="ignore")
                    extract = extract_landing_metadata(html, record.get("finalUrl") or job["url"])
                    extract["toolIds"] = job.get("toolIds", [])
                    extract["domain"] = job.get("domain")
                    extract["sha256"] = record.get("sha256")
                    extract["robots"] = record.get("robots")
                    ef.write(json.dumps(extract, ensure_ascii=False) + "\n")
                    print(f"  OK title={extract.get('title')!r}", flush=True)
                else:
                    print("  OK but raw html missing", flush=True)
            else:
                fail += 1
                print(f"  FAIL {record.get('error') or record.get('status_code')}", flush=True)

    summary = {"ok": ok, "fail": fail, "jobs": len(jobs), "extracts": str(extracts_path)}
    (ROOT / "data" / "processed" / "crawl_run_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
