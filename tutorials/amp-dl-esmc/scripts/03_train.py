#!/usr/bin/env python3
"""在冻结特征上训练经典 ML；若有 torch 再训 MLP。"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.models import (  # noqa: E402
    EmbeddingMLP,
    MLPConfig,
    compute_metrics,
    cv_evaluate,
    make_classical,
    torch_available,
)
from src.utils import ensure_dir, load_config, resolve_device, save_json, set_seed  # noqa: E402


def main() -> int:
    cfg = load_config()
    set_seed(cfg["project"]["seed"])
    out = ensure_dir(Path(cfg["project"]["output_dir"]) / "models")
    feat_dir = Path(cfg["project"]["output_dir"]) / "features"
    data_dir = Path(cfg["project"]["output_dir"]) / "data"

    for p in ("X_train.npy", "X_test.npy", "y_train.npy", "y_test.npy"):
        if not (feat_dir / p).exists():
            print(f"missing {feat_dir / p}; run scripts/02_extract_features.py first")
            return 1

    X = np.load(feat_dir / "X_train.npy")
    y = np.load(feat_dir / "y_train.npy")
    X_test = np.load(feat_dir / "X_test.npy")
    y_test = np.load(feat_dir / "y_test.npy")
    tr_idx = np.load(data_dir / "tr_idx.npy")
    va_idx = np.load(data_dir / "va_idx.npy")

    print(f"[train] X={X.shape} test={X_test.shape} torch={torch_available()}")

    results = []
    best_name = None
    best_auc = -1.0
    best_model = None

    for name in cfg["model"]["classical"]:
        print(f"\n== classical: {name} ==")
        model = make_classical(name, seed=cfg["project"]["seed"])
        cv_m, _ = cv_evaluate(model, X, y, folds=cfg["train"]["cv_folds"], seed=cfg["project"]["seed"])
        print("  CV ", {k: round(v, 4) for k, v in cv_m.items()})
        model.fit(X, y)
        prob = model.predict_proba(X_test)[:, 1]
        te_m = compute_metrics(y_test, prob)
        print("  TEST", {k: round(v, 4) for k, v in te_m.items()})
        joblib.dump(model, out / f"{name}.joblib")
        results.append(
            {
                "model": name,
                "type": "classical",
                **{f"cv_{k}": v for k, v in cv_m.items()},
                **{f"test_{k}": v for k, v in te_m.items()},
            }
        )
        auc = te_m.get("roc_auc", te_m["f1"])
        if not np.isnan(auc) and auc > best_auc:
            best_auc, best_name, best_model = float(auc), name, model

    dl_cfg = cfg["model"].get("dl", {})
    if dl_cfg.get("enabled", True):
        if not torch_available():
            print("\n== dl: mlp SKIPPED (torch not installed) ==")
            print("  install torch in Python 3.10–3.12 env to enable MLP")
        else:
            print("\n== dl: mlp ==")
            device = resolve_device(cfg["features"]["device"])
            mlp_cfg = MLPConfig(
                hidden=tuple(dl_cfg.get("hidden", [256, 64])),
                dropout=float(dl_cfg.get("dropout", 0.3)),
                epochs=int(dl_cfg.get("epochs", 40)),
                lr=float(dl_cfg.get("lr", 1e-3)),
                weight_decay=float(dl_cfg.get("weight_decay", 1e-4)),
                batch_size=int(dl_cfg.get("batch_size", 32)),
                patience=int(dl_cfg.get("patience", 8)),
                seed=cfg["project"]["seed"],
                device=device,
            )
            mlp = EmbeddingMLP(X.shape[1], mlp_cfg)
            mlp.fit(X[tr_idx], y[tr_idx], X[va_idx], y[va_idx])
            prob = mlp.predict_proba(X_test)
            te_m = compute_metrics(y_test, prob)
            print("  TEST", {k: round(v, 4) for k, v in te_m.items()})
            joblib.dump(
                {"type": "mlp", "cfg": mlp_cfg.__dict__, "bundle": mlp.state_dict_numpy()},
                out / "mlp.joblib",
            )
            results.append({"model": "mlp", "type": "dl", **{f"test_{k}": v for k, v in te_m.items()}})
            auc = te_m.get("roc_auc", te_m["f1"])
            if not np.isnan(auc) and auc > best_auc:
                best_auc, best_name, best_model = float(auc), "mlp", mlp

    df = pd.DataFrame(results)
    df.to_csv(out / "metrics.csv", index=False)
    save_json(
        {"best_model": best_name, "best_test_auc_or_f1": best_auc, "results": results},
        out / "metrics.json",
    )
    (out / "BEST_MODEL.txt").write_text(str(best_name) + "\n", encoding="utf-8")
    if best_name != "mlp" and best_model is not None:
        joblib.dump(best_model, out / "best_model.joblib")

    print(f"\n[ok] best={best_name} score≈{best_auc:.4f}")
    print(f"[ok] metrics → {out / 'metrics.csv'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
