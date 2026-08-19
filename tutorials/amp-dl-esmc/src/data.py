"""Load / clean peptide tables and FASTA."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from .utils import clean_seq, is_valid_peptide


def load_peptide_csv(
    path: str | Path,
    seq_col: str = "sequence",
    label_col: str = "label",
    min_len: int = 5,
    max_len: int = 60,
    alphabet: str = "ACDEFGHIKLMNPQRSTVWY",
) -> pd.DataFrame:
    df = pd.read_csv(path)
    if seq_col not in df.columns:
        raise ValueError(f"missing column {seq_col!r} in {path}")
    df = df.copy()
    df[seq_col] = df[seq_col].astype(str).map(clean_seq)
    mask = df[seq_col].map(lambda s: is_valid_peptide(s, min_len, max_len, alphabet))
    n_drop = int((~mask).sum())
    if n_drop:
        print(f"[data] drop {n_drop} invalid rows from {path}")
    df = df.loc[mask].reset_index(drop=True)
    if label_col in df.columns:
        df[label_col] = df[label_col].astype(int)
    # drop exact duplicate sequences (keep first)
    before = len(df)
    df = df.drop_duplicates(subset=[seq_col], keep="first").reset_index(drop=True)
    if len(df) < before:
        print(f"[data] drop {before - len(df)} duplicate sequences")
    return df


def load_fasta(path: str | Path) -> pd.DataFrame:
    """Minimal FASTA reader → DataFrame[id, sequence]."""
    path = Path(path)
    ids: list[str] = []
    seqs: list[str] = []
    cur_id: str | None = None
    chunks: list[str] = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            if line.startswith(">"):
                if cur_id is not None:
                    ids.append(cur_id)
                    seqs.append(clean_seq("".join(chunks)))
                cur_id = line[1:].split()[0]
                chunks = []
            else:
                chunks.append(line)
        if cur_id is not None:
            ids.append(cur_id)
            seqs.append(clean_seq("".join(chunks)))
    return pd.DataFrame({"id": ids, "sequence": seqs})


def summarize_labels(df: pd.DataFrame, label_col: str = "label") -> dict:
    if label_col not in df.columns:
        return {"n": len(df)}
    vc = df[label_col].value_counts().to_dict()
    return {
        "n": len(df),
        "n_pos": int(vc.get(1, 0)),
        "n_neg": int(vc.get(0, 0)),
        "pos_rate": float(vc.get(1, 0) / max(len(df), 1)),
        "len_mean": float(df["sequence"].str.len().mean()) if "sequence" in df.columns else None,
        "len_min": int(df["sequence"].str.len().min()) if len(df) else None,
        "len_max": int(df["sequence"].str.len().max()) if len(df) else None,
    }
