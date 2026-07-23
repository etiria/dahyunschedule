"""Tests for the annotation-manifest scaffolder (pure-python)."""
import csv
import os
import sys
import tempfile

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from eggim.scaffold_manifest import MANIFEST_COLUMNS, build_rows, scaffold  # noqa: E402


def _make_tree(base):
    # two patients as sub-folders, with images in capture order
    for pid, n in (("P001", 3), ("P002", 2)):
        d = os.path.join(base, pid)
        os.makedirs(d)
        for i in range(n):
            open(os.path.join(d, f"{i:02d}.jpg"), "w").close()
        open(os.path.join(d, "notes.txt"), "w").close()  # non-image ignored


def test_dir_mode_groups_by_folder():
    with tempfile.TemporaryDirectory() as tmp:
        _make_tree(tmp)
        rows = build_rows(tmp, patient_from="dir")
        assert len(rows) == 5                                  # 3 + 2 images, txt ignored
        assert {r["patient_id"] for r in rows} == {"P001", "P002"}
        # seq_index restarts per patient and preserves order
        p1 = [r for r in rows if r["patient_id"] == "P001"]
        assert [r["seq_index"] for r in p1] == [0, 1, 2]
        # label columns present and empty
        for r in rows:
            assert r["site"] == "" and r["quality_ok"] == "" and r["im_grade"] == ""


def test_filename_mode_groups_by_prefix():
    with tempfile.TemporaryDirectory() as tmp:
        for name in ("P001_a.jpg", "P001_b.jpg", "P002_a.jpg", "skip.txt"):
            open(os.path.join(tmp, name), "w").close()
        rows = build_rows(tmp, patient_from="filename")
        assert len(rows) == 3
        assert sum(r["patient_id"] == "P001" for r in rows) == 2


def test_scaffold_writes_valid_csv():
    with tempfile.TemporaryDirectory() as tmp:
        _make_tree(tmp)
        out = os.path.join(tmp, "m.csv")
        stats = scaffold(tmp, out)
        assert stats.n_patients == 2 and stats.n_images == 5
        with open(out) as f:
            reader = csv.DictReader(f)
            assert reader.fieldnames == MANIFEST_COLUMNS
            assert len(list(reader)) == 5


if __name__ == "__main__":
    import traceback
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failed = 0
    for t in tests:
        try:
            t(); print(f"PASS {t.__name__}")
        except Exception:
            failed += 1; print(f"FAIL {t.__name__}"); traceback.print_exc()
    print(f"\n{len(tests) - failed}/{len(tests)} passed")
    sys.exit(1 if failed else 0)
