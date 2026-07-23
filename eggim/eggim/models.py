"""Neural network heads for the two learned stages of the EGGIM pipeline.

Stage 1 - SiteClassifier: which of the five EGGIM areas an image shows (or
           'other'), plus a quality/adequacy head that gates unusable frames.
Stage 2 - IMGrader: intestinal-metaplasia grade (0/1/2) for an adequate,
           site-assigned image.

Both wrap a shared timm backbone so you can swap architectures from config
(convnext_tiny, efficientnet_b3, vit_small_patch16_224, ...). Requires torch +
timm; these are only needed for training/inference, not for the aggregation
logic or its tests.
"""
from __future__ import annotations

from typing import Tuple

try:
    import torch
    import torch.nn as nn
    import timm
except ImportError as e:  # pragma: no cover - only hit without the ML stack
    raise ImportError(
        "models.py needs torch and timm. Install with: pip install -r requirements.txt"
    ) from e

from .config import IM_GRADES, ModelConfig, SITE_CLASSES


def _build_backbone(cfg: ModelConfig) -> Tuple[nn.Module, int]:
    """Create a timm backbone returning pooled features; return (module, dim)."""
    backbone = timm.create_model(
        cfg.backbone,
        pretrained=cfg.pretrained,
        num_classes=0,      # remove classifier -> pooled feature vector
        global_pool="avg",
    )
    feat_dim = backbone.num_features
    return backbone, feat_dim


class SiteClassifier(nn.Module):
    """Predicts the anatomical site (6-way) and an adequacy/quality flag.

    The quality head is a separate binary output rather than a 7th site class so
    that 'this is the antrum but the view is unusable' stays expressible.
    """

    def __init__(self, cfg: ModelConfig):
        super().__init__()
        self.backbone, feat = _build_backbone(cfg)
        self.drop = nn.Dropout(cfg.dropout)
        self.site_head = nn.Linear(feat, len(SITE_CLASSES))
        self.quality_head = nn.Linear(feat, 1)  # logit: 1 = adequate

    def forward(self, x):
        f = self.drop(self.backbone(x))
        return self.site_head(f), self.quality_head(f).squeeze(-1)


class IMGrader(nn.Module):
    """Predicts the IM grade (0/1/2) for a single area image."""

    def __init__(self, cfg: ModelConfig):
        super().__init__()
        self.backbone, feat = _build_backbone(cfg)
        self.drop = nn.Dropout(cfg.dropout)
        self.grade_head = nn.Linear(feat, len(IM_GRADES))

    def forward(self, x):
        return self.grade_head(self.drop(self.backbone(x)))


def load_checkpoint(model: nn.Module, path: str, map_location="cpu") -> nn.Module:
    state = torch.load(path, map_location=map_location)
    state = state.get("model", state)
    model.load_state_dict(state)
    model.eval()
    return model
