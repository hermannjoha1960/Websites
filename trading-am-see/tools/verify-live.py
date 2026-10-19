#!/usr/bin/env python3
"""Compare the live pages on trading-am-see.de with the publish payloads.

Usage: python3 tools/verify-live.py [page ...]

Fetches every page, cuts out the page body (first to last line of the
payload, with [[BLOCK:name]] expanded from publish/blocks/), and prints a
unified diff for anything the platform changed: stripped images, disabled
links (ai-removed-link), lost classes, rewritten markup.
"""
import difflib
import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLISH = ROOT / "publish"
ORIGIN = "https://trading-am-see.de"
PAGES = {
    "home": "/",
    "programm": "/programm",
    "location": "/location",
    "veranstalter": "/veranstalter",
    "faq": "/faq",
    "anmeldung": "/anmeldung",
    "risikohinweis": "/risikohinweis",
    "impressum": "/impressum",
    "datenschutz": "/datenschutz",
}


def expected(name):
    html = (PUBLISH / f"{name}.html").read_text(encoding="utf-8")
    return re.sub(
        r"\[\[BLOCK:([a-z0-9-]+)\]\]",
        lambda m: (PUBLISH / "blocks" / f"{m.group(1)}.html").read_text(encoding="utf-8").strip(),
        html,
    ).strip()


def live(url):
    req = urllib.request.Request(ORIGIN + url, headers={"User-Agent": "trading-am-see-verify"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read().decode("utf-8")


def body_slice(page, want):
    lines = [l for l in want.splitlines() if l.strip()]
    start = page.find(lines[0])
    if start < 0:
        return None
    end = page.rfind(lines[-1])
    if end < start:
        return None
    return page[start:end + len(lines[-1])]


def chrome_problems(page):
    """Site-wide parts: custom CSS, footer script, navigation and footer."""
    problems = 0
    css = (PUBLISH / "site.css").read_text(encoding="utf-8")
    styles = [m.group(1) for m in re.finditer(r"<style[^>]*>(.*?)</style>", page, flags=re.S)]
    live_css = next((s for s in styles if ".t-hero__slide" in s), None)
    squash = lambda s: re.sub(r"\s*\n\s*", "", s).strip()
    if live_css is None or squash(live_css) != squash(css):
        print("✗ custom CSS differs from publish/site.css")
        problems += 1
    else:
        print("✓ custom CSS")
    for part in ("footer-scripts.html", "nav.html", "footer.html"):
        if (PUBLISH / part).read_text(encoding="utf-8").strip() in page:
            print(f"✓ {part}")
        else:
            print(f"✗ {part} differs")
            problems += 1
    return problems


def main(names):
    problems = 0 if names else chrome_problems(live("/faq"))
    for name in names or PAGES:
        want = expected(name)
        page = live(PAGES[name])
        got = body_slice(page, want)
        flags = []
        if "ai-removed-link" in page:
            flags.append("disabled links")
        if "[[BLOCK:" in page:
            flags.append("unexpanded block")
        if got is None:
            print(f"✗ {name}: page body not found")
            problems += 1
            continue
        if got == want and not flags:
            print(f"✓ {name}")
            continue
        problems += 1
        print(f"✗ {name} {' · '.join(flags)}")
        diff = difflib.unified_diff(want.splitlines(), got.splitlines(), "payload", "live", n=1, lineterm="")
        for line in list(diff)[:80]:
            print("   " + line[:220])
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
