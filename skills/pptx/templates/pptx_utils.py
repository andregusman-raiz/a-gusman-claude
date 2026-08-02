"""PPTX text measurement and safe placement utilities.

Mitigates the #1 issue in python-pptx: text overflow because the lib
cannot measure rendered width. Uses Pillow + system fonts to estimate.

Usage:
    from pptx_utils import (
        add_text_safe, fit_text_size, measure_text_width,
        wrap_text_lines, estimate_lines_height, LIGHT_THEME, DARK_THEME,
    )
"""
from __future__ import annotations

import os
from typing import Iterable, Optional, Tuple, List, Dict, Any

from PIL import ImageFont
from pptx.util import Emu, Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR


# ----------------------------------------------------------
# Theme constants (light as DEFAULT, dark optional)
# ----------------------------------------------------------

LIGHT_THEME: Dict[str, RGBColor] = {
    "bg":           RGBColor(0xFA, 0xFB, 0xFC),   # off-white background
    "card":         RGBColor(0xFF, 0xFF, 0xFF),   # card white
    "card_alt":     RGBColor(0xF3, 0xF5, 0xF8),   # subtle card
    "border":       RGBColor(0xD0, 0xD7, 0xDE),   # border
    "line":         RGBColor(0xB4, 0xBD, 0xC7),   # separator lines
    "text":         RGBColor(0x0F, 0x1A, 0x2B),   # near-black primary
    "muted":        RGBColor(0x52, 0x5E, 0x73),   # slate-500
    "dim":          RGBColor(0x7A, 0x86, 0x99),   # slate-400
    "orange":       RGBColor(0xF7, 0x94, 0x1D),
    "teal":         RGBColor(0x2F, 0x8F, 0x7D),   # slightly darker teal for legibility on light
    "orange_soft":  RGBColor(0xFE, 0xEE, 0xD8),
    "teal_soft":    RGBColor(0xDE, 0xF0, 0xEC),
    "accent_dark":  RGBColor(0x1E, 0x24, 0x33),   # used for action-bar/ribbons
}

DARK_THEME: Dict[str, RGBColor] = {
    "bg":           RGBColor(0x1E, 0x24, 0x33),
    "card":         RGBColor(0x2D, 0x35, 0x48),
    "card_alt":     RGBColor(0x26, 0x2D, 0x3E),
    "border":       RGBColor(0x4A, 0x55, 0x68),
    "line":         RGBColor(0x58, 0x64, 0x78),
    "text":         RGBColor(0xFF, 0xFF, 0xFF),
    "muted":        RGBColor(0x9A, 0xA3, 0xB2),
    "dim":          RGBColor(0x6B, 0x74, 0x85),
    "orange":       RGBColor(0xF7, 0x94, 0x1D),
    "teal":         RGBColor(0x5B, 0xB5, 0xA2),
    "orange_soft":  RGBColor(0x3A, 0x2A, 0x18),
    "teal_soft":    RGBColor(0x18, 0x33, 0x2E),
    "accent_dark":  RGBColor(0x0F, 0x14, 0x1E),
}


# ----------------------------------------------------------
# Font resolution
# ----------------------------------------------------------

SYSTEM_FONTS: Dict[str, str] = {
    "Helvetica": "/System/Library/Fonts/Helvetica.ttc",
    "HelveticaNeue": "/System/Library/Fonts/HelveticaNeue.ttc",
    "Arial": "/Library/Fonts/Arial.ttf",
    "IBM Plex Sans": "/Library/Fonts/IBMPlexSans-Regular.ttf",
}


def _resolve_font_path(font_name: str) -> str:
    """Return a real .ttf/.ttc path. Falls back to Helvetica."""
    candidate = SYSTEM_FONTS.get(font_name)
    if candidate and os.path.exists(candidate):
        return candidate
    return "/System/Library/Fonts/Helvetica.ttc"


_FONT_CACHE: Dict[Tuple[str, int, bool], ImageFont.FreeTypeFont] = {}


def _get_font(font_name: str, size_pt, bold: bool = False) -> ImageFont.FreeTypeFont:
    size_int = max(int(round(float(size_pt))), 1)
    key = (font_name, size_int, bold)
    if key in _FONT_CACHE:
        return _FONT_CACHE[key]
    path = _resolve_font_path(font_name)
    try:
        if path.endswith(".ttc"):
            # Helvetica.ttc: index 0=regular, 1=bold
            font = ImageFont.truetype(path, size_int, index=1 if bold else 0)
        else:
            font = ImageFont.truetype(path, size_int)
    except Exception:
        font = ImageFont.load_default()
    _FONT_CACHE[key] = font
    return font


# ----------------------------------------------------------
# Measurement (core anti-overflow primitives)
# ----------------------------------------------------------

EMU_PER_PT = 12700      # 1 point = 12700 EMU
EMU_PER_INCH = 914400
PT_PER_INCH = 72


def pt_to_emu(pt: float) -> int:
    return int(pt * EMU_PER_PT)


def emu_to_pt(emu: int) -> float:
    return emu / EMU_PER_PT


