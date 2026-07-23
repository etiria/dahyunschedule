"""Tests for site-classifier error breakdown (region vs curvature)."""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from eggim.metrics import site_error_breakdown  # noqa: E402


def test_perfect():
    t = ["antrum_lesser", "corpus_greater", "incisura", "other"]
    r = site_error_breakdown(t, list(t))
    assert r["fine_accuracy"] == 1.0
    assert r["region_accuracy"] == 1.0
    assert r["n_errors"] == 0
    assert r["curvature_share_of_errors"] == 0.0


def test_curvature_only_error():
    # region always right, curvature always wrong
    t = ["antrum_lesser", "corpus_lesser"]
    p = ["antrum_greater", "corpus_greater"]
    r = site_error_breakdown(t, p)
    assert r["fine_accuracy"] == 0.0
    assert r["region_accuracy"] == 1.0          # region still correct
    assert r["curvature_only_errors"] == 2
    assert r["region_errors"] == 0
    assert r["curvature_share_of_errors"] == 1.0


def test_region_error():
    t = ["antrum_lesser", "corpus_lesser"]
    p = ["corpus_greater", "antrum_greater"]    # wrong region entirely
    r = site_error_breakdown(t, p)
    assert r["region_accuracy"] == 0.0
    assert r["region_errors"] == 2
    assert r["curvature_only_errors"] == 0


def test_mixed():
    t = ["antrum_lesser", "antrum_greater", "corpus_lesser", "incisura"]
    p = ["antrum_lesser",  # correct
         "antrum_lesser",  # curvature-only error
         "corpus_greater",  # curvature-only error
         "corpus_lesser"]  # region error
    r = site_error_breakdown(t, p)
    assert r["fine_accuracy"] == 0.25
    assert r["n_errors"] == 3
    assert r["curvature_only_errors"] == 2
    assert r["region_errors"] == 1
    assert abs(r["curvature_share_of_errors"] - 2 / 3) < 1e-9


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
