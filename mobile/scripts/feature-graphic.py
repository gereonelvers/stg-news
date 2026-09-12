#!/usr/bin/env python3
"""Render the Google Play feature graphic (1024x500) from the app's own assets.

Usage: python3 scripts/feature-graphic.py [out.png]
Needs Pillow. Renders at 2x and downsamples for clean edges.
"""
import math
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist/store-assets/play-feature-graphic.png"
S = 2  # supersampling
W, H = 1024 * S, 500 * S
FONTS = ROOT / "assets/fonts"
CRIMSON, DEEP, BRIGHT, INK = (153, 24, 63), (110, 16, 48), (196, 37, 86), (23, 21, 26)


def font(name, size):
    return ImageFont.truetype(str(FONTS / f"BarlowCondensed-{name}.ttf"), int(size * S))


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient_bg():
    """Diagonal crimson gradient with a soft highlight top-right and a darker foot bottom-left."""
    bg = Image.new("RGB", (W, H))
    px = bg.load()
    for y in range(H):
        for x in range(W):
            t = (x / W) * 0.65 + (y / H) * 0.35
            px[x, y] = lerp(DEEP, BRIGHT, t)
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse((W * 0.55, -H * 0.9, W * 1.45, H * 0.75), fill=255)
    glow = glow.filter(ImageFilter.GaussianBlur(120 * S))
    bg = Image.composite(Image.new("RGB", (W, H), (232, 71, 122)), bg, glow.point(lambda v: v * 0.45))
    foot = Image.new("L", (W, H), 0)
    ImageDraw.Draw(foot).ellipse((-W * 0.35, H * 0.55, W * 0.55, H * 1.6), fill=255)
    foot = foot.filter(ImageFilter.GaussianBlur(110 * S))
    bg = Image.composite(Image.new("RGB", (W, H), DEEP), bg, foot.point(lambda v: v * 0.55))
    # faint diagonal newsprint lines
    lines = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(lines)
    for i in range(-H, W + H, 26 * S):
        d.line((i, 0, i - H, H), fill=255, width=1 * S)
    bg = Image.composite(Image.new("RGB", (W, H), (255, 255, 255)), bg, lines.point(lambda v: v * 0.05))
    return bg.convert("RGBA")


def white_wordmark(width):
    """The masthead art as a white knockout: dark glyphs opaque, light blocks faint."""
    src = Image.open(ROOT / "assets/images/wordmark-dark.png").convert("RGBA")
    a = src.getchannel("A")
    lum = src.convert("L")
    # glyphs (dark) stay solid, the pale background blocks of the artwork drop out
    strength = lum.point(lambda v: int(255 * max(0.0, ((1 - v / 255) - 0.28) / 0.72) ** 0.8))
    alpha = ImageChops.multiply(a, strength)
    out = Image.new("RGBA", src.size, (255, 255, 255, 0))
    out.putalpha(alpha)
    h = int(src.height * width / src.width)
    return out.resize((width, h), Image.LANCZOS)


def phone(shot_path, width, tilt, dim=0.0):
    """Screenshot in a slim dark bezel with rounded corners, rotated, with a soft shadow."""
    shot = Image.open(shot_path).convert("RGBA")
    bezel = int(width * 0.035)
    inner_w = width - 2 * bezel
    inner_h = int(shot.height * inner_w / shot.width)
    shot = shot.resize((inner_w, inner_h), Image.LANCZOS)
    if dim:
        shot = Image.blend(shot, Image.new("RGBA", shot.size, (0, 0, 0, 255)), dim)
    radius_in = int(width * 0.11)
    mask = Image.new("L", shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, inner_w - 1, inner_h - 1), radius_in, fill=255)
    body_w, body_h = width, inner_h + 2 * bezel
    body = Image.new("RGBA", (body_w, body_h), (0, 0, 0, 0))
    ImageDraw.Draw(body).rounded_rectangle((0, 0, body_w - 1, body_h - 1), radius_in + bezel, fill=INK + (255,))
    ImageDraw.Draw(body).rounded_rectangle((1, 1, body_w - 2, body_h - 2), radius_in + bezel, outline=(255, 255, 255, 60), width=2 * S)
    body.paste(shot, (bezel, bezel), mask)
    pad = int(60 * S)
    canvas = Image.new("RGBA", (body_w + 2 * pad, body_h + 2 * pad), (0, 0, 0, 0))
    canvas.paste(body, (pad, pad), body)
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sh_mask = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(sh_mask).rounded_rectangle((pad, pad + 18 * S, pad + body_w, pad + body_h + 18 * S), radius_in + bezel, fill=150)
    shadow.putalpha(sh_mask.filter(ImageFilter.GaussianBlur(26 * S)))
    layered = Image.alpha_composite(shadow, canvas)
    return layered.rotate(tilt, resample=Image.BICUBIC, expand=True)


def pill(draw, x, y, text, f):
    tw = draw.textlength(text, font=f)
    ph = int(38 * S)
    draw.rounded_rectangle((x, y, x + tw + 30 * S, y + ph), ph // 2, fill=(255, 255, 255, 40), outline=(255, 255, 255, 90), width=1 * S)
    draw.text((x + 15 * S, y + ph / 2), text, font=f, fill=(255, 255, 255, 235), anchor="lm")
    return x + tw + 30 * S + 12 * S


def main():
    img = gradient_bg()
    # phones on the right, emerging from the bottom edge
    back = phone(ROOT / "dist/screenshots/android-phone/6-artikel-dark.png", int(236 * S), -8, dim=0.15)
    front = phone(ROOT / "dist/screenshots/android-phone/1-start.png", int(258 * S), 6)
    img.alpha_composite(back, (int(690 * S), int(40 * S)))
    img.alpha_composite(front, (int(505 * S), int(58 * S)))

    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    x0 = int(64 * S)
    wm = white_wordmark(int(300 * S))
    overlay.alpha_composite(wm, (x0, int(52 * S)))

    head = font("ExtraBold", 66)
    y = int(168 * S)
    for line in ("Was am STG", "los ist."):
        d.text((x0, y), line, font=head, fill=(255, 255, 255, 255))
        y += int(64 * S)
    sub = font("Medium", 25)
    y += int(12 * S)
    for line in ("Alle Artikel, Ressorts und die Redaktion –", "neue Storys direkt aufs Handy."):
        d.text((x0, y), line, font=sub, fill=(255, 255, 255, 215))
        y += int(31 * S)
    y += int(14 * S)
    x = x0
    pf = font("SemiBold", 19)
    for label in ("Mitteilungen", "Offline lesen", "Kommentare", "Dark Mode"):
        x = pill(d, x, y, label, pf)

    img.alpha_composite(overlay)
    out = img.convert("RGB").resize((1024, 500), Image.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
