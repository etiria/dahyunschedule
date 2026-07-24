"""Tests for the annotation-manifest scaffolder (pure-python)."""
import csv
import os
import sys
import tempfile

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from eggim.scaffold_manifest import (  # noqa: E402
    MANIFEST_COLUMNS,
    build_rows,
    parse_filename,
    scaffold,
)

# a real filename from the EGD_2026_images_PNG export
REAL = "R000000314_20090220_20090115311983770_ES_1_003.png"


def test_parse_real_filename():
    m = parse_filename(REAL)
    assert m is not None
    assert m["patient_id"] == "R000000314"
    assert m["exam_date"] == "20090220"
    assert m["study_uid"] == "20090115311983770"
    assert m["tag"] == "ES"
    assert m["image_no"] == "003"


def test_parse_rejects_garbage():
    assert parse_filename("random_photo.png") is None


def _make_patient_tree(base):
    """Two patients; patient R000000314 has TWO exams on different dates."""
    layout = {
        "R000000314": [
            "R000000314_20090220_20090115311983770_ES_1_001.png",
            "R000000314_20090220_20090115311983770_ES_1_003.png",
            "R000000314_20090220_20090115311983770_ES_1_002.png",
            "R000000314_20150612_20150106311983770_ES_1_001.png",  # a later exam
            "R000000314_20150612_20150106311983770_ES_1_002.png",
        ],
        "R000000999": [
            "R000000999_20180101_20180101999999999_ES_1_001.png",
        ],
    }
    for pid, files in layout.items():
        d = os.path.join(base, pid)
        os.makedirs(d)
        for f in files:
            open(os.path.join(d, f), "w").close()
        open(os.path.join(d, "readme.txt"), "w").close()  # ignored


def test_patient_and_exam_units():
    with tempfile.TemporaryDirectory() as tmp:
        _make_patient_tree(tmp)
        rows = build_rows(tmp)
        assert len(rows) == 6                                   # txt ignored
        # patient split key: 2 patients
        assert {r["patient_id"] for r in rows} == {"R000000314", "R000000999"}
        # aggregation unit: 3 distinct exams (314 has two dates, 999 has one)
        assert len({r["exam_id"] for r in rows}) == 3
        assert "R000000314_20090220" in {r["exam_id"] for r in rows}
        assert "R000000314_20150612" in {r["exam_id"] for r in rows}


def test_seq_index_orders_within_exam_by_image_no():
    with tempfile.TemporaryDirectory() as tmp:
        _make_patient_tree(tmp)
        rows = build_rows(tmp)
        exam = [r for r in rows if r["exam_id"] == "R000000314_20090220"]
        exam.sort(key=lambda r: r["seq_index"])
        # seq should be 0,1,2 following image_no 001,002,003 (not file listing order)
        assert [r["seq_index"] for r in exam] == [0, 1, 2]
        last = [r for r in exam if r["seq_index"] == 2][0]
        assert last["image_path"].endswith("_003.png")


def test_label_columns_present_and_empty():
    with tempfile.TemporaryDirectory() as tmp:
        _make_patient_tree(tmp)
        for r in build_rows(tmp):
            assert r["site"] == "" and r["quality_ok"] == "" and r["im_grade"] == ""


def test_scaffold_writes_valid_csv():
    with tempfile.TemporaryDirectory() as tmp:
        _make_patient_tree(tmp)
        out = os.path.join(tmp, "m.csv")
        stats = scaffold(tmp, out)
        assert stats.n_patients == 2
        assert stats.n_exams == 3
        assert stats.n_images == 6
        assert stats.n_parsed == 6
        with open(out) as f:
            reader = csv.DictReader(f)
            assert reader.fieldnames == MANIFEST_COLUMNS
            assert len(list(reader)) == 6


def test_unparsed_falls_back_to_folder():
    with tempfile.TemporaryDirectory() as tmp:
        d = os.path.join(tmp, "P001")
        os.makedirs(d)
        open(os.path.join(d, "00.png"), "w").close()
        open(os.path.join(d, "01.png"), "w").close()
        rows = build_rows(tmp)
        assert len(rows) == 2
        assert all(r["patient_id"] == "P001" for r in rows)
        assert all(r["exam_date"] == "" for r in rows)      # no date parsed
        assert all(r["exam_id"] == "P001" for r in rows)    # exam falls back to patient


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
