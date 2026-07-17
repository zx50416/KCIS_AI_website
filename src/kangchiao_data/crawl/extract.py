"""Extract lightweight metadata from official HTML pages."""

from __future__ import annotations

import re
from typing import Any

from bs4 import BeautifulSoup


def _meta(soup: BeautifulSoup, key: str) -> str | None:
    tag = soup.find("meta", attrs={"name": key}) or soup.find("meta", attrs={"property": key})
    if tag and tag.get("content"):
        return str(tag["content"]).strip()
    return None


def _clean(text: str | None, limit: int = 500) -> str | None:
    if not text:
        return None
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return None
    return text[:limit]


def extract_landing_metadata(html: str, url: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "lxml")
    title = _clean(soup.title.string if soup.title else None, 200)
    description = _clean(
        _meta(soup, "description")
        or _meta(soup, "og:description")
        or _meta(soup, "twitter:description"),
        600,
    )
    og_title = _clean(_meta(soup, "og:title"), 200)
    og_site = _clean(_meta(soup, "og:site_name"), 120)
    canonical = None
    link = soup.find("link", rel=lambda v: v and "canonical" in v)
    if link and link.get("href"):
        canonical = str(link["href"]).strip()

    # Very light language hint
    html_tag = soup.find("html")
    lang = html_tag.get("lang") if html_tag and html_tag.get("lang") else None

    return {
        "sourceUrl": url,
        "title": title,
        "ogTitle": og_title,
        "ogSiteName": og_site,
        "description": description,
        "canonical": canonical,
        "htmlLang": lang,
        "extraction": "landing_meta_v1",
        "confidence": "medium" if description or title else "low",
    }
