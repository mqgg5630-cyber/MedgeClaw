"""Shared helpers: config, seeding, device, IO."""

from __future__ import annotations

import json
import random
import re
from pathlib import Path
from typing import Any

import numpy as np
import yaml

AA_RE = re.compile(r"^[ACDEFGHIKLMNPQRSTVWY]+$")


def project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def load_config(path: str | Path | None = None) -> dict[str, Any]:
    cfg_path = Path(path) if path else project_root() / "config.yaml"
    with open(cfg_path, encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    # resolve relative paths against project root
    root = project_root()
    cfg["_root"] = str(root)
    for key in ("output_dir", "cache_dir"):
        p = Path(cfg["project"][key])
        if not p.is_absolute():
            cfg["project"][key] = str(root / p)
    for key in ("train_csv", "test_csv"):
        p = Path(cfg["data"][key])
        if not p.is_absolute():
            cfg["data"][key] = str(root / p)
    p = Path(cfg["predict"]["input_fasta"])
    if not p.is_absolute():
        cfg["predict"]["input_fasta"] = str(root / p)
    return cfg


def set_seed(seed: int = 42) -> None:
    random.seed(seed)
    np.random.seed(seed)
    try:
        import torch

        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
    except ImportError:
        pass


def resolve_device(pref: str = "auto") -> str:
    if pref and pref != "auto":
        return pref
    try:
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        return "cpu"


def ensure_dir(path: str | Path) -> Path:
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def save_json(obj: Any, path: str | Path) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False, default=str)


def is_valid_peptide(seq: str, min_len: int = 5, max_len: int = 60, alphabet: str | None = None) -> bool:
    s = seq.strip().upper().replace(" ", "")
    if len(s) < min_len or len(s) > max_len:
        return False
    if alphabet:
        return all(c in alphabet for c in s)
    return bool(AA_RE.match(s))


def clean_seq(seq: str) -> str:
    return seq.strip().upper().replace(" ", "").replace("\n", "")
