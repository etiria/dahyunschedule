"""Training entry points for the two stages.

    python -m eggim.train site  --manifest data/manifest.csv --out ckpt/site.pt
    python -m eggim.train grade --manifest data/manifest.csv --out ckpt/grade.pt

The manifest is a CSV with columns:
    image_path, patient_id, site, quality_ok, im_grade
where `site` is one of the six SITE_CLASSES, quality_ok is 0/1, and im_grade is
0/1/2 or empty. Splitting is patient-level (see data.split_by_patient).

Class imbalance (high grades and non-antral sites are rarer) is handled with
weighted cross-entropy; swap in focal loss if needed. This is a reference loop,
kept short on purpose — tune schedulers/EMA/mixup for the real study.
"""
from __future__ import annotations

import argparse
import csv
from collections import Counter
from typing import List

from .config import IM_GRADES, ModelConfig, SITE_CLASSES, TrainConfig
from .data import (
    GradeDataset,
    ManifestRow,
    SiteDataset,
    build_transforms,
    split_by_patient,
)


def load_manifest(path: str) -> List[ManifestRow]:
    rows: List[ManifestRow] = []
    with open(path, newline="") as f:
        for r in csv.DictReader(f):
            g = r.get("im_grade", "").strip()
            rows.append(ManifestRow(
                image_path=r["image_path"],
                patient_id=r["patient_id"],
                site=r["site"],
                quality_ok=str(r["quality_ok"]).strip() in ("1", "True", "true"),
                im_grade=int(g) if g not in ("", "None", "nan") else None,
            ))
    return rows


def _class_weights(labels, n_classes, device):
    import torch
    counts = Counter(labels)
    total = sum(counts.values())
    w = [total / (n_classes * max(counts.get(c, 0), 1)) for c in range(n_classes)]
    return torch.tensor(w, dtype=torch.float32, device=device)


def _run_epoch(model, loader, optimizer, loss_fns, device, train: bool, stage: str):
    import torch
    model.train(train)
    total, correct, loss_sum = 0, 0, 0.0
    for batch in loader:
        if stage == "site":
            x, y_site, y_q = (b.to(device) for b in batch)
        else:
            x, y_grade = (b.to(device) for b in batch)
        with torch.set_grad_enabled(train):
            if stage == "site":
                site_logits, q_logit = model(x)
                loss = loss_fns["site"](site_logits, y_site) + \
                    0.5 * loss_fns["quality"](q_logit, y_q)
                pred = site_logits.argmax(1)
                correct += (pred == y_site).sum().item()
                total += y_site.numel()
            else:
                logits = model(x)
                loss = loss_fns["grade"](logits, y_grade)
                correct += (logits.argmax(1) == y_grade).sum().item()
                total += y_grade.numel()
            if train:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
        loss_sum += float(loss)
    return loss_sum / max(len(loader), 1), correct / max(total, 1)


def train(stage: str, manifest: str, out: str,
          model_cfg: ModelConfig | None = None, train_cfg: TrainConfig | None = None):
    import torch
    from torch.utils.data import DataLoader

    model_cfg = model_cfg or ModelConfig()
    train_cfg = train_cfg or TrainConfig()
    device = "cuda" if torch.cuda.is_available() else "cpu"

    rows = load_manifest(manifest)
    split = split_by_patient(rows, seed=train_cfg.seed)
    tf_tr = build_transforms(model_cfg.img_size, train=True)
    tf_va = build_transforms(model_cfg.img_size, train=False)

    if stage == "site":
        from .models import SiteClassifier
        model = SiteClassifier(model_cfg).to(device)
        ds_tr, ds_va = SiteDataset(split["train"], tf_tr), SiteDataset(split["val"], tf_va)
        loss_fns = {
            "site": torch.nn.CrossEntropyLoss(
                weight=_class_weights([SITE_CLASSES.index(r.site) for r in split["train"]],
                                      len(SITE_CLASSES), device)),
            "quality": torch.nn.BCEWithLogitsLoss(),
        }
    elif stage == "grade":
        from .models import IMGrader
        model = IMGrader(model_cfg).to(device)
        ds_tr, ds_va = GradeDataset(split["train"], tf_tr), GradeDataset(split["val"], tf_va)
        grade_labels = [r.im_grade for r in split["train"]
                        if r.im_grade is not None and r.quality_ok and r.site in SITE_CLASSES[:-1]]
        loss_fns = {"grade": torch.nn.CrossEntropyLoss(
            weight=_class_weights(grade_labels, len(IM_GRADES), device))}
    else:
        raise ValueError("stage must be 'site' or 'grade'")

    dl_tr = DataLoader(ds_tr, batch_size=train_cfg.batch_size, shuffle=True,
                       num_workers=train_cfg.num_workers, drop_last=True)
    dl_va = DataLoader(ds_va, batch_size=train_cfg.batch_size, shuffle=False,
                       num_workers=train_cfg.num_workers)
    opt = torch.optim.AdamW(model.parameters(), lr=train_cfg.lr,
                            weight_decay=train_cfg.weight_decay)

    best = 0.0
    for epoch in range(train_cfg.epochs):
        tr_loss, tr_acc = _run_epoch(model, dl_tr, opt, loss_fns, device, True, stage)
        va_loss, va_acc = _run_epoch(model, dl_va, opt, loss_fns, device, False, stage)
        print(f"[{stage}] epoch {epoch:02d} "
              f"train loss {tr_loss:.3f} acc {tr_acc:.3f} | val loss {va_loss:.3f} acc {va_acc:.3f}")
        if va_acc >= best:
            best = va_acc
            torch.save({"model": model.state_dict(), "config": model_cfg.__dict__}, out)
            print(f"  saved {out} (val acc {best:.3f})")


def main():
    ap = argparse.ArgumentParser(description="Train EGGIM site classifier or IM grader")
    ap.add_argument("stage", choices=["site", "grade"])
    ap.add_argument("--manifest", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--backbone", default=ModelConfig.backbone)
    ap.add_argument("--epochs", type=int, default=TrainConfig.epochs)
    args = ap.parse_args()
    train(args.stage, args.manifest, args.out,
          model_cfg=ModelConfig(backbone=args.backbone),
          train_cfg=TrainConfig(epochs=args.epochs))


if __name__ == "__main__":
    main()
