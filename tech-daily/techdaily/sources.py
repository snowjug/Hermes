"""Collect candidate topics from official APIs and public feeds. No HTML scraping.

Every source is optional: a feed that fails is logged and skipped, so one outage never stops the day.
"""

from __future__ import annotations

import html
import logging
import re
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Callable

import feedparser
import httpx

log = logging.getLogger(__name__)

USER_AGENT = "tech-daily/0.1 (personal research digest; contact via YouTube channel)"


@dataclass
class Candidate:
    title: str
    url: str
    source: str
    score: float = 0.0          # source-native popularity (points, stars, rank-derived)
    summary: str = ""
    published: str | None = None
    extra: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return asdict(self)


def _client() -> httpx.Client:
    return httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=20, follow_redirects=True)


def _clean(text: str, limit: int = 400) -> str:
    text = re.sub(r"<[^>]+>", " ", html.unescape(text or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text[:limit]


def hacker_news_show(client: httpx.Client, min_points: int) -> list[Candidate]:
    """Show HN posts from the last 48 h via the official Algolia HN Search API."""
    since = int(time.time() - 48 * 3600)
    r = client.get("https://hn.algolia.com/api/v1/search",
                   params={"tags": "show_hn", "numericFilters": f"created_at_i>{since},points>{min_points}",
                           "hitsPerPage": 40})
    r.raise_for_status()
    out = []
    for h in r.json()["hits"]:
        url = h.get("url") or f"https://news.ycombinator.com/item?id={h['objectID']}"
        out.append(Candidate(
            title=h["title"], url=url, source="Hacker News (Show HN)", score=float(h.get("points") or 0),
            summary=_clean(h.get("story_text") or ""), published=h.get("created_at"),
            extra={"hn_id": h["objectID"], "comments": h.get("num_comments", 0)},
        ))
    return out


def hacker_news_front(client: httpx.Client) -> list[Candidate]:
    """Current front-page stories (official HN Algolia API), for broader tech trends."""
    r = client.get("https://hn.algolia.com/api/v1/search", params={"tags": "front_page", "hitsPerPage": 30})
    r.raise_for_status()
    return [Candidate(title=h["title"], url=h.get("url") or f"https://news.ycombinator.com/item?id={h['objectID']}",
                      source="Hacker News (front page)", score=float(h.get("points") or 0),
                      published=h.get("created_at"), extra={"hn_id": h["objectID"]})
            for h in r.json()["hits"]]


def github_rising(client: httpx.Client, min_stars: int) -> list[Candidate]:
    """Repos created in the last 10 days with the most stars (official GitHub search API)."""
    since = (datetime.now(timezone.utc) - timedelta(days=10)).strftime("%Y-%m-%d")
    r = client.get("https://api.github.com/search/repositories",
                   params={"q": f"created:>{since} stars:>{min_stars}", "sort": "stars", "order": "desc",
                           "per_page": 30},
                   headers={"Accept": "application/vnd.github+json"})
    r.raise_for_status()
    return [Candidate(title=f"{it['full_name']}: {it.get('description') or ''}".strip(": "),
                      url=it["html_url"], source="GitHub (new and rising)", score=float(it["stargazers_count"]),
                      summary=_clean(it.get("description") or ""), published=it.get("created_at"),
                      extra={"homepage": it.get("homepage"), "language": it.get("language"),
                             "topics": it.get("topics", [])[:8]})
            for it in r.json().get("items", [])]


def rss(client: httpx.Client, name: str, url: str, limit: int = 25) -> list[Candidate]:
    r = client.get(url)
    r.raise_for_status()
    feed = feedparser.parse(r.content)
    out = []
    for rank, e in enumerate(feed.entries[:limit]):
        traffic = e.get("ht_approx_traffic")  # Google Trends
        out.append(Candidate(
            title=_clean(e.get("title", ""), 200), url=e.get("link", ""), source=name,
            score=float(limit - rank), summary=_clean(e.get("summary", "")),
            published=e.get("published") or e.get("updated"),
            extra={"traffic": traffic} if traffic else {},
        ))
    return out


def youtube_channel(client: httpx.Client, name: str, channel_id: str) -> list[Candidate]:
    r = client.get("https://www.youtube.com/feeds/videos.xml", params={"channel_id": channel_id})
    r.raise_for_status()
    feed = feedparser.parse(r.content)
    cutoff = datetime.now(timezone.utc) - timedelta(days=4)
    out = []
    for e in feed.entries[:8]:
        published = datetime(*e.published_parsed[:6], tzinfo=timezone.utc) if e.get("published_parsed") else None
        if published and published < cutoff:
            continue
        out.append(Candidate(title=_clean(e.get("title", ""), 200), url=e.get("link", ""),
                             source=f"YouTube: {name}", score=1.0, published=e.get("published"),
                             extra={"views": (e.get("media_statistics") or {}).get("views")}))
    return out


def collect(cfg: dict) -> tuple[list[Candidate], dict[str, str]]:
    """Return (deduplicated candidates, per-source status)."""
    jobs: list[tuple[str, Callable[[httpx.Client], list[Candidate]]]] = [
        ("Hacker News (Show HN)", lambda c: hacker_news_show(c, int(cfg.get("hn_show_min_points", 40)))),
        ("Hacker News (front page)", hacker_news_front),
        ("GitHub (new and rising)", lambda c: github_rising(c, int(cfg.get("github_min_stars", 150)))),
    ]
    for feed in cfg.get("rss", []):
        jobs.append((feed["name"], lambda c, f=feed: rss(c, f["name"], f["url"])))
    for ch in cfg.get("youtube_channels", []):
        jobs.append((f"YouTube: {ch['name']}", lambda c, ch=ch: youtube_channel(c, ch["name"], ch["id"])))

    status: dict[str, str] = {}
    found: list[Candidate] = []
    with _client() as client:
        for name, fn in jobs:
            try:
                items = fn(client)
                status[name] = f"ok ({len(items)})"
                found.extend(items)
            except Exception as exc:  # noqa: BLE001 - one broken feed must not stop the run
                status[name] = f"failed: {str(exc)[:120]}"
                log.warning("source %s failed: %s", name, exc)

    seen: set[str] = set()
    unique = []
    for c in found:
        key = re.sub(r"[^a-z0-9]", "", (c.url or c.title).lower().split("?")[0])[:120]
        if not c.title or key in seen:
            continue
        seen.add(key)
        unique.append(c)
    return unique, status
