"""HTTP fetch with robots.txt checks, rate limiting, and raw cache."""

from __future__ import annotations

import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _url_hash(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]


class RobotsCache:
    def __init__(self, user_agent: str, timeout: float = 15.0):
        self.user_agent = user_agent
        self.timeout = timeout
        self._cache: dict[str, tuple[str, RobotFileParser | None]] = {}

    def allowed(self, url: str) -> tuple[bool, str]:
        """Respect robots when available.

        Policy for Internal Prototype:
        - 2xx robots.txt → parse and obey
        - 404 → treat as allow (no robots file)
        - other failures → allow with robots_unchecked (still no login/CAPTCHA bypass)
        """
        parsed = urlparse(url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        if base not in self._cache:
            robots_url = f"{base}/robots.txt"
            rp = RobotFileParser()
            try:
                with httpx.Client(timeout=self.timeout, follow_redirects=True) as client:
                    resp = client.get(robots_url, headers={"User-Agent": self.user_agent})
                    if resp.status_code == 404:
                        self._cache[base] = ("allow_all", None)
                    elif resp.status_code >= 400:
                        self._cache[base] = ("unchecked", None)
                    else:
                        rp.parse(resp.text.splitlines())
                        self._cache[base] = ("parsed", rp)
            except Exception as exc:  # noqa: BLE001
                self._cache[base] = ("unchecked", None)
                return True, f"robots_unchecked:{exc.__class__.__name__}"

        state, rp = self._cache[base]
        if state == "allow_all":
            return True, "robots_missing_404_allow"
        if state == "unchecked":
            return True, "robots_unchecked"
        assert rp is not None
        try:
            ok = rp.can_fetch(self.user_agent, url)
            return ok, "allowed" if ok else "disallowed_by_robots"
        except Exception as exc:  # noqa: BLE001
            return True, f"robots_parse_error_allow:{exc.__class__.__name__}"


class OfficialFetcher:
    def __init__(
        self,
        *,
        raw_dir: Path,
        manifest_path: Path,
        user_agent: str,
        delay_seconds: float = 1.5,
        timeout_seconds: float = 20.0,
        max_bytes: int = 2_000_000,
    ):
        self.raw_dir = raw_dir
        self.manifest_path = manifest_path
        self.user_agent = user_agent
        self.delay_seconds = delay_seconds
        self.timeout_seconds = timeout_seconds
        self.max_bytes = max_bytes
        self.robots = RobotsCache(user_agent, timeout=timeout_seconds)
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.manifest_path.parent.mkdir(parents=True, exist_ok=True)
        self._last_request_at = 0.0

    def _throttle(self) -> None:
        elapsed = time.monotonic() - self._last_request_at
        if elapsed < self.delay_seconds:
            time.sleep(self.delay_seconds - elapsed)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8), reraise=True)
    def _get(self, client: httpx.Client, url: str) -> httpx.Response:
        return client.get(url, headers={"User-Agent": self.user_agent})

    def fetch_one(self, job: dict[str, Any]) -> dict[str, Any]:
        url = job["url"]
        record: dict[str, Any] = {
            "url": url,
            "domain": job.get("domain"),
            "toolIds": job.get("toolIds", []),
            "purpose": job.get("purpose"),
            "licenseNote": job.get("licenseNote"),
            "retrievedAt": _utc_now(),
            "ok": False,
        }

        if job.get("robotsRequired", True):
            allowed, reason = self.robots.allowed(url)
            record["robots"] = reason
            if not allowed:
                record["error"] = reason
                self._append_manifest(record)
                return record

        self._throttle()
        try:
            with httpx.Client(timeout=self.timeout_seconds, follow_redirects=True) as client:
                resp = self._get(client, url)
            self._last_request_at = time.monotonic()
            content = resp.content[: self.max_bytes]
            digest = hashlib.sha256(content).hexdigest()
            out_name = f"{job.get('domain','x').replace('.','_')}__{_url_hash(url)}.html"
            out_path = self.raw_dir / out_name
            meta_path = self.raw_dir / f"{out_name}.meta.json"

            # Only store text/html-ish bodies
            ctype = resp.headers.get("content-type", "")
            if resp.status_code == 200 and "html" in ctype.lower():
                out_path.write_bytes(content)
                meta = {
                    "url": str(resp.url),
                    "status_code": resp.status_code,
                    "content_type": ctype,
                    "sha256": digest,
                    "bytes": len(content),
                    "toolIds": job.get("toolIds", []),
                    "retrievedAt": record["retrievedAt"],
                }
                meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
                record.update(
                    {
                        "ok": True,
                        "status_code": resp.status_code,
                        "finalUrl": str(resp.url),
                        "contentType": ctype,
                        "sha256": digest,
                        "rawPath": out_name,
                        "bytes": len(content),
                    }
                )
            else:
                record.update(
                    {
                        "ok": False,
                        "status_code": resp.status_code,
                        "contentType": ctype,
                        "error": "non_html_or_bad_status",
                        "finalUrl": str(resp.url),
                    }
                )
        except Exception as exc:  # noqa: BLE001
            self._last_request_at = time.monotonic()
            record["error"] = f"{exc.__class__.__name__}: {exc}"

        self._append_manifest(record)
        return record

    def _append_manifest(self, record: dict[str, Any]) -> None:
        with self.manifest_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
