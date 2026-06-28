"""
Visual regression tests for the Terra Belle chapter rail.

Compares element screenshots against committed baselines to catch layout
shifts in the desktop gear rail, the mobile floating pill, the open
chapter sheet, and key focus / active states.

Workflow:
  1. First run (or when --update is passed) writes baselines to
     tests/visual/baselines/.
  2. Subsequent runs render each scene, take an element screenshot,
     resize to the baseline dimensions if needed, and compute the
     mean per-pixel RGB difference. A scene fails when the diff ratio
     exceeds the tolerance below (0.5%).
  3. Failures write the actual capture + a pixel diff image to
     tests/visual/diffs/ so the regression is reviewable.

Run with: python tests/visual/rail.py            # compare
          python tests/visual/rail.py --update   # refresh baselines

The dev server must be running on http://localhost:8080.
"""
import asyncio, json, sys
from pathlib import Path
from PIL import Image, ImageChops
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
BASELINES = HERE / "baselines"
DIFFS = HERE / "diffs"
ACTUAL = HERE / "actual"
for p in (BASELINES, DIFFS, ACTUAL):
    p.mkdir(exist_ok=True)

URL = "http://localhost:8080/"
TOLERANCE = 0.005  # 0.5% mean RGB diff per pixel

UPDATE = "--update" in sys.argv
FAILED: list[str] = []


def diff_ratio(a: Image.Image, b: Image.Image) -> float:
    if a.size != b.size:
        b = b.resize(a.size)
    a = a.convert("RGB")
    b = b.convert("RGB")
    d = ImageChops.difference(a, b)
    px = list(d.getdata())
    total = sum(r + g + bl for r, g, bl in px)
    max_total = len(px) * 3 * 255
    return total / max_total if max_total else 0.0


def compare(name: str, capture_path: Path) -> None:
    baseline = BASELINES / f"{name}.png"
    if UPDATE or not baseline.exists():
        capture_path.replace(baseline)
        print(f"BASE - wrote baseline for {name}")
        return
    actual = Image.open(capture_path)
    base = Image.open(baseline)
    ratio = diff_ratio(base, actual)
    if ratio <= TOLERANCE:
        print(f"PASS - {name} (diff={ratio:.4%})")
    else:
        # write diff visualisation
        d = ImageChops.difference(
            base.convert("RGB"),
            actual.convert("RGB").resize(base.size),
        )
        d.save(DIFFS / f"{name}.diff.png")
        actual.save(DIFFS / f"{name}.actual.png")
        print(f"FAIL - {name} drift={ratio:.4%} (>{TOLERANCE:.2%})")
        FAILED.append(name)


async def capture_locator(loc, name: str) -> Path:
    out = ACTUAL / f"{name}.png"
    await loc.screenshot(path=str(out))
    return out


async def desktop_scenes(browser):
    print("\n== Desktop ==")
    ctx = await browser.new_context(viewport={"width": 1280, "height": 1800})
    page = await ctx.new_page()
    # Freeze motion + ensure consistent fonts/timing across runs
    await page.add_init_script(
        "() => { try { window.matchMedia = (q) => ({ matches: q.includes('reduce'), media: q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){} }); } catch(e){} }"
    )
    await page.goto(URL, wait_until="domcontentloaded")
    await page.add_style_tag(content="""
        *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
        }
    """)
    await page.wait_for_selector('nav[aria-label="Chapter progress"] button', timeout=15000)
    await page.wait_for_timeout(400)

    rail = page.locator('nav[aria-label="Chapter progress"]')

    # default
    compare("desktop_rail_default", await capture_locator(rail, "desktop_rail_default"))

    # focused state on chapter 3 (Ecosystem)
    btns = rail.locator("ol > li > button")
    await btns.nth(2).focus()
    await page.wait_for_timeout(150)
    compare("desktop_rail_focus_3", await capture_locator(rail, "desktop_rail_focus_3"))

    # active chapter advanced via End key
    await page.keyboard.press("End")
    await page.keyboard.press("Enter")
    await page.wait_for_timeout(700)
    compare("desktop_rail_active_last", await capture_locator(rail, "desktop_rail_active_last"))

    await ctx.close()


async def mobile_scenes(browser):
    print("\n== Mobile ==")
    ctx = await browser.new_context(
        viewport={"width": 390, "height": 844},
        is_mobile=True, has_touch=True,
    )
    page = await ctx.new_page()
    await page.goto(URL, wait_until="domcontentloaded")
    await page.add_style_tag(content="""
        *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
        }
    """)
    await page.wait_for_selector('button[aria-controls="chapter-sheet"]', timeout=15000)
    await page.wait_for_timeout(400)

    pill = page.locator('button[aria-controls="chapter-sheet"]')
    compare("mobile_pill_collapsed", await capture_locator(pill, "mobile_pill_collapsed"))

    # focused pill
    await pill.focus()
    await page.wait_for_timeout(150)
    compare("mobile_pill_focus", await capture_locator(pill, "mobile_pill_focus"))

    # opened sheet
    await pill.click()
    sheet = page.locator('div[role="dialog"]#chapter-sheet')
    await sheet.wait_for(state="visible")
    await page.wait_for_timeout(500)
    compare("mobile_sheet_open", await capture_locator(sheet, "mobile_sheet_open"))

    # focus state on a chapter inside the sheet
    sheet_btn = sheet.locator("ol > li > button").nth(3)
    await sheet_btn.focus()
    await page.wait_for_timeout(150)
    compare("mobile_sheet_focus", await capture_locator(sheet, "mobile_sheet_focus"))

    await ctx.close()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            await desktop_scenes(browser)
            await mobile_scenes(browser)
        finally:
            await browser.close()
    print("\n=========================")
    if FAILED:
        print(f"FAILED: {len(FAILED)} scene(s)")
        for f in FAILED:
            print(" -", f)
        print(f"Diffs written to {DIFFS}")
        sys.exit(1)
    print("All visual regression scenes within tolerance.")


asyncio.run(main())
