"""
Feature backends for AMP peptides.

Priority when backend=auto:
  1) ESM-C  (package `esm`, EvolutionaryScale)  — recommended representation model
  2) ESM-2  (package `fair-esm` / `esm.pretrained`) — common literature baseline
  3) handcrafted AAC + DPC + simple physicochemical props
"""

from __future__ import annotations

import hashlib
import os
from pathlib import Path
from typing import Literal

import numpy as np
from tqdm import tqdm

from .utils import ensure_dir

BackendName = Literal["esmc", "esm2", "handcrafted"]

AA = "ACDEFGHIKLMNPQRSTVWY"
AA_INDEX = {a: i for i, a in enumerate(AA)}

# rough side-chain hydrophobicity (Kyte-Doolittle-ish, scaled)
HYDRO = {
    "A": 1.8, "C": 2.5, "D": -3.5, "E": -3.5, "F": 2.8,
    "G": -0.4, "H": -3.2, "I": 4.5, "K": -3.9, "L": 3.8,
    "M": 1.9, "N": -3.5, "P": -1.6, "Q": -3.5, "R": -4.5,
    "S": -0.8, "T": -0.7, "V": 4.2, "W": -0.9, "Y": -1.3,
}
CHARGE = {"D": -1, "E": -1, "K": 1, "R": 1, "H": 0.5}


def _cache_key(seqs: list[str], tag: str) -> str:
    h = hashlib.md5()
    h.update(tag.encode())
    for s in seqs:
        h.update(s.encode())
        h.update(b"|")
    return h.hexdigest()[:16]


# ---------------------------------------------------------------------------
# Handcrafted
# ---------------------------------------------------------------------------
def handcrafted_features(seqs: list[str]) -> np.ndarray:
    """AAC (20) + DPC (400) + props (6) = 426-d."""
    rows = []
    for seq in seqs:
        n = max(len(seq), 1)
        aac = np.zeros(20, dtype=np.float64)
        for c in seq:
            if c in AA_INDEX:
                aac[AA_INDEX[c]] += 1
        aac /= n

        dpc = np.zeros(400, dtype=np.float64)
        if len(seq) >= 2:
            for i in range(len(seq) - 1):
                a, b = seq[i], seq[i + 1]
                if a in AA_INDEX and b in AA_INDEX:
                    dpc[AA_INDEX[a] * 20 + AA_INDEX[b]] += 1
            dpc /= (len(seq) - 1)

        hydro = np.mean([HYDRO.get(c, 0.0) for c in seq])
        charge = np.sum([CHARGE.get(c, 0.0) for c in seq])
        mw_proxy = float(n)  # length as simple size proxy
        aromatic = sum(c in "FWY" for c in seq) / n
        positive = sum(c in "KRH" for c in seq) / n
        hydrophobic = sum(c in "AILMFVW" for c in seq) / n
        props = np.array([hydro, charge, mw_proxy, aromatic, positive, hydrophobic], dtype=np.float64)
        rows.append(np.concatenate([aac, dpc, props]))
    return np.vstack(rows).astype(np.float32)


# ---------------------------------------------------------------------------
# ESM-C
# ---------------------------------------------------------------------------
def _esmc_available() -> bool:
    try:
        from esm.models.esmc import ESMC  # noqa: F401
        from esm.sdk.api import ESMProtein, LogitsConfig  # noqa: F401

        return True
    except Exception:
        return False


def embed_esmc(
    seqs: list[str],
    model_name: str = "esmc_300m",
    device: str = "cpu",
    batch_size: int = 8,
    pooling: str = "mean",
    use_api: bool = False,
    api_model: str = "esmc-300m-2024-12",
    api_url: str = "https://forge.evolutionaryscale.ai",
    api_token: str | None = None,
) -> np.ndarray:
    from esm.sdk.api import ESMProtein, LogitsConfig

    if use_api:
        token = api_token or os.environ.get("ESM_API_KEY") or os.environ.get("FORGE_API_TOKEN")
        if not token:
            raise RuntimeError("ESM API token missing. Set ESM_API_KEY or FORGE_API_TOKEN.")
        try:
            from esm.sdk.forge import ESM3ForgeInferenceClient

            client = ESM3ForgeInferenceClient(model=api_model, url=api_url, token=token)
        except Exception:
            from esm.sdk import client as esm_client

            client = esm_client(api_model, token=token)
    else:
        from esm.models.esmc import ESMC

        client = ESMC.from_pretrained(model_name).to(device)
        client.eval()

    import torch

    vecs: list[np.ndarray] = []
    for i in tqdm(range(0, len(seqs), batch_size), desc=f"ESM-C[{model_name}]"):
        batch = seqs[i : i + batch_size]
        for seq in batch:
            protein = ESMProtein(sequence=seq)
            protein_tensor = client.encode(protein)
            out = client.logits(
                protein_tensor,
                LogitsConfig(sequence=True, return_embeddings=True),
            )
            emb = out.embeddings
            if emb is None:
                raise RuntimeError("ESM-C returned no embeddings")
            if hasattr(emb, "detach"):
                emb_np = emb.detach().float().cpu().numpy()
            else:
                emb_np = np.asarray(emb, dtype=np.float32)
            # shapes: [1, L+special, D] or [L+special, D] or [1, D]
            emb_np = np.squeeze(emb_np)
            if emb_np.ndim == 1:
                vec = emb_np
            else:
                # drop BOS/EOS if present (common: first/last)
                if emb_np.shape[0] >= 3:
                    tok = emb_np[1:-1]
                else:
                    tok = emb_np
                if pooling == "cls":
                    vec = emb_np[0]
                elif pooling == "mean+max":
                    vec = np.concatenate([tok.mean(0), tok.max(0)], axis=0)
                else:
                    vec = tok.mean(0)
            vecs.append(vec.astype(np.float32))
        if device.startswith("cuda"):
            torch.cuda.empty_cache()
    return np.vstack(vecs)


