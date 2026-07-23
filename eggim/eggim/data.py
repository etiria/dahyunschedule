"""Datasets, transforms, and a patient-level splitter.

Two supervised datasets mirror the two learned stages:
  * SiteDataset   -> (image, site_label, quality_label)
  * GradeDataset  -> (image, im_grade_label)   [adequate, site-assigned images]

Both read a manifest (list of dicts / a CSV loaded elsewhere). The manifest MUST
carry a `patient_id` so splits never put the same patient in train and test —
the most common and damaging leakage in endoscopy AI.

Plug your hospital export in by producing manifest rows of the shape documented
in `ManifestRow`. A synthetic generator is provided so the whole pipeline runs
end-to-end before any real data arrives.
"""
from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional, Sequence, Tuple

from .config import EGGIM_SITES, IM_GRADES, SITE_CLASSES

# torch/PIL are optional so this module can be imported for the manifest utils
# (split, synthetic generation) without the full ML stack.
try:
    import torch
    from torch.utils.data import Dataset
    from PIL import Image
    import torchvision.transforms as T
    _HAS_TORCH = True
except ImportError:  # pragma: no cover
    _HAS_TORCH = False
    Dataset = object  # type: ignore


@dataclass
class ManifestRow:
    """One labeled image. `im_grade` may be None for site-only labeled data."""
    image_path: str
    patient_id: str
    site: str                 # one of SITE_CLASSES
    quality_ok: bool
    im_grade: Optional[int]   # 0/1/2 or None


# --- Patient-level splitting -------------------------------------------------

def split_by_patient(
    rows: Sequence[ManifestRow],
    ratios: Tuple[float, float, float] = (0.7, 0.15, 0.15),
    seed: int = 42,
) -> Dict[str, List[ManifestRow]]:
    """Split rows into train/val/test WITHOUT splitting any patient across sets."""
    assert abs(sum(ratios) - 1.0) < 1e-6, "ratios must sum to 1"
    patients = sorted({r.patient_id for r in rows})
    rng = random.Random(seed)
    rng.shuffle(patients)
    n = len(patients)
    n_tr = int(n * ratios[0])
    n_va = int(n * ratios[1])
    assign = {}
    for i, p in enumerate(patients):
        assign[p] = "train" if i < n_tr else ("val" if i < n_tr + n_va else "test")
    out: Dict[str, List[ManifestRow]] = {"train": [], "val": [], "test": []}
    for r in rows:
        out[assign[r.patient_id]].append(r)
    return out


# --- Transforms --------------------------------------------------------------

def build_transforms(img_size: int, train: bool):
    if not _HAS_TORCH:
        raise ImportError("transforms need torchvision installed")
    if train:
        return T.Compose([
            T.Resize((img_size + 32, img_size + 32)),
            T.RandomResizedCrop(img_size, scale=(0.7, 1.0)),
            T.RandomHorizontalFlip(),
            T.ColorJitter(0.2, 0.2, 0.2, 0.05),  # tolerate light/white-balance shifts across scopes
            T.ToTensor(),
            T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])
    return T.Compose([
        T.Resize((img_size, img_size)),
        T.ToTensor(),
        T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])


# --- Datasets ----------------------------------------------------------------

class SiteDataset(Dataset):
    def __init__(self, rows: Sequence[ManifestRow], transform: Callable):
        self.rows = list(rows)
        self.transform = transform
        self.site_to_idx = {s: i for i, s in enumerate(SITE_CLASSES)}

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, i):
        r = self.rows[i]
        img = self.transform(Image.open(r.image_path).convert("RGB"))
        return img, self.site_to_idx[r.site], float(r.quality_ok)


class GradeDataset(Dataset):
    """Only adequate images assigned to a real EGGIM area with a grade label."""

    def __init__(self, rows: Sequence[ManifestRow], transform: Callable):
        self.rows = [
            r for r in rows
            if r.quality_ok and r.site in EGGIM_SITES and r.im_grade is not None
        ]
        self.transform = transform

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, i):
        r = self.rows[i]
        img = self.transform(Image.open(r.image_path).convert("RGB"))
        return img, int(r.im_grade)


# --- Synthetic manifest (for smoke-testing the pipeline without real data) ----

def synthetic_manifest(n_patients: int = 40, seed: int = 0) -> List[ManifestRow]:
    """Fabricate a plausible manifest: each patient has the 5 areas (+ some
    'other' frames), random grades, occasional missing area or poor-quality frame.
    Image paths are placeholders; use `render_synthetic_images` to materialize them.
    """
    rng = random.Random(seed)
    rows: List[ManifestRow] = []
    for p in range(n_patients):
        pid = f"P{p:04d}"
        for site in EGGIM_SITES:
            if rng.random() < 0.1:
                continue  # occasionally a missing area -> incomplete exam
            n_views = rng.randint(1, 3)
            for v in range(n_views):
                q = rng.random() > 0.1
                grade = rng.choice(IM_GRADES)
                rows.append(ManifestRow(
                    image_path=f"__synthetic__/{pid}_{site}_{v}.jpg",
                    patient_id=pid, site=site, quality_ok=q,
                    im_grade=grade if q else None,
                ))
        for o in range(rng.randint(0, 3)):
            rows.append(ManifestRow(
                image_path=f"__synthetic__/{pid}_other_{o}.jpg",
                patient_id=pid, site="other", quality_ok=True, im_grade=None,
            ))
    return rows
