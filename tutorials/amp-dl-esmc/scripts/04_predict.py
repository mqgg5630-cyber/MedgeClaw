#!/usr/bin/env python3
"""对新序列（FASTA）提特征并用最佳模型预测 AMP 概率。"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.data import load_fasta  # noqa: E402
from src.features import extract_features  # noqa: E402
from src.models import EmbeddingMLP, MLPConfig  # noqa: E402
from src.utils import ensure_dir, load_config, resolve_device, set_seed  # noqa: E402


def load_best_model(model_dir: Path):
    best = (model_dir / "BEST_MODEL.txt").read_text(encoding="utf-8").strip()
    if best == "mlp":
        blob = joblib.load(model_dir / "mlp.joblib")
        return best, blob
    path = model_dir / f"{best}.joblib"
    if not path.exists():
        path = model_dir / "best_model.joblib"
    return best, joblib.load(path)


def predict_with(name: str, bundle, X: np.ndarray) -> np.ndarray:
    if name == "mlp":
        cfg = MLPConfig(**bundle["cfg"])
        # rebuild
        state = bundle["bundle"]
        mlp = EmbeddingMLP(X.shape[1], cfg)
        mlp.scaler_mean_ = state["scaler_mean"]
        mlp.scaler_std_ = state["scaler_std"]
        import torch

        sd = {k: torch.tensor(v) for k, v in state["state"].items()}
        mlp.net.load_state_dict(sd)
        return mlp.predict_proba(X)
    # sklearn pipeline
    if hasattr(bundle, "predict_proba"):
        return bundle.predict_proba(X)[:, 1]
    return bundle.predict(X).astype(float)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--fasta", default=None)
    parser.add_argument("--threshold", type=float, default=None)
    args = parser.parse_args()

    cfg = load_config()
    set_seed(cfg["project"]["seed"])
    fasta = args.fasta or cfg["predict"]["input_fasta"]
    thr = args.threshold if args.threshold is not None else cfg["predict"]["threshold"]

    model_dir = Path(cfg["project"]["output_dir"]) / "models"
    feat_meta = json.loads((Path(cfg["project"]["output_dir"]) / "features" / "feature_meta.json").read_text(encoding="utf-8"))
    backend = feat_meta["backend_used"]
    device = resolve_device(cfg["features"]["device"])

    df = load_fasta(fasta)
    print(f"[predict] n={len(df)} backend={backend} device={device}")

    fcfg = cfg["features"]
    X, used, meta = extract_features(
        df["sequence"].tolist(),
        backend=backend,
        device=device,
        cache_dir=cfg["project"]["cache_dir"],
        pooling=fcfg.get("pooling", "mean"),
        batch_size=fcfg.get("batch_size", 8),
        model_name=fcfg.get("esmc", {}).get("model_name", "esmc_300m"),
        use_api=fcfg.get("esmc", {}).get("use_api", False),
        esm2_model=fcfg.get("esm2", {}).get("model_name", "esm2_t12_35M_UR50D"),
        repr_layer=fcfg.get("esm2", {}).get("repr_layer", 12),
    )

    name, bundle = load_best_model(model_dir)
    prob = predict_with(name, bundle, X)
    pred = (prob >= thr).astype(int)

    out_dir = ensure_dir(Path(cfg["project"]["output_dir"]) / "predict")
    res = df.copy()
    res["prob_amp"] = prob
    res["pred_label"] = pred
    res["model"] = name
    res["backend"] = used
    out_csv = out_dir / "predictions.csv"
    res.to_csv(out_csv, index=False)
    print(res.to_string(index=False))
    print(f"\n[ok] wrote {out_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
