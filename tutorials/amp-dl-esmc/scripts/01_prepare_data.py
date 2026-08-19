#!/usr/bin/env python3
"""清洗 demo 数据、打印统计、写出 train/val 划分索引。"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.data import load_peptide_csv, summarize_labels  # noqa: E402
from src.utils import ensure_dir, load_config, save_json, set_seed  # noqa: E402


def main() -> int:
    cfg = load_config()
    set_seed(cfg["project"]["seed"])
    out_dir = ensure_dir(Path(cfg["project"]["output_dir"]) / "data")

    dcfg = cfg["data"]
    train = load_peptide_csv(
        dcfg["train_csv"],
        seq_col=dcfg["seq_col"],
        label_col=dcfg["label_col"],
        min_len=dcfg["min_len"],
        max_len=dcfg["max_len"],
        alphabet=dcfg["alphabet"],
    )
    test = load_peptide_csv(
        dcfg["test_csv"],
        seq_col=dcfg["seq_col"],
        label_col=dcfg["label_col"],
        min_len=dcfg["min_len"],
        max_len=dcfg["max_len"],
        alphabet=dcfg["alphabet"],
    )

    print("[train]", summarize_labels(train, dcfg["label_col"]))
    print("[test ]", summarize_labels(test, dcfg["label_col"]))

    # internal val split from train
    idx = np.arange(len(train))
    tr_idx, va_idx = train_test_split(
        idx,
        test_size=cfg["split"]["val_size"],
        random_state=cfg["project"]["seed"],
        stratify=train[dcfg["label_col"]].values if cfg["split"]["stratify"] else None,
    )

    train_path = out_dir / "train_clean.csv"
    test_path = out_dir / "test_clean.csv"
    train.to_csv(train_path, index=False)
    test.to_csv(test_path, index=False)
    np.save(out_dir / "tr_idx.npy", tr_idx)
    np.save(out_dir / "va_idx.npy", va_idx)

    meta = {
        "train": summarize_labels(train, dcfg["label_col"]),
        "test": summarize_labels(test, dcfg["label_col"]),
        "n_tr": int(len(tr_idx)),
        "n_va": int(len(va_idx)),
        "train_path": str(train_path),
        "test_path": str(test_path),
    }
    save_json(meta, out_dir / "prepare_meta.json")
    print(f"[ok] wrote {train_path}, {test_path}")
    print(f"[ok] val split  train={len(tr_idx)} val={len(va_idx)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
