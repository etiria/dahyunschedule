"""Turn a raw endoscopy image dump into an annotation manifest to be filled in.

Reality when there is NO site tagging: the first practical step is producing a
worklist for annotators - one row per image with empty label columns. This walks
a folder tree (one sub-folder per patient study by default), lists images in
capture order, and writes a CSV with the schema the trainer expects.

    python -m eggim.scaffold_manifest /data/studies --out manifest_to_label.csv

Annotators then fill `site`, `quality_ok`, and (later) `im_grade`. The
`seq_index` column preserves capture order within a study: if your unit shoots
the stomach in a fixed protocol sequence, that ordinal is a strong prior for the
site and can seed / semi-automate labeling.

Pure standard library so it runs anywhere, no ML stack needed.
"""
from __future__ import annotations

import argparse
import csv
import os
from dataclasses import dataclass
from typing import List, Optional

_IMG_EXTS = (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff")

MANIFEST_COLUMNS = [
    "image_path", "patient_id", "seq_index",
    "site", "quality_ok", "im_grade",   # <- to be filled by annotators
]


@dataclass
class ScaffoldStats:
    n_patients: int
    n_images: int
    out_path: str


def _is_image(name: str) -> bool:
    return name.lower().endswith(_IMG_EXTS)


def build_rows(root: str, patient_from: str = "dir") -> List[dict]:
    """Walk `root`; each immediate sub-directory is one patient study.

    patient_from:
      "dir"      -> patient_id is the sub-folder name (default)
      "filename" -> flat folder; patient_id is the filename prefix before '_'
    """
    rows: List[dict] = []

    if patient_from == "filename":
        images = sorted(f for f in os.listdir(root) if _is_image(f))
        # group by prefix before first underscore
        counters: dict = {}
        for f in images:
            pid = f.split("_", 1)[0]
            idx = counters.get(pid, 0)
            counters[pid] = idx + 1
            rows.append(_row(os.path.join(root, f), pid, idx))
        return rows

    for entry in sorted(os.listdir(root)):
        pdir = os.path.join(root, entry)
        if not os.path.isdir(pdir):
            continue
        images = sorted(
            os.path.join(dp, f)
            for dp, _, fs in os.walk(pdir) for f in fs if _is_image(f)
        )
        for idx, path in enumerate(images):
            rows.append(_row(path, entry, idx))
    return rows


def _row(path: str, patient_id: str, seq_index: int) -> dict:
    return {
        "image_path": path,
        "patient_id": patient_id,
        "seq_index": seq_index,
        "site": "",          # antrum_lesser / antrum_greater / incisura / corpus_lesser / corpus_greater / other
        "quality_ok": "",    # 1 / 0
        "im_grade": "",      # 0 / 1 / 2  (leave blank if site is 'other' or quality is 0)
    }


def scaffold(root: str, out: str, patient_from: str = "dir") -> ScaffoldStats:
    rows = build_rows(root, patient_from=patient_from)
    with open(out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=MANIFEST_COLUMNS)
        w.writeheader()
        w.writerows(rows)
    return ScaffoldStats(
        n_patients=len({r["patient_id"] for r in rows}),
        n_images=len(rows),
        out_path=out,
    )


def main():
    ap = argparse.ArgumentParser(description="Scaffold an annotation manifest from an image dump")
    ap.add_argument("root", help="root folder (one sub-folder per patient, or a flat folder)")
    ap.add_argument("--out", default="manifest_to_label.csv")
    ap.add_argument("--patient-from", choices=["dir", "filename"], default="dir")
    args = ap.parse_args()
    s = scaffold(args.root, args.out, patient_from=args.patient_from)
    print(f"wrote {s.out_path}: {s.n_images} images across {s.n_patients} patients")
    print("annotators fill: site, quality_ok, im_grade  (seq_index = capture order = site prior)")


if __name__ == "__main__":
    main()
