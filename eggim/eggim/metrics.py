"""Evaluation metrics for the two stages and the aggregated EGGIM.

Kept dependency-light: quadratic-weighted kappa and ICC-style agreement for the
final EGGIM are pure-python so you can report patient-level agreement against
expert EGGIM without a heavy stack. Classification metrics (AUROC etc.) live in
train.py where torch/sklearn are already imported.
"""
from __future__ import annotations

from typing import Sequence


def site_error_breakdown(true_sites: Sequence[str], pred_sites: Sequence[str]) -> dict:
    """Split site-classifier error into region errors vs curvature-only errors.

    The key diagnostic for EGGIM: distinguishing antrum/incisura/corpus is easy,
    but lesser-vs-greater curvature within a region is hard from a single frame.
    Returns fine (5+other-way) accuracy, coarse (region) accuracy, and the share
    of mistakes that are *only* curvature confusion (region correct, side wrong).
    """
    from .config import SITE_TO_REGION

    n = len(true_sites)
    if n == 0:
        return {"n": 0}
    fine_correct = region_correct = curvature_only_error = region_error = 0
    for t, p in zip(true_sites, pred_sites):
        if t == p:
            fine_correct += 1
            region_correct += 1
            continue
        tr, pr = SITE_TO_REGION.get(t, "other"), SITE_TO_REGION.get(p, "other")
        if tr == pr:
            region_correct += 1          # right region, wrong curvature
            curvature_only_error += 1
        else:
            region_error += 1            # wrong region entirely
    n_err = n - fine_correct
    return {
        "n": n,
        "fine_accuracy": fine_correct / n,
        "region_accuracy": region_correct / n,
        "n_errors": n_err,
        "curvature_only_errors": curvature_only_error,
        "region_errors": region_error,
        # of all mistakes, what fraction is merely lesser/greater confusion
        "curvature_share_of_errors": (curvature_only_error / n_err) if n_err else 0.0,
    }


def confusion_matrix(y_true: Sequence[int], y_pred: Sequence[int], n: int):
    m = [[0] * n for _ in range(n)]
    for t, p in zip(y_true, y_pred):
        m[t][p] += 1
    return m


def quadratic_weighted_kappa(y_true: Sequence[int], y_pred: Sequence[int], n_classes: int) -> float:
    """Cohen's kappa with quadratic weights — the standard for ordinal grades
    (IM 0/1/2) and for comparing predicted vs expert EGGIM buckets."""
    O = confusion_matrix(y_true, y_pred, n_classes)
    N = len(y_true)
    if N == 0:
        return float("nan")
    row = [sum(O[i]) for i in range(n_classes)]
    col = [sum(O[i][j] for i in range(n_classes)) for j in range(n_classes)]
    num = den = 0.0
    for i in range(n_classes):
        for j in range(n_classes):
            w = ((i - j) ** 2) / ((n_classes - 1) ** 2)
            e = row[i] * col[j] / N
            num += w * O[i][j]
            den += w * e
    return 1.0 - num / den if den else 1.0


def mae(y_true: Sequence[float], y_pred: Sequence[float]) -> float:
    if not y_true:
        return float("nan")
    return sum(abs(a - b) for a, b in zip(y_true, y_pred)) / len(y_true)


def within_one_accuracy(y_true: Sequence[int], y_pred: Sequence[int]) -> float:
    """Fraction of patients whose predicted EGGIM is within +/-1 of expert —
    a clinically forgiving readout that pairs well with exact agreement."""
    if not y_true:
        return float("nan")
    return sum(abs(a - b) <= 1 for a, b in zip(y_true, y_pred)) / len(y_true)


def high_risk_confusion(y_true: Sequence[int], y_pred: Sequence[int], threshold: int = 5):
    """2x2 for the binary EGGIM>=threshold decision -> sens/spec/PPV/NPV."""
    tp = fp = tn = fn = 0
    for t, p in zip(y_true, y_pred):
        th, ph = t >= threshold, p >= threshold
        tp += th and ph
        tn += (not th) and (not ph)
        fp += (not th) and ph
        fn += th and (not ph)
    def _safe(a, b):
        return a / b if b else float("nan")
    return {
        "sensitivity": _safe(tp, tp + fn),
        "specificity": _safe(tn, tn + fp),
        "ppv": _safe(tp, tp + fp),
        "npv": _safe(tn, tn + fn),
        "tp": tp, "fp": fp, "tn": tn, "fn": fn,
    }
