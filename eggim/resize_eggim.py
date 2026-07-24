#!/usr/bin/env python3
"""Standalone EGGIM image resizer (no repo needed — just Pillow).

Resizes an endoscopy image set for labeling, mirroring the patient/exam folder
structure. Originals are left untouched. Writes a mapping CSV so predictions on
resized images can be traced back to originals.

Usage (macOS / Linux):
    pip3 install Pillow
    python3 resize_eggim.py "/Volumes/KIOXIA/EGGIM_AI" "/Volumes/KIOXIA/EGGIM_AI_label_1280"

Options:
    --max-edge 1280     longer edge cap in px (never upscales)
    --quality 90        JPEG quality
"""
import argparse
import csv
import os
import re
import sys

IMG_EXTS = (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff")
FILENAME_RE = re.compile(r"^([A-Za-z]?\d+)_(\d{8})_(\d+)_([A-Za-z0-9]+)_(\d+)_(\d+)$")
COLUMNS = ["original_path", "resized_path", "patient_id", "exam_id", "exam_date",
           "orig_w", "orig_h", "new_w", "new_h", "status"]


def is_image(name):
    # skip macOS junk: .DS_Store and AppleDouble "._" companion files
    if name.startswith("."):
        return False
    return name.lower().endswith(IMG_EXTS)


def parse_name(name):
    stem = os.path.splitext(name)[0]
    m = FILENAME_RE.match(stem)
    if not m:
        return None
    return {"patient_id": m.group(1), "exam_date": m.group(2), "image_no": int(m.group(6))}


def target_size(w, h, max_edge):
    long_edge = max(w, h)
    if long_edge <= max_edge:
        return w, h, False
    s = max_edge / long_edge
    return max(1, round(w * s)), max(1, round(h * s)), True


def main():
    ap = argparse.ArgumentParser(description="Resize an endoscopy image set for labeling")
    ap.add_argument("in_root")
    ap.add_argument("out_root")
    ap.add_argument("--max-edge", type=int, default=1280)
    ap.add_argument("--quality", type=int, default=90)
    args = ap.parse_args()

    try:
        from PIL import Image, ImageOps
    except ImportError:
        sys.exit("Pillow가 필요합니다.  먼저:  pip3 install Pillow")

    if not os.path.isdir(args.in_root):
        sys.exit(f"입력 폴더를 찾을 수 없습니다: {args.in_root}")

    srcs = []
    for dp, _, fs in os.walk(args.in_root):
        for f in fs:
            if is_image(f):
                srcs.append(os.path.join(dp, f))
    srcs.sort()
    print(f"이미지 {len(srcs)}장 발견. 리사이즈 시작…")

    rows = []
    n_resized = n_kept = n_failed = 0
    out_bytes = 0
    for i, src in enumerate(srcs):
        name = os.path.basename(src)
        meta = parse_name(name)
        rel = os.path.relpath(src, args.in_root)
        folder = rel.split(os.sep)[0]
        patient_id = (meta or {}).get("patient_id") or folder or "unknown"
        exam_date = (meta or {}).get("exam_date", "")
        exam_id = f"{patient_id}_{exam_date}" if exam_date else patient_id
        dst = os.path.join(args.out_root, os.path.splitext(rel)[0] + ".jpg")
        row = {c: "" for c in COLUMNS}
        row.update(original_path=src, resized_path=dst, patient_id=patient_id,
                   exam_id=exam_id, exam_date=exam_date)
        try:
            with Image.open(src) as im:
                im = ImageOps.exif_transpose(im)
                w, h = im.size
                nw, nh, shrink = target_size(w, h, args.max_edge)
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                if shrink:
                    im = im.resize((nw, nh), Image.LANCZOS)
                    n_resized += 1
                    row["status"] = "resized"
                else:
                    n_kept += 1
                    row["status"] = "kept"
                im.convert("RGB").save(dst, "JPEG", quality=args.quality, optimize=True)
                try:
                    out_bytes += os.path.getsize(dst)
                except OSError:
                    pass
                row.update(orig_w=w, orig_h=h, new_w=nw, new_h=nh)
        except Exception as e:
            n_failed += 1
            row["status"] = f"failed: {type(e).__name__}"
        rows.append(row)
        if (i + 1) % 500 == 0:
            print(f"  {i + 1}/{len(srcs)} 처리…")

    os.makedirs(args.out_root, exist_ok=True)
    map_path = os.path.join(args.out_root, "resize_map.csv")
    with open(map_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)

    mb = out_bytes / (1024 * 1024)
    size = f"{mb / 1024:.2f} GB" if mb >= 1024 else f"{mb:.1f} MB"
    avg = (out_bytes / max(len(srcs) - n_failed, 1)) / 1024
    n_exams = len({r["exam_id"] for r in rows})
    print("\n완료")
    print(f"  이미지 {len(srcs)}장 | 검사 {n_exams}건 | 리사이즈 {n_resized} · 유지 {n_kept} · 실패 {n_failed}")
    print(f"  총 용량 {size}  (평균 {avg:.0f} KB/장)")
    print(f"  출력 폴더: {args.out_root}")
    print(f"  매핑 CSV: {map_path}")


if __name__ == "__main__":
    main()
