"""Resize an endoscopy image set for labeling, preserving the folder layout.

For the reference-labeling stage, experts view down-scaled images (faster to
load, especially in a browser tool). The FULL-resolution originals are kept
untouched for later model training - this only produces a labeling copy.

    python -m eggim.resize_images "G:\\EGD_files\\EGD_2026_images_PNG" \
        "G:\\EGD_files\\EGD_2026_label_1280" --max-edge 1280

What it does:
  * mirrors the patient sub-folder structure into the output root
  * scales each image so its LONGER edge <= --max-edge (aspect preserved; never
    upscales)
  * writes a mapping CSV (original_path <-> resized_path + sizes + exam_id) so a
    prediction on a resized image can always be traced back to the original

Requires Pillow (pip install Pillow). The mapping CSV lets you resume/audit.
"""
from __future__ import annotations

import argparse
import csv
import os
from dataclasses import dataclass
from typing import List, Optional

from .scaffold_manifest import DEFAULT_FILENAME_RE, _is_image, parse_filename

RESIZE_MAP_COLUMNS = [
    "original_path", "resized_path", "patient_id", "exam_id", "exam_date",
    "orig_w", "orig_h", "new_w", "new_h", "status",
]


@dataclass
class ResizeStats:
    n_total: int = 0
    n_resized: int = 0
    n_copied: int = 0        # already small enough / kept as-is
    n_failed: int = 0
    out_bytes: int = 0       # total size of written files
    out_root: str = ""
    map_path: str = ""

    @property
    def out_mb(self) -> float:
        return self.out_bytes / (1024 * 1024)


def _target_size(w: int, h: int, max_edge: int):
    long_edge = max(w, h)
    if long_edge <= max_edge:
        return w, h, False              # no upscale
    scale = max_edge / long_edge
    return max(1, round(w * scale)), max(1, round(h * scale)), True


def _out_path(in_root: str, out_root: str, src: str, fmt: str) -> str:
    rel = os.path.relpath(src, in_root)
    dst = os.path.join(out_root, rel)
    if fmt in ("jpeg", "jpg"):
        dst = os.path.splitext(dst)[0] + ".jpg"
    elif fmt == "png":
        dst = os.path.splitext(dst)[0] + ".png"
    return dst


def resize_tree(in_root: str, out_root: str, *, max_edge: int = 1280,
                fmt: str = "jpeg", quality: int = 90,
                map_path: Optional[str] = None) -> ResizeStats:
    from PIL import Image, ImageOps

    stats = ResizeStats(out_root=out_root)
    rows: List[dict] = []

    srcs: List[str] = []
    for dp, _, fs in os.walk(in_root):
        for f in fs:
            if _is_image(f):
                srcs.append(os.path.join(dp, f))
    srcs.sort()
    stats.n_total = len(srcs)

    for i, src in enumerate(srcs):
        name = os.path.basename(src)
        meta = parse_filename(name, DEFAULT_FILENAME_RE) or {}
        # patient_id: prefer the immediate sub-folder under in_root, else filename
        rel_parts = os.path.relpath(src, in_root).split(os.sep)
        patient_id = rel_parts[0] if len(rel_parts) > 1 else (meta.get("patient_id") or "unknown")
        exam_date = meta.get("exam_date", "")
        exam_id = f"{patient_id}_{exam_date}" if exam_date else patient_id
        dst = _out_path(in_root, out_root, src, fmt)

        row = {
            "original_path": src, "resized_path": dst, "patient_id": patient_id,
            "exam_id": exam_id, "exam_date": exam_date,
            "orig_w": "", "orig_h": "", "new_w": "", "new_h": "", "status": "",
        }
        try:
            with Image.open(src) as im:
                im = ImageOps.exif_transpose(im)   # honor camera orientation
                w, h = im.size
                nw, nh, shrink = _target_size(w, h, max_edge)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                if shrink:
                    im = im.resize((nw, nh), Image.LANCZOS)
                    stats.n_resized += 1
                    row["status"] = "resized"
                else:
                    stats.n_copied += 1
                    row["status"] = "kept"
                if fmt in ("jpeg", "jpg"):
                    im.convert("RGB").save(dst, "JPEG", quality=quality, optimize=True)
                elif fmt == "png":
                    im.save(dst, "PNG", optimize=True)
                else:  # keep original format/extension
                    im.save(dst)
                try:
                    stats.out_bytes += os.path.getsize(dst)
                except OSError:
                    pass
                row.update(orig_w=w, orig_h=h, new_w=nw, new_h=nh)
        except Exception as e:  # corrupt / unreadable image -> log and continue
            stats.n_failed += 1
            row["status"] = f"failed: {type(e).__name__}"
        rows.append(row)

        if (i + 1) % 500 == 0:
            print(f"  {i+1}/{stats.n_total} processed")

    stats.map_path = map_path or os.path.join(out_root, "resize_map.csv")
    os.makedirs(os.path.dirname(stats.map_path) or ".", exist_ok=True)
    with open(stats.map_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=RESIZE_MAP_COLUMNS)
        w.writeheader()
        w.writerows(rows)
    return stats


def main():
    ap = argparse.ArgumentParser(description="Resize an endoscopy image set for labeling")
    ap.add_argument("in_root")
    ap.add_argument("out_root")
    ap.add_argument("--max-edge", type=int, default=1280,
                    help="longer edge cap in px (default 1280; images are never upscaled)")
    ap.add_argument("--format", dest="fmt", choices=["jpeg", "png", "keep"], default="jpeg",
                    help="output format (default jpeg q90 = small files for labeling)")
    ap.add_argument("--quality", type=int, default=90, help="JPEG quality (default 90)")
    ap.add_argument("--manifest", default=None, help="mapping CSV path (default <out_root>/resize_map.csv)")
    args = ap.parse_args()
    s = resize_tree(args.in_root, args.out_root, max_edge=args.max_edge,
                    fmt=args.fmt, quality=args.quality, map_path=args.manifest)
    print(f"done: {s.n_total} images | resized {s.n_resized} | kept {s.n_copied} | failed {s.n_failed}")
    size = f"{s.out_mb/1024:.2f} GB" if s.out_mb >= 1024 else f"{s.out_mb:.1f} MB"
    avg = (s.out_bytes / max(s.n_total - s.n_failed, 1)) / 1024
    print(f"total output size: {size}  (avg {avg:.0f} KB/image)")
    print(f"output: {s.out_root}")
    print(f"mapping: {s.map_path}")


if __name__ == "__main__":
    main()
