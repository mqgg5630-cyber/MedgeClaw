#!/usr/bin/env python3
"""可选：对经典模型做 SHAP 全局解释（需要 shap + matplotlib）。"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.utils import ensure_dir, load_config  # noqa: E402


def main() -> int:
    try:
        import shap
    except ImportError:
        print("shap not installed — skip.  pip install shap")
        return 0
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib not installed — skip.  pip install matplotlib")
        return 0

    cfg = load_config()
    feat_dir = Path(cfg["project"]["output_dir"]) / "features"
    model_dir = Path(cfg["project"]["output_dir"]) / "models"
    out_dir = ensure_dir(Path(cfg["project"]["output_dir"]) / "explain")

    if not (feat_dir / "X_train.npy").exists() or not (model_dir / "BEST_MODEL.txt").exists():
        print("train first")
        return 0

    X = np.load(feat_dir / "X_train.npy")
    best = (model_dir / "BEST_MODEL.txt").read_text(encoding="utf-8").strip()
    if best == "mlp":
        print("SHAP for MLP skipped in demo; using logistic if present.")
        path = model_dir / "logistic.joblib"
        if not path.exists():
            return 0
        model = joblib.load(path)
        best = "logistic"
    else:
        model = joblib.load(model_dir / f"{best}.joblib")

    rng = np.random.default_rng(cfg["project"]["seed"])
    n = min(40, len(X))
    idx = rng.choice(len(X), size=n, replace=False)
    Xs = X[idx]

    print(f"[shap] model={best} background_n={n} dim={X.shape[1]}")
    try:
        scaler = model.named_steps.get("scaler")
        clf = model.named_steps.get("clf")
        Xs_s = scaler.transform(Xs) if scaler is not None else Xs
        if hasattr(clf, "predict_proba"):
            explainer = shap.Explainer(clf.predict_proba, Xs_s)
            sv = explainer(Xs_s)
            values = sv.values[..., 1] if getattr(sv.values, "ndim", 0) == 3 else sv.values
        else:
            explainer = shap.Explainer(clf.predict, Xs_s)
            sv = explainer(Xs_s)
            values = sv.values
    except Exception as e:
        print(f"shap failed: {e}")
        return 0

    mean_abs = np.abs(values).mean(0)
    order = np.argsort(-mean_abs)[:30]
    fig, ax = plt.subplots(figsize=(8, 6))
    ax.barh([f"f{i}" for i in order[::-1]], mean_abs[order][::-1])
    ax.set_xlabel("mean |SHAP|")
    ax.set_title(f"Top embedding dims — {best}")
    fig.tight_layout()
    fig_path = out_dir / f"shap_top_dims_{best}.png"
    fig.savefig(fig_path, dpi=150)
    plt.close(fig)
    np.save(out_dir / f"shap_mean_abs_{best}.npy", mean_abs)
    print(f"[ok] {fig_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
