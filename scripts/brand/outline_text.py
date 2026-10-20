"""Text outlines for the logo (spec 4.6): every logo text becomes SVG path data.

Reads run specs as JSON on stdin and writes outlines as JSON to stdout. Called by build.mjs only
when the specs change; the result is cached in scripts/brand/outlines.json.

Fonts: the OFL variable fonts already installed by @fontsource-variable (Fraunces, Manrope).
fontTools instantiates static instances at the requested axes, HarfBuzz shapes the text
(GPOS kerning), and fontTools pens extract the outlines.

Run spec:
  {"id": str, "font": "fraunces"|"manrope", "axes": {...}, "text": str,
   "size": {"xHeight"|"capHeight"|"em": number},   # target height in px
   "fitWidth": number?,                            # ink width in px, solved with tracking
   "tracking": number?,                            # extra px between glyphs (if no fitWidth)
   "groups": [[start, end, name], ...]?,           # character ranges -> separate paths
   "glyphs": bool?}                                # also emit one path per glyph

Requires: pip install fonttools brotli uharfbuzz
"""

import json
import sys
from io import BytesIO
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
FONTS = {
    "fraunces": ROOT / "node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2",
    "manrope": ROOT / "node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
}

_instances = {}


def instance(font, axes):
    key = (font, tuple(sorted(axes.items())))
    if key not in _instances:
        tt = instantiateVariableFont(TTFont(FONTS[font]), axes)
        tt.flavor = None
        data = BytesIO()
        tt.save(data)
        data = data.getvalue()
        _instances[key] = (TTFont(BytesIO(data)), hb.Font(hb.Face(data)))
    return _instances[key]


def num(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def shape(hb_font, text):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hb_font, buf, {"kern": True, "liga": False, "dlig": False})
    return buf.glyph_infos, buf.glyph_positions


def layout(spec, tracking):
    tt, hb_font = instance(spec["font"], spec["axes"])
    upm = tt["head"].unitsPerEm
    os2 = tt["OS/2"]
    size_key, target = next(iter(spec["size"].items()))
    ref = {"xHeight": os2.sxHeight, "capHeight": os2.sCapHeight, "em": upm}[size_key]
    scale = target / ref
    infos, positions = shape(hb_font, spec["text"])
    order = tt.getGlyphOrder()
    glyphset = tt.getGlyphSet()

    placed, x = [], 0.0
    for i, (info, pos) in enumerate(zip(infos, positions)):
        name = order[info.codepoint]
        placed.append((info.cluster, name, x + pos.x_offset * scale, pos.y_offset * scale))
        x += pos.x_advance * scale + (tracking if i < len(infos) - 1 else 0)
    return tt, glyphset, scale, placed


def outline(glyphset, scale, glyphs):
    pen = SVGPathPen(glyphset, ntos=num)
    bounds = BoundsPen(glyphset)
    for _, name, x, y in glyphs:
        t = (scale, 0, 0, -scale, x, -y)  # font y-up -> SVG y-down, baseline at y = 0
        glyphset[name].draw(TransformPen(pen, t))
        glyphset[name].draw(TransformPen(bounds, t))
    return pen.getCommands(), bounds.bounds


def build(spec):
    tracking = spec.get("tracking", 0.0)
    if "fitWidth" in spec:
        # Ink width grows linearly with tracking: solve from two layouts.
        def ink(t):
            _, gs, sc, placed = layout(spec, t)
            b = outline(gs, sc, placed)[1]
            return b[2] - b[0]

        n = len(spec["text"]) - 1
        w0 = ink(0.0)
        tracking = (spec["fitWidth"] - w0) / n if n else 0.0

    tt, glyphset, scale, placed = layout(spec, tracking)
    d, bbox = outline(glyphset, scale, placed)
    out = {
        "id": spec["id"],
        "d": d,
        "bbox": [round(v, 2) for v in bbox],
        "tracking": round(tracking, 3),
        "fontSize": round(scale * tt["head"].unitsPerEm, 3),
    }
    if "groups" in spec:
        out["groups"] = {}
        for start, end, name in spec["groups"]:
            part = [g for g in placed if start <= g[0] < end]
            gd, _ = outline(glyphset, scale, part)
            out["groups"][name] = out["groups"].get(name, "") + gd
    if spec.get("glyphs"):
        out["glyphs"] = [
            {"char": spec["text"][g[0]], "d": outline(glyphset, scale, [g])[0]}
            for g in placed
            if spec["text"][g[0]] != " "
        ]
    return out


def main():
    # Decode explicitly: on Windows, stdin defaults to the ANSI code page and mangles "·".
    specs = json.loads(sys.stdin.buffer.read().decode("utf-8"))
    json.dump([build(s) for s in specs], sys.stdout)


if __name__ == "__main__":
    main()
