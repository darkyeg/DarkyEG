"""One-off design tool: outlines the few glyphs the cards need into scripts/brand/glyphs.json.

The fonts are SIL OFL licensed (Dela Gothic One, Reggae One), which permits embedding outlines. Run: uv run --with fonttools python -I scripts/tools/extract-glyphs.py <fonts-dir>
The build itself only reads the JSON, so the Action needs no font tooling.
"""
import json
import string
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

fonts_dir = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / "brand" / "glyphs.json"

SETS = {
    "dela": (
        "DelaGothicOne-Regular.ttf",
        string.ascii_letters + string.digits + " -.,%:+·/&'!?→" + "ゴドッオラムダー" + "第一二三四部章時星止",
    ),
    # The menacing kana, in the face darky.dev uses for them (Reggae One, also SIL OFL).
    "reggae": ("ReggaeOne-Regular.ttf", "ゴ"),
}

result = {}
for key, (filename, chars) in SETS.items():
    font = TTFont(fonts_dir / filename)
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    entry = {"upm": font["head"].unitsPerEm, "glyphs": {}}
    for ch in sorted(set(chars)):
        name = cmap.get(ord(ch))
        if name is None:
            print(f"{key}: missing {ch!r}")
            continue
        pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.0f}")
        glyphs[name].draw(pen)
        entry["glyphs"][ch] = {"adv": glyphs[name].width, "d": pen.getCommands()}
    result[key] = entry

out.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
print(f"wrote {out} ({out.stat().st_size} bytes)")
