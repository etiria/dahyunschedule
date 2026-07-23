"""End-to-end demo that runs WITHOUT a GPU or the ML stack.

It fabricates a cohort (a 'dump' of labeled images per patient), simulates an
imperfect model by adding realistic noise to the site/quality/grade labels, then
runs the exact production aggregation (`compute_eggim`) to turn each patient's
image dump into an EGGIM score. Finally it compares the predicted EGGIM against
the ground-truth ('expert') EGGIM to show the reporting metrics.

Purpose: prove the filter -> grade -> aggregate flow and the reporting are wired
correctly before any real images or trained weights exist. Swap the simulated
predictions for `EggimPipeline.predict_images(...)` once you have checkpoints.

    python3 demo.py
"""
from __future__ import annotations

import random

from eggim.aggregate import ImagePrediction, compute_eggim
from eggim.config import EGGIM_SITES, IM_GRADES, NON_TARGET_SITE, SITE_CLASSES
from eggim.data import synthetic_manifest
from eggim.metrics import high_risk_confusion, quadratic_weighted_kappa, within_one_accuracy


def _grade_probs(grade: int, conf: float):
    probs = [(1 - conf) / 2] * 3
    probs[grade] = conf
    return probs


def simulate_prediction(row, rng, site_err=0.1, grade_err=0.15) -> ImagePrediction:
    """Turn a ground-truth manifest row into a *noisy* model prediction."""
    # site: occasionally misclassified
    true_site = row.site
    if rng.random() < site_err:
        site = rng.choice(SITE_CLASSES)
    else:
        site = true_site
    site_conf = rng.uniform(0.62, 0.98) if site == true_site else rng.uniform(0.40, 0.75)

    quality_ok = row.quality_ok and rng.random() > 0.05

    true_grade = row.im_grade if row.im_grade is not None else 0
    if rng.random() < grade_err:
        grade = min(2, max(0, true_grade + rng.choice([-1, 1])))
    else:
        grade = true_grade
    grade_conf = rng.uniform(0.55, 0.97)

    return ImagePrediction(
        image_id=row.image_path,
        site=site,
        site_confidence=site_conf,
        quality_ok=quality_ok,
        im_grade=grade,
        im_grade_probs=_grade_probs(grade, grade_conf),
        im_confidence=grade_conf,
    )


def expert_eggim(rows):
    """Ground-truth EGGIM straight from labels (worst adequate view per area)."""
    preds = [
        ImagePrediction(r.image_path, r.site, 1.0, r.quality_ok,
                        r.im_grade if r.im_grade is not None else 0,
                        _grade_probs(r.im_grade if r.im_grade is not None else 0, 1.0), 1.0)
        for r in rows
    ]
    return compute_eggim(preds)


def main():
    rng = random.Random(7)
    rows = synthetic_manifest(n_patients=200, seed=1)

    # group rows by patient
    by_patient = {}
    for r in rows:
        by_patient.setdefault(r.patient_id, []).append(r)

    true_scores, pred_scores = [], []
    complete_match = 0
    n_complete = 0
    examples = []

    for pid, prows in by_patient.items():
        gt = expert_eggim(prows)
        model_preds = [simulate_prediction(r, rng) for r in prows]
        pred = compute_eggim(model_preds)

        if gt.is_complete and pred.is_complete:
            n_complete += 1
            true_scores.append(gt.total)
            pred_scores.append(pred.total)
            complete_match += int(gt.total == pred.total)
        if len(examples) < 4:
            examples.append((pid, gt, pred))

    print("=== EGGIM pipeline demo (simulated model, real aggregation) ===\n")
    print(f"patients: {len(by_patient)} | evaluable (both exams complete): {n_complete}\n")

    for pid, gt, pred in examples:
        print(f"  {pid}")
        print(f"    expert : {gt.summary()}")
        print(f"    model  : {pred.summary()}")

    print("\n=== agreement on complete exams ===")
    print(f"exact EGGIM match      : {complete_match}/{n_complete} "
          f"({100*complete_match/max(n_complete,1):.1f}%)")
    print(f"within +/-1            : {100*within_one_accuracy(true_scores, pred_scores):.1f}%")
    print(f"quadratic-weighted kappa: {quadratic_weighted_kappa([min(t,10) for t in true_scores], [min(p,10) for p in pred_scores], 11):.3f}")
    hr = high_risk_confusion(true_scores, pred_scores, threshold=5)
    print(f"high-risk (>=5) sens/spec: {hr['sensitivity']:.2f} / {hr['specificity']:.2f} "
          f"(PPV {hr['ppv']:.2f}, NPV {hr['npv']:.2f})")
    print("\nNote: numbers here reflect INJECTED noise, not a real model. They only")
    print("prove the filter->grade->aggregate->report path runs end to end.")


if __name__ == "__main__":
    main()
