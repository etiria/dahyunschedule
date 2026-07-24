"""Turn a raw endoscopy image dump into an annotation manifest to be filled in.

Reality when there is NO site tagging: the first practical step is producing a
worklist for annotators - one row per image with empty label columns. This walks
a folder tree (one sub-folder per patient by default), parses the filename for
exam metadata, and writes a CSV with the schema the trainer expects.

    python -m eggim.scaffold_manifest /data/studies --out manifest_to_label.csv

Filename convention (default parser, configurable via --pattern):
    R000000314_20090220_20090115311983770_ES_1_003.png
    |patient_id|exam_date|   study_uid    |tag|ser|img#
So a single patient folder may hold MULTIPLE exams (different dates). Two units
matter and they are different:
  * exam_id  = patient_id + exam_date  -> the unit EGGIM is computed over
  * patient_id                          -> the unit train/val/test split uses
                                           (all of a patient's exams stay together)

Annotators fill `site`, `quality_ok`, and (later) `im_grade`. Pure standard
library so it runs anywhere, no ML stack needed.
"""
from __future__ import annotations

import argparse
import csv
import os
import re
from dataclasses import dataclass
from typing import List, Optional

_IMG_EXTS = (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff")

# Default filename parser. Groups are optional-friendly; non-matching names fall
# back to folder-derived patient_id and empty exam metadata.
DEFAULT_FILENAME_RE = re.compile(
    r"^(?P<patient_id>[A-Za-z]?\d+)_(?P<exam_date>\d{8})_(?P<study_uid>\d+)_"
    r"(?P<tag>[A-Za-z0-9]+)_(?P<series>\d+)_(?P<image_no>\d+)$"
)

MANIFEST_COLUMNS = [
    "image_path", "patient_id", "exam_id", "exam_date", "seq_index",
    "site", "quality_ok", "im_grade",   # <- to be filled by annotators
]


@dataclass
class ScaffoldStats:
    n_patients: int
    n_exams: int
    n_images: int
    n_parsed: int          # filenames that matched the pattern
    out_path: str


def _is_image(name: str) -> bool:
    return name.lower().endswith(_IMG_EXTS)


def parse_filename(name: str, pattern: re.Pattern = DEFAULT_FILENAME_RE) -> Optional[dict]:
    """Parse an image filename (without extension) into metadata, or None."""
    stem = os.path.splitext(name)[0]
    m = pattern.match(stem)
    return m.groupdict() if m else None


def build_rows(root: str, patient_from: str = "dir",
               pattern: re.Pattern = DEFAULT_FILENAME_RE) -> List[dict]:
    """Walk `root`; each immediate sub-directory is one patient by default.

    patient_from:
      "dir"      -> patient_id is the sub-folder name (default)
      "filename" -> flat folder; patient_id parsed from filename (or prefix)
    """
    raw: List[dict] = []  # collect with sort keys, assign seq per exam afterwards

    def add(path: str, folder_patient: Optional[str]):
        name = os.path.basename(path)
        meta = parse_filename(name, pattern)
        if meta:
            pid = folder_patient or meta["patient_id"]
            exam_date = meta["exam_date"]
            img_no = int(meta["image_no"])
        else:
            pid = folder_patient or name.split("_")[0] or "unknown"
            exam_date = ""
            img_no = None
        exam_id = f"{pid}_{exam_date}" if exam_date else pid
        raw.append({
            "image_path": path, "patient_id": pid, "exam_id": exam_id,
            "exam_date": exam_date, "img_no": img_no, "name": name,
            "parsed": meta is not None,
        })

    if patient_from == "filename":
        for f in sorted(os.listdir(root)):
            if _is_image(f):
                add(os.path.join(root, f), None)
    else:
        for entry in sorted(os.listdir(root)):
            pdir = os.path.join(root, entry)
            if not os.path.isdir(pdir):
                continue
            for dp, _, fs in os.walk(pdir):
                for f in fs:
                    if _is_image(f):
                        add(os.path.join(dp, f), entry)

    # seq_index runs within each exam, ordered by parsed image number then name.
    raw.sort(key=lambda r: (r["exam_id"], r["img_no"] if r["img_no"] is not None else 1e9, r["name"]))
    rows: List[dict] = []
    seq_by_exam: dict = {}
    for r in raw:
        seq = seq_by_exam[r["exam_id"]] = seq_by_exam.get(r["exam_id"], -1) + 1
        rows.append({
            "image_path": r["image_path"],
            "patient_id": r["patient_id"],
            "exam_id": r["exam_id"],
            "exam_date": r["exam_date"],
            "seq_index": seq,
            "site": "",          # antrum_lesser / antrum_greater / incisura / corpus_lesser / corpus_greater / other
            "quality_ok": "",    # 1 / 0
            "im_grade": "",      # 0 / 1 / 2  (blank if site is 'other' or quality is 0)
        })
    return rows


def scaffold(root: str, out: str, patient_from: str = "dir",
             pattern: re.Pattern = DEFAULT_FILENAME_RE) -> ScaffoldStats:
    rows = build_rows(root, patient_from=patient_from, pattern=pattern)
    with open(out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=MANIFEST_COLUMNS)
        w.writeheader()
        w.writerows(rows)
    # n_parsed: recompute cheaply from filenames
    n_parsed = sum(1 for r in rows if parse_filename(os.path.basename(r["image_path"]), pattern))
    return ScaffoldStats(
        n_patients=len({r["patient_id"] for r in rows}),
        n_exams=len({r["exam_id"] for r in rows}),
        n_images=len(rows),
        n_parsed=n_parsed,
        out_path=out,
    )


def main():
    ap = argparse.ArgumentParser(description="Scaffold an annotation manifest from an image dump")
    ap.add_argument("root", help="root folder (one sub-folder per patient, or a flat folder)")
    ap.add_argument("--out", default="manifest_to_label.csv")
    ap.add_argument("--patient-from", choices=["dir", "filename"], default="dir")
    ap.add_argument("--pattern", default=None,
                    help="custom filename regex with named groups (patient_id, exam_date, image_no)")
    args = ap.parse_args()
    pat = re.compile(args.pattern) if args.pattern else DEFAULT_FILENAME_RE
    s = scaffold(args.root, args.out, patient_from=args.patient_from, pattern=pat)
    print(f"wrote {s.out_path}")
    print(f"  {s.n_images} images | {s.n_patients} patients | {s.n_exams} exams "
          f"| {s.n_parsed}/{s.n_images} filenames parsed")
    if s.n_parsed < s.n_images:
        print("  (unparsed filenames fell back to folder-name patient_id, empty exam_date)")
    print("annotators fill: site, quality_ok, im_grade  |  EGGIM is aggregated per exam_id")


if __name__ == "__main__":
    main()