# ---------------------------------------------------------------------------
# ESM-2 (fair-esm)
# ---------------------------------------------------------------------------
def _esm2_available() -> bool:
    try:
        import esm  # fair-esm also exports `esm`

        # fair-esm has pretrained; EvolutionaryScale esm may not
        return hasattr(esm, "pretrained")
    except Exception:
        return False


def embed_esm2(
    seqs: list[str],
    model_name: str = "esm2_t12_35M_UR50D",
    repr_layer: int = 12,
    device: str = "cpu",
    batch_size: int = 8,
    pooling: str = "mean",
) -> np.ndarray:
    import torch
    import esm

    model, alphabet = esm.pretrained.load_model_and_alphabet(model_name)
    model = model.to(device).eval()
    batch_converter = alphabet.get_batch_converter()
    repr_layers = [repr_layer]

    vecs: list[np.ndarray] = []
    with torch.no_grad():
        for i in tqdm(range(0, len(seqs), batch_size), desc=f"ESM-2[{model_name}]"):
            batch_seqs = seqs[i : i + batch_size]
            data = [(f"s{j}", s) for j, s in enumerate(batch_seqs)]
            _, _, tokens = batch_converter(data)
            tokens = tokens.to(device)
            out = model(tokens, repr_layers=repr_layers, return_contacts=False)
            token_reps = out["representations"][repr_layer]  # [B, L, D]
            for b, seq in enumerate(batch_seqs):
                # tokens: 0=BOS, 1..len=AA, len+1=EOS
                rep = token_reps[b, 1 : len(seq) + 1]
                if pooling == "cls":
                    vec = token_reps[b, 0].float().cpu().numpy()
                elif pooling == "mean+max":
                    m = rep.mean(0).float().cpu().numpy()
                    x = rep.max(0).values.float().cpu().numpy()
                    vec = np.concatenate([m, x], axis=0)
                else:
                    vec = rep.mean(0).float().cpu().numpy()
                vecs.append(vec.astype(np.float32))
    return np.vstack(vecs)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def detect_backend(preferred: str = "auto") -> BackendName:
    if preferred and preferred != "auto":
        return preferred  # type: ignore[return-value]
    if _esmc_available():
        return "esmc"
    if _esm2_available():
        return "esm2"
    return "handcrafted"


def extract_features(
    seqs: list[str],
    backend: str = "auto",
    device: str = "cpu",
    cache_dir: str | Path | None = None,
    **kwargs,
) -> tuple[np.ndarray, BackendName, dict]:
    """
    Returns (X, backend_used, meta).
    """
    used = detect_backend(backend)
    meta: dict = {"backend_requested": backend, "backend_used": used, "n": len(seqs)}

    tag = f"{used}|{kwargs.get('model_name', '')}|{kwargs.get('pooling', 'mean')}"
    cache_path = None
    if cache_dir:
        ensure_dir(cache_dir)
        cache_path = Path(cache_dir) / f"emb_{used}_{_cache_key(seqs, tag)}.npy"
        if cache_path.exists():
            print(f"[features] load cache {cache_path}")
            X = np.load(cache_path)
            meta["cache"] = str(cache_path)
            meta["dim"] = int(X.shape[1])
            return X, used, meta

    if used == "esmc":
        if not _esmc_available() and not kwargs.get("use_api"):
            print("[features] ESM-C not importable → fallback")
            return extract_features(seqs, backend="esm2", device=device, cache_dir=cache_dir, **kwargs)
        X = embed_esmc(
            seqs,
            model_name=kwargs.get("model_name", kwargs.get("esmc_model", "esmc_300m")),
            device=device,
            batch_size=int(kwargs.get("batch_size", 8)),
            pooling=kwargs.get("pooling", "mean"),
            use_api=bool(kwargs.get("use_api", False)),
            api_model=kwargs.get("api_model", "esmc-300m-2024-12"),
            api_url=kwargs.get("api_url", "https://forge.evolutionaryscale.ai"),
            api_token=kwargs.get("api_token"),
        )
    elif used == "esm2":
        if not _esm2_available():
            print("[features] ESM-2 not importable → handcrafted")
            return extract_features(seqs, backend="handcrafted", device=device, cache_dir=cache_dir, **kwargs)
        X = embed_esm2(
            seqs,
            model_name=kwargs.get("esm2_model", kwargs.get("model_name", "esm2_t12_35M_UR50D")),
            repr_layer=int(kwargs.get("repr_layer", 12)),
            device=device,
            batch_size=int(kwargs.get("batch_size", 8)),
            pooling=kwargs.get("pooling", "mean"),
        )
    else:
        X = handcrafted_features(seqs)
        used = "handcrafted"

    meta["dim"] = int(X.shape[1])
    meta["backend_used"] = used
    if cache_path is not None:
        np.save(cache_path, X)
        meta["cache"] = str(cache_path)
        print(f"[features] saved cache {cache_path} shape={X.shape}")
    return X, used, meta
