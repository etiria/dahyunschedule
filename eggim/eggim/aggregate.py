"""EGGIM aggregation logic.

This is the clinically important, deterministic part of the pipeline: given
per-image predictions (which site, whether the image is usable, and the IM
grade), decide each area's grade and sum them into an EGGIM score.

Intentionally free of torch/numpy so it can be unit-tested in isolation and
audited by clinicians without a deep-learning stack.

Design decisions worth reviewing clinically:
  * A site's grade defaults to the MOST SEVERE confidently-graded image in that
    area ("max_supported"). Rationale: EGGIM asks whether IM is present/extensive
    in the area, so the worst adequate view governs. This is sensitive to false
    positives, hence the confidence gate on grading.
  * If no qualifying image exists for one of the five areas, the exam is flagged
    INCOMPLETE and the total is reported as a lower bound, never as a final
    EGGIM. A partial score must not be mistaken for a validated one.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence, Tuple

from .config import (
    EGGIM_HIGH_RISK_THRESHOLD,
    EGGIM_SITES,
    IM_GRADES,
    MAX_EGGIM,
    NON_TARGET_SITE,
)


@dataclass
class ImagePrediction:
    """Model outputs for a single endoscopic image."""
    image_id: str
    site: str                       # predicted site (an EGGIM site or NON_TARGET_SITE)
    site_confidence: float          # softmax prob of the predicted site
    quality_ok: bool                # passed the quality/adequacy gate
    im_grade: int                   # argmax IM grade in {0,1,2}
    im_grade_probs: Sequence[float] # per-grade probabilities [p0, p1, p2]
    im_confidence: float            # prob of the predicted grade


@dataclass
class SiteResult:
    site: str
    score: Optional[int]            # 0/1/2, or None if the area was not assessed
    assessed: bool
    contributing_image_ids: List[str] = field(default_factory=list)
    n_candidate_images: int = 0     # images assigned to this site before grade gating


@dataclass
class EggimResult:
    per_site: Dict[str, SiteResult]
    total: Optional[int]            # final EGGIM (0-10) only when complete, else None
    total_lower_bound: int          # sum of assessed areas (partial)
    is_complete: bool               # all five areas assessed
    high_risk: Optional[bool]       # total >= threshold, only when complete
    n_assessed_sites: int

    def summary(self) -> str:
        parts = []
        for s in EGGIM_SITES:
            r = self.per_site[s]
            parts.append(f"{s}={r.score if r.assessed else '—'}")
        if self.is_complete:
            head = f"EGGIM={self.total}/{MAX_EGGIM} ({'HIGH' if self.high_risk else 'low'} risk)"
        else:
            head = (f"EGGIM incomplete: {self.n_assessed_sites}/{len(EGGIM_SITES)} areas, "
                    f">= {self.total_lower_bound}")
        return head + "  [" + ", ".join(parts) + "]"


def _site_score_max_supported(
    grades_with_conf: List[Tuple[int, float]], im_conf_threshold: float
) -> Tuple[Optional[int], bool]:
    """Most severe grade among images whose grade confidence clears the gate."""
    supported = [g for (g, c) in grades_with_conf if c >= im_conf_threshold]
    if not supported:
        return None, False
    return max(supported), True


def _site_score_mean_argmax(
    prob_vectors: List[Sequence[float]],
) -> Tuple[Optional[int], bool]:
    """Argmax of the averaged per-grade probability vectors."""
    if not prob_vectors:
        return None, False
    n = len(prob_vectors)
    mean = [sum(v[g] for v in prob_vectors) / n for g in range(len(IM_GRADES))]
    return max(range(len(mean)), key=lambda g: mean[g]), True


def compute_eggim(
    predictions: Sequence[ImagePrediction],
    *,
    site_conf_threshold: float = 0.60,
    im_conf_threshold: float = 0.50,
    aggregation: str = "max_supported",
    min_images_per_site: int = 1,
) -> EggimResult:
    """Aggregate per-image predictions into an EGGIM score.

    Steps:
      1. Keep only quality-adequate images confidently assigned to an EGGIM area.
      2. For each of the five areas, derive a 0/1/2 grade from its images.
      3. An area with too few qualifying images is 'not assessed'.
      4. Sum assessed areas; report a final EGGIM only if all five are assessed.
    """
    if aggregation not in ("max_supported", "mean_argmax"):
        raise ValueError(f"unknown aggregation: {aggregation}")

    # Bucket qualifying images by site.
    by_site: Dict[str, List[ImagePrediction]] = {s: [] for s in EGGIM_SITES}
    for p in predictions:
        if p.site == NON_TARGET_SITE:
            continue
        if p.site not in by_site:
            continue  # unknown label, ignore defensively
        if not p.quality_ok:
            continue
        if p.site_confidence < site_conf_threshold:
            continue
        by_site[p.site].append(p)

    per_site: Dict[str, SiteResult] = {}
    for site in EGGIM_SITES:
        candidates = by_site[site]
        n_candidates = len(candidates)

        if n_candidates < min_images_per_site:
            per_site[site] = SiteResult(site, None, False, [], n_candidates)
            continue

        if aggregation == "max_supported":
            score, ok = _site_score_max_supported(
                [(c.im_grade, c.im_confidence) for c in candidates], im_conf_threshold
            )
            contributing = (
                [c.image_id for c in candidates
                 if c.im_confidence >= im_conf_threshold and c.im_grade == score]
                if ok else []
            )
        else:  # mean_argmax
            score, ok = _site_score_mean_argmax([c.im_grade_probs for c in candidates])
            contributing = [c.image_id for c in candidates] if ok else []

        per_site[site] = SiteResult(
            site=site,
            score=score if ok else None,
            assessed=ok,
            contributing_image_ids=contributing,
            n_candidate_images=n_candidates,
        )

    assessed = [r for r in per_site.values() if r.assessed]
    n_assessed = len(assessed)
    lower_bound = sum(r.score for r in assessed)  # type: ignore[misc]
    is_complete = n_assessed == len(EGGIM_SITES)
    total = lower_bound if is_complete else None
    high_risk = (total >= EGGIM_HIGH_RISK_THRESHOLD) if total is not None else None

    return EggimResult(
        per_site=per_site,
        total=total,
        total_lower_bound=lower_bound,
        is_complete=is_complete,
        high_risk=high_risk,
        n_assessed_sites=n_assessed,
    )