def measure_text_width_pt(text: str, size_pt: int, font_name: str = "Helvetica",
                          bold: bool = False) -> float:
    """Return rendered text width in POINTS (Pillow px @ 72 DPI == pt)."""
    if not text:
        return 0.0
    font = _get_font(font_name, size_pt, bold)
    return float(font.getlength(text))


def measure_text_width_emu(text: str, size_pt: int, font_name: str = "Helvetica",
                           bold: bool = False) -> int:
    return int(measure_text_width_pt(text, size_pt, font_name, bold) * EMU_PER_PT)


# ----------------------------------------------------------
# Word wrapping
# ----------------------------------------------------------

def wrap_text_lines(text: str, max_width_emu: int, size_pt: int,
                    font_name: str = "Helvetica", bold: bool = False) -> List[str]:
    """Greedy word-wrap to fit within max_width_emu. Returns lines."""
    if not text:
        return [""]
    max_width_pt = max_width_emu / EMU_PER_PT
    words = text.split()
    lines: List[str] = []
    current = ""
    for w in words:
        trial = (current + " " + w).strip()
        width = measure_text_width_pt(trial, size_pt, font_name, bold)
        if width <= max_width_pt:
            current = trial
        else:
            if current:
                lines.append(current)
            # if single word is too wide, force split ugly — but return anyway
            current = w
    if current:
        lines.append(current)
    return lines


def estimate_lines_height_emu(lines: int, size_pt: int, line_height: float = 1.25) -> int:
    """Height needed for N lines of text."""
    return int(lines * size_pt * line_height * EMU_PER_PT)


def fits_in_box(text: str, box_w_emu: int, box_h_emu: int, size_pt: int,
                font_name: str = "Helvetica", bold: bool = False,
                line_height: float = 1.25, padding_emu: int = 0) -> Tuple[bool, int, int]:
    """Check if text fits box given size. Returns (fits, lines, needed_h_emu)."""
    inner_w = max(box_w_emu - 2 * padding_emu, 1)
    inner_h = max(box_h_emu - 2 * padding_emu, 1)
    lines = wrap_text_lines(text, inner_w, size_pt, font_name, bold)
    needed = estimate_lines_height_emu(len(lines), size_pt, line_height)
    return (needed <= inner_h, len(lines), needed)


def fit_text_size(text: str, box_w_emu: int, box_h_emu: int, max_size_pt: int = 24,
                  min_size_pt: int = 7, font_name: str = "Helvetica",
                  bold: bool = False, line_height: float = 1.25,
                  padding_emu: int = 0) -> int:
    """Binary-search-style search for largest size_pt that fits."""
    for size in range(max_size_pt, min_size_pt - 1, -1):
        ok, _, _ = fits_in_box(text, box_w_emu, box_h_emu, size,
                               font_name, bold, line_height, padding_emu)
        if ok:
            return size
    return min_size_pt


# ----------------------------------------------------------
# Safe text placement
# ----------------------------------------------------------

def add_text_safe(slide, left, top, width, height, text: str, *,
                  size: int = 11,
                  bold: bool = False,
                  italic: bool = False,
                  color: Optional[RGBColor] = None,
                  font_name: str = "Helvetica",
                  align=PP_ALIGN.LEFT,
                  anchor=MSO_ANCHOR.TOP,
                  auto_shrink: bool = True,
                  min_size: int = 7,
                  line_height: float = 1.25,
                  margin_pt: float = 2.0,
                  warn_cb=None) -> Tuple[object, int]:
    """Add text that is *guaranteed* to fit the box.

    - Measures text with Pillow.
    - If text overflows at requested size, either:
        * auto_shrink=True: reduce font size until it fits (down to min_size).
        * auto_shrink=False: warn (if warn_cb provided) and leave user in charge.
    Returns (textbox_shape, actual_font_size_used).
    """
    if color is None:
        color = RGBColor(0x0F, 0x1A, 0x2B)

    padding_emu = int(margin_pt * EMU_PER_PT)
    used_size = size

    if auto_shrink and text:
        ok, _, needed = fits_in_box(text, width, height, size, font_name,
                                    bold, line_height, padding_emu)
        if not ok:
            used_size = fit_text_size(text, width, height, max_size_pt=size,
                                      min_size_pt=min_size, font_name=font_name,
                                      bold=bold, line_height=line_height,
                                      padding_emu=padding_emu)
            if warn_cb and used_size < size:
                warn_cb(f"auto-shrunk from {size}pt to {used_size}pt for: {text[:60]}...")

    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.margin_left = int(margin_pt * EMU_PER_PT)
    tf.margin_right = int(margin_pt * EMU_PER_PT)
    tf.margin_top = int(margin_pt * EMU_PER_PT)
    tf.margin_bottom = int(margin_pt * EMU_PER_PT)
    tf.word_wrap = True
    tf.vertical_anchor = anchor

    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.name = font_name
    r.font.size = Pt(used_size)
    r.font.bold = bold
    r.font.italic = italic
    r.font.color.rgb = color
    return tb, used_size


