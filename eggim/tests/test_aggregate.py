"""Unit tests for the EGGIM aggregation logic (pure-python, no ML deps needed)."""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from eggim.aggregate import ImagePrediction, compute_eggim  # noqa: E402
from eggim.config import EGGIM_SITES  # noqa: E402


def _img(image_id, site, grade, site_conf=0.9, im_conf=0.9, quality_ok=True):
    probs = [0.0, 0.0, 0.0]
    probs[grade] = im_conf
    # distribute the remainder so the vector sums to 1 (only matters for mean_argmax)
    rem = (1.0 - im_conf) / 2
    for g in range(3):
        if g != grade:
            probs[g] = rem
    return ImagePrediction(image_id, site, site_conf, quality_ok, grade, probs, im_conf)


def _one_per_site(grades):
    """One image per area with the given grades (len 5)."""
    return [_img(f"img_{s}", s, g) for s, g in zip(EGGIM_SITES, grades)]


def test_complete_exam_sums_correctly():
    preds = _one_per_site([2, 1, 0, 2, 1])  # sum = 6
    r = compute_eggim(preds)
    assert r.is_complete
    assert r.total == 6
    assert r.high_risk is True  # >= 5
    assert r.n_assessed_sites == 5


def test_low_score_not_high_risk():
    r = compute_eggim(_one_per_site([1, 0, 0, 1, 0]))  # sum = 2
    assert r.is_complete
    assert r.total == 2
    assert r.high_risk is False


def test_missing_site_makes_exam_incomplete():
    preds = _one_per_site([2, 2, 2, 2, 2])
    # drop the corpus_greater image entirely
    preds = [p for p in preds if p.site != "corpus_greater"]
    r = compute_eggim(preds)
    assert not r.is_complete
    assert r.total is None                 # never report a final score when incomplete
    assert r.total_lower_bound == 8        # 4 areas x 2
    assert r.high_risk is None
    assert not r.per_site["corpus_greater"].assessed


def test_max_supported_takes_worst_view():
    # Same area, three views of differing severity -> worst adequate view wins.
    preds = _one_per_site([0, 0, 0, 0, 0])
    preds.append(_img("antrum_worse", "antrum_lesser", 2))
    r = compute_eggim(preds)
    assert r.per_site["antrum_lesser"].score == 2


def test_low_grade_confidence_is_ignored():
    # A severe-but-unconfident grade should not inflate the site.
    preds = _one_per_site([0, 0, 0, 0, 0])
    preds.append(_img("noisy", "antrum_lesser", 2, im_conf=0.30))  # below default gate
    r = compute_eggim(preds)
    assert r.per_site["antrum_lesser"].score == 0


def test_low_site_confidence_image_dropped():
    preds = _one_per_site([1, 1, 1, 1, 1])
    # an image weakly assigned to a site must not create/alter scoring
    preds.append(_img("weak", "incisura", 2, site_conf=0.40))
    r = compute_eggim(preds)
    assert r.per_site["incisura"].score == 1  # unchanged


def test_poor_quality_excluded():
    preds = _one_per_site([0, 0, 0, 0, 0])
    preds.append(_img("blurry", "corpus_lesser", 2, quality_ok=False))
    r = compute_eggim(preds)
    assert r.per_site["corpus_lesser"].score == 0


def test_non_target_images_ignored():
    preds = _one_per_site([1, 1, 1, 1, 1])
    preds.append(_img("duodenum", "other", 2))
    r = compute_eggim(preds)
    assert r.total == 5
    assert r.is_complete


def test_mean_argmax_aggregation():
    preds = _one_per_site([0, 0, 0, 0, 0])
    # two confident grade-2 views vs one grade-0 -> mean argmax should be 2
    preds.append(_img("a", "antrum_lesser", 2, im_conf=0.95))
    preds.append(_img("b", "antrum_lesser", 2, im_conf=0.95))
    r = compute_eggim(preds, aggregation="mean_argmax")
    assert r.per_site["antrum_lesser"].score == 2


def test_min_images_per_site_gate():
    preds = _one_per_site([2, 2, 2, 2, 2])
    r = compute_eggim(preds, min_images_per_site=2)  # each site has only 1 image
    assert not r.is_complete
    assert r.n_assessed_sites == 0


if __name__ == "__main__":
    import traceback

    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"PASS {t.__name__}")
        except Exception:
            failed += 1
            print(f"FAIL {t.__name__}")
            traceback.print_exc()
    print(f"\n{len(tests) - failed}/{len(tests)} passed")
    sys.exit(1 if failed else 0)
