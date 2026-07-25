"""Central configuration and clinical constants for the EGGIM pipeline.

EGGIM (Endoscopic Grading of Gastric Intestinal Metaplasia) assesses intestinal
metaplasia (IM) in five gastric areas. Each area is graded 0/1/2, so the total
score ranges 0-10. EGGIM >= 5 identifies high-risk patients (correlates with
extensive IM / high-stage OLGIM).

Per-area grade definition (Marcos-Pinto / Esposito):
    0 = no IM
    1 = focal IM  (<= 30% of the area)
    2 = extensive IM (> 30% of the area)

Keeping these definitions in one place so the model heads, the aggregation
logic, and the reports never drift apart.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

# --- Clinical constants -----------------------------------------------------

# Canonical five EGGIM anatomical areas (order is fixed and used everywhere).
EGGIM_SITES: List[str] = [
    "antrum_lesser",   # 전정부 소만
    "antrum_greater",  # 전정부 대만
    "incisura",        # 각부
    "corpus_lesser",   # 체부 소만
    "corpus_greater",  # 체부 대만
]

# Cardia retroflexion ("U-turn") view — a key view for Kimura-Takemoto, not an
# EGGIM scoring area but a first-class localization class for the site model.
CARDIA_UTURN = "cardia_uturn"

# The site classifier also needs a bucket for images that are NOT one of the
# scoring areas / named views (esophagus, duodenum, out-of-focus, etc).
NON_TARGET_SITE = "other"
SITE_CLASSES: List[str] = EGGIM_SITES + [CARDIA_UTURN, NON_TARGET_SITE]

# Coarse anatomical region. Region (antrum vs incisura vs corpus) is visually
# separable from a single frame; the lesser-vs-greater CURVATURE split inside a
# region is the genuinely hard part. Grouping to region lets us measure how much
# site-classifier error is "just" curvature confusion vs true region mistakes,
# and supports a two-stage (region -> curvature) classifier if needed.
REGIONS: List[str] = ["antrum", "incisura", "corpus", "other"]
SITE_TO_REGION = {
    "antrum_lesser": "antrum",
    "antrum_greater": "antrum",
    "incisura": "incisura",
    "corpus_lesser": "corpus",
    "corpus_greater": "corpus",
    NON_TARGET_SITE: "other",
}

# IM grade labels for a single area.
IM_GRADES: List[int] = [0, 1, 2]
MAX_SITE_SCORE = 2
MAX_EGGIM = MAX_SITE_SCORE * len(EGGIM_SITES)  # 10

# High-risk threshold used for the binary clinical readout.
EGGIM_HIGH_RISK_THRESHOLD = 5


# --- Runtime configuration --------------------------------------------------

@dataclass
class ModelConfig:
    backbone: str = "convnext_tiny"   # any timm model name
    pretrained: bool = True
    img_size: int = 320
    dropout: float = 0.2


@dataclass
class TrainConfig:
    epochs: int = 30
    batch_size: int = 32
    lr: float = 3e-4
    weight_decay: float = 1e-4
    num_workers: int = 4
    # Patient-level split is enforced by the dataset, not here, to avoid leakage.
    seed: int = 42


@dataclass
class PipelineConfig:
    """Decision thresholds for turning raw model outputs into an EGGIM score."""
    # An image must be assigned to a site with at least this confidence to be
    # considered for that area's score. Low-confidence images are dropped.
    site_conf_threshold: float = 0.60
    # An IM grade prediction below this confidence is treated as unreliable and
    # ignored during aggregation (prevents a single noisy image inflating a site).
    im_conf_threshold: float = 0.50
    # How a site's final grade is derived from its qualifying images.
    #   "max_supported" : most severe grade among confidently-graded images
    #   "mean_argmax"   : argmax of the averaged grade-probability vectors
    aggregation: str = "max_supported"
    # Minimum number of qualifying images required for a site to count as
    # "assessed". EGGIM needs every area; missing areas make the exam incomplete.
    min_images_per_site: int = 1

    model: ModelConfig = field(default_factory=ModelConfig)
