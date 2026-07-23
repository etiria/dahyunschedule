"""Evaluation metrics for the two stages and the aggregated EGGIM.

Kept dependency-light: quadratic-weighted kappa and ICC-style agreement for the
final EGGIM are pure-python so you can report patient-level agreement against
expert EGGIM without a heavy stack. Classification metrics (AUROC etc.) live in
train.py where torch/sklearn are already imported.
"""
from __future__ import annotations

from typing import Sequence


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
