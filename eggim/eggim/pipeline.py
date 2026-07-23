"""End-to-end inference: a folder of endoscopic images -> an EGGIM score.

    dump of images
        -> SiteClassifier  (site + quality gate)      [stage 1]
        -> IMGrader        (grade adequate area views) [stage 2]
        -> compute_eggim   (aggregate to 0-10)         [deterministic]

This is the object a clinician-facing app or batch job would call. Model loading
is lazy and torch-only; the aggregation step is the tested pure-python core.
"""
from __future__ import annotations

import glob
import os
from typing import List, Sequence

from .aggregate import EggimResult, ImagePrediction, compute_eggim
from .config import PipelineConfig, SITE_CLASSES

_IMG_EXTS = (".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff")


class EggimPipeline:
    def __init__(self, site_ckpt: str, grade_ckpt: str, cfg: PipelineConfig | None = None):
        # Imported here so aggregation/tests never require torch.
        import torch
        from .data import build_transforms
        from .models import IMGrader, SiteClassifier, load_checkpoint

        self.cfg = cfg or PipelineConfig()
        self.torch = torch
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tf = build_transforms(self.cfg.model.img_size, train=False)

        self.site_model = load_checkpoint(SiteClassifier(self.cfg.model), site_ckpt).to(self.device)
        self.grade_model = load_checkpoint(IMGrader(self.cfg.model), grade_ckpt).to(self.device)

    # -- per-image inference --------------------------------------------------

    def _predict_image(self, path: str) -> ImagePrediction:
        from PIL import Image

        x = self.tf(Image.open(path).convert("RGB")).unsqueeze(0).to(self.device)
        with self.torch.no_grad():
            site_logits, quality_logit = self.site_model(x)
            site_probs = self.torch.softmax(site_logits, dim=1)[0]
            site_idx = int(site_probs.argmax())
            site = SITE_CLASSES[site_idx]
            site_conf = float(site_probs[site_idx])
            quality_ok = bool(self.torch.sigmoid(quality_logit)[0] > 0.5)

            grade_logits = self.grade_model(x)
            grade_probs = self.torch.softmax(grade_logits, dim=1)[0]
            grade = int(grade_probs.argmax())
            grade_conf = float(grade_probs[grade])

        return ImagePrediction(
            image_id=os.path.basename(path),
            site=site,
            site_confidence=site_conf,
            quality_ok=quality_ok,
            im_grade=grade,
            im_grade_probs=[float(p) for p in grade_probs],
            im_confidence=grade_conf,
        )

    # -- patient-level scoring ------------------------------------------------

    def predict_images(self, paths: Sequence[str]) -> List[ImagePrediction]:
        return [self._predict_image(p) for p in paths]

    def score_folder(self, folder: str) -> EggimResult:
        """Score every image in a folder (one patient's study) into an EGGIM."""
        paths = sorted(
            p for p in glob.glob(os.path.join(folder, "**", "*"), recursive=True)
            if p.lower().endswith(_IMG_EXTS)
        )
        if not paths:
            raise FileNotFoundError(f"no images found under {folder}")
        return self.score_predictions(self.predict_images(paths))

    def score_predictions(self, preds: Sequence[ImagePrediction]) -> EggimResult:
        return compute_eggim(
            preds,
            site_conf_threshold=self.cfg.site_conf_threshold,
            im_conf_threshold=self.cfg.im_conf_threshold,
            aggregation=self.cfg.aggregation,
            min_images_per_site=self.cfg.min_images_per_site,
        )
