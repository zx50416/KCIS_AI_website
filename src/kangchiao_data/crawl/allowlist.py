"""Crawl allowlist and source policies."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml


DEFAULT_ALLOWLIST = {
    "version": "0.1.0",
    "userAgent": "KangChiaoAINavigatorBot/0.1 (+internal-prototype; research; contact: local-dev)",
    "defaultDelaySeconds": 1.5,
    "timeoutSeconds": 20,
    "maxBytesPerPage": 2_000_000,
    "domains": [
        {
            "domain": "gemini.google.com",
            "toolIds": ["gemini"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "chatgpt.com",
            "toolIds": ["chatgpt"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "www.magicschool.ai",
            "toolIds": ["magicschool"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "www.edcafe.ai",
            "toolIds": ["edcafe"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "math-gpt.org",
            "toolIds": ["mathgpt"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "www.vidnoz.com",
            "toolIds": ["vidnoz"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "openai.com",
            "toolIds": ["sora"],
            "paths": ["/sora"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "openai.com",
            "toolIds": ["codex"],
            "paths": ["/codex/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "www.canva.com",
            "toolIds": ["canva"],
            "paths": ["/", "/education/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "soundraw.io",
            "toolIds": ["soundraw"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "ecrettmusic.com",
            "toolIds": ["ecrettmusic"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "notebooklm.google.com",
            "toolIds": ["notebooklm"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "padlet.com",
            "toolIds": ["padlet"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "curipod.com",
            "toolIds": ["curipod"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "www.classpoint.io",
            "toolIds": ["classpoint"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "seesaw.me",
            "toolIds": ["seesaw"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "sites.google.com",
            "toolIds": ["google_sites"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "www.apple.com",
            "toolIds": ["freeform"],
            "paths": ["/freeform/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "stellarium.org",
            "toolIds": ["stellarium"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "www.brainingcamp.com",
            "toolIds": ["brainingcamp"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "www.hyread.com.tw",
            "toolIds": ["hyread"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "cursor.com",
            "toolIds": ["cursor"],
            "paths": ["/"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
        {
            "domain": "www.anthropic.com",
            "toolIds": ["claude_code"],
            "paths": ["/claude-code"],
            "robotsRequired": True,
            "purpose": "official_landing",
            "licenseNote": "reference_only",
        },
    ],
    "excludedSources": [
        {
            "name": "reddit",
            "reason": "Data API Terms restrict ML/AI training on user content without approval",
        },
        {
            "name": "private_forums",
            "reason": "login walls / personal data risk",
        },
    ],
}


DEFAULT_POLICIES = {
    "version": "0.1.0",
    "rules": [
        "Respect robots.txt when robotsRequired is true; if robots fetch fails, skip domain.",
        "No login, no CAPTCHA bypass, no multi-account.",
        "Store raw HTML only under data/raw/ (gitignored).",
        "Processed outputs keep summaries + metadata, not full page dumps in curated/.",
        "Do not invent officialUrl or pricing; mark unknown.",
        "PII must not be collected.",
        "Rate limit with defaultDelaySeconds between requests.",
    ],
}


def write_default_sources(sources_dir: Path) -> None:
    sources_dir.mkdir(parents=True, exist_ok=True)
    allowlist_path = sources_dir / "allowlist.yaml"
    policies_path = sources_dir / "source_policies.yaml"
    if not allowlist_path.exists():
        allowlist_path.write_text(
            yaml.safe_dump(DEFAULT_ALLOWLIST, allow_unicode=True, sort_keys=False),
            encoding="utf-8",
        )
    if not policies_path.exists():
        policies_path.write_text(
            yaml.safe_dump(DEFAULT_POLICIES, allow_unicode=True, sort_keys=False),
            encoding="utf-8",
        )


def load_allowlist(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def iter_seed_urls(allowlist: dict[str, Any]) -> list[dict[str, Any]]:
    """Expand domain+paths into concrete URL jobs."""
    jobs: list[dict[str, Any]] = []
    for entry in allowlist.get("domains", []):
        domain = entry["domain"]
        for path in entry.get("paths", ["/"]):
            if not path.startswith("/"):
                path = "/" + path
            url = f"https://{domain}{path}"
            jobs.append(
                {
                    "url": url,
                    "domain": domain,
                    "toolIds": entry.get("toolIds", []),
                    "purpose": entry.get("purpose", "official_landing"),
                    "robotsRequired": entry.get("robotsRequired", True),
                    "licenseNote": entry.get("licenseNote", "reference_only"),
                }
            )
    return jobs