def add_paragraphs_safe(slide, left, top, width, height,
                        runs: List[Dict[str, Any]], *,
                        font_name: str = "Helvetica",
                        align=PP_ALIGN.LEFT,
                        anchor=MSO_ANCHOR.TOP,
                        auto_shrink: bool = True,
                        line_height: float = 1.25,
                        margin_pt: float = 2.0,
                        warn_cb=None):
    """Add a textbox with multiple paragraph runs.

    runs: list of {"text", "size", "bold", "italic", "color", "align", "space_before"}
    Each run becomes its own paragraph.
    Auto-shrink scales ALL run sizes proportionally if total height exceeds box.
    """
    # estimate total height needed at requested sizes
    padding_emu = int(margin_pt * EMU_PER_PT)
    inner_w = max(width - 2 * padding_emu, 1)
    inner_h = max(height - 2 * padding_emu, 1)

    def total_needed(scale: float) -> Tuple[int, List[int]]:
        total = 0
        line_counts = []
        for r in runs:
            size = max(int(r.get("size", 11) * scale), 6)
            text = r.get("text", "")
            lines = wrap_text_lines(text, inner_w, size, font_name, r.get("bold", False))
            lc = max(len(lines), 1)
            line_counts.append(lc)
            total += int(lc * size * line_height * EMU_PER_PT)
            sp_before = r.get("space_before", 0)
            total += int(sp_before * EMU_PER_PT)
        return total, line_counts

    scale = 1.0
    if auto_shrink:
        for s in [1.0, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6]:
            needed, _ = total_needed(s)
            if needed <= inner_h:
                scale = s
                break
        if warn_cb and scale < 1.0:
            warn_cb(f"scaled run sizes by {scale:.2f} to fit {height/EMU_PER_INCH:.2f}in box")

    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.margin_left = padding_emu; tf.margin_right = padding_emu
    tf.margin_top = padding_emu; tf.margin_bottom = padding_emu
    tf.word_wrap = True
    tf.vertical_anchor = anchor

    first = True
    for r in runs:
        if first:
            p = tf.paragraphs[0]; first = False
        else:
            p = tf.add_paragraph()
        p.alignment = r.get("align", align)
        if r.get("space_before"):
            p.space_before = Pt(r["space_before"])
        if r.get("space_after"):
            p.space_after = Pt(r["space_after"])
        run = p.add_run()
        run.text = r.get("text", "")
        run.font.name = r.get("font", font_name)
        run.font.size = Pt(max(int(r.get("size", 11) * scale), 6))
        run.font.bold = r.get("bold", False)
        run.font.italic = r.get("italic", False)
        if r.get("color"):
            run.font.color.rgb = r["color"]
    return tb, scale


# ----------------------------------------------------------
# Post-generation verification
# ----------------------------------------------------------

def verify_deck(pptx_path: str) -> Tuple[bool, List[str]]:
    """Convert PPTX -> PDF via LibreOffice and check page count.
    Returns (ok, warnings). Minimal check — full visual QA should render PNGs.
    """
    import subprocess
    warnings: List[str] = []
    out_dir = os.path.dirname(os.path.abspath(pptx_path))
    try:
        subprocess.run(
            ["libreoffice", "--headless", "--convert-to", "pdf",
             pptx_path, "--outdir", out_dir],
            check=True, capture_output=True, timeout=90,
        )
    except subprocess.CalledProcessError as e:
        warnings.append(f"libreoffice conversion failed: {e}")
        return False, warnings
    except FileNotFoundError:
        warnings.append("libreoffice not installed — skipping PDF verify")
        return True, warnings
    except subprocess.TimeoutExpired:
        warnings.append("libreoffice timeout 90s")
        return False, warnings

    pdf_path = os.path.splitext(pptx_path)[0] + ".pdf"
    if not os.path.exists(pdf_path):
        warnings.append(f"PDF not generated at {pdf_path}")
        return False, warnings
    return True, warnings


def render_deck_to_pngs(pptx_path: str, out_dir: Optional[str] = None,
                        dpi: int = 120) -> Tuple[List[str], List[str]]:
    """Render all slides to PNG for visual QA. Returns (png_paths, warnings)."""
    import subprocess, glob
    warnings: List[str] = []
    if out_dir is None:
        out_dir = os.path.dirname(os.path.abspath(pptx_path))
    os.makedirs(out_dir, exist_ok=True)
    ok, w = verify_deck(pptx_path)
    warnings.extend(w)
    if not ok:
        return [], warnings
    pdf_path = os.path.splitext(pptx_path)[0] + ".pdf"
    base = os.path.splitext(os.path.basename(pptx_path))[0]
    prefix = os.path.join(out_dir, f"{base}_slide")
    try:
        subprocess.run(
            ["pdftoppm", "-png", "-r", str(dpi), pdf_path, prefix],
            check=True, capture_output=True, timeout=60,
        )
    except Exception as e:
        warnings.append(f"pdftoppm failed: {e}")
        return [], warnings
    pngs = sorted(glob.glob(f"{prefix}-*.png"))
    return pngs, warnings
