#!/usr/bin/env python3
"""提取序列特征：ESM-C → ESM-2 → handcrafted 自动回退。"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.features import extract_features  # noqa: E402
from src.utils import ensure_dir, load_config, resolve_device, save_json, set_seed  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--backend", default=None, help="auto|esmc|esm2|handcrafted")
    parser.add_argument("--device", default=None)
    args = parser.parse_args()

    cfg = load_config()
    set_seed(cfg["project"]["seed"])
    fcfg = cfg["features"]
    backend = args.backend or fcfg["backend"]
    device = resolve_device(args.device or fcfg["device"])

    data_dir = Path(cfg["project"]["output_dir"]) / "data"
    train_csv = data_dir / "train_clean.csv"
    test_csv = data_dir / "test_clean.csv"
    if not train_csv.exists():
        print("run scripts/01_prepare_data.py first")
        return 1

    train = pd.read_csv(train_csv)
    test = pd.read_csv(test_csv)
    seq_col = cfg["data"]["seq_col"]

    feat_dir = ensure_dir(Path(cfg["project"]["output_dir"]) / "features")
    cache_dir = ensure_dir(cfg["project"]["cache_dir"])

    common_kw = dict(
        backend=backend,
        device=device,
        cache_dir=cache_dir,
        pooling=fcfg.get("pooling", "mean"),
        batch_size=fcfg.get("batch_size", 8),
        # esmc
        model_name=fcfg.get("esmc", {}).get("model_name", "esmc_300m"),
        use_api=fcfg.get("esmc", {}).get("use_api", False),
        api_model=fcfg.get("esmc", {}).get("api_model", "esmc-300m-2024-12"),
        api_url=fcfg.get("esmc", {}).get("api_url", "https://forge.evolutionaryscale.ai"),
        # esm2
        esm2_model=fcfg.get("esm2", {}).get("model_name", "esm2_t12_35M_UR50D"),
        repr_layer=fcfg.get("esm2", {}).get("repr_layer", 12),
    )

    print(f"[features] backend={backend} device={device}")
    X_train, used, meta_tr = extract_features(train[seq_col].tolist(), **common_kw)
    # force same backend for test
    common_kw["backend"] = used
    X_test, used2, meta_te = extract_features(test[seq_col].tolist(), **common_kw)
    assert used == used2

    y_train = train[cfg["data"]["label_col"]].to_numpy().astype(int)
    y_test = test[cfg["data"]["label_col"]].to_numpy().astype(int)

    np.save(feat_dir / "X_train.npy", X_train)
    np.save(feat_dir / "X_test.npy", X_test)
    np.save(feat_dir / "y_train.npy", y_train)
    np.save(feat_dir / "y_test.npy", y_test)

    meta = {
        "backend_used": used,
        "device": device,
        "train_shape": list(X_train.shape),
        "test_shape": list(X_test.shape),
        "meta_train": meta_tr,
        "meta_test": meta_te,
    }
    save_json(meta, feat_dir / "feature_meta.json")
    print(f"[ok] backend={used} dim={X_train.shape[1]}")
    print(f"[ok] X_train={X_train.shape} X_test={X_test.shape}")
    print(f"[ok] saved under {feat_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
