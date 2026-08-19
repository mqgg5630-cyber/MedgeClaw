"""Classical ML + optional small MLP head on frozen embeddings."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    matthews_corrcoef,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


def compute_metrics(y_true: np.ndarray, y_prob: np.ndarray, threshold: float = 0.5) -> dict[str, float]:
    y_pred = (y_prob >= threshold).astype(int)
    out: dict[str, float] = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "mcc": float(matthews_corrcoef(y_true, y_pred)) if len(np.unique(y_true)) > 1 else 0.0,
    }
    try:
        out["roc_auc"] = float(roc_auc_score(y_true, y_prob))
    except ValueError:
        out["roc_auc"] = float("nan")
    return out


def make_classical(name: str, seed: int = 42) -> Pipeline:
    if name == "logistic":
        clf: Any = LogisticRegression(max_iter=2000, class_weight="balanced", random_state=seed)
    elif name == "random_forest":
        clf = RandomForestClassifier(
            n_estimators=300,
            class_weight="balanced_subsample",
            random_state=seed,
            n_jobs=-1,
        )
    elif name in ("xgboost_like", "hist_gbm", "gbm"):
        # sklearn>=1.2 supports class_weight on HGBM; older: omit
        try:
            clf = HistGradientBoostingClassifier(
                max_depth=6,
                learning_rate=0.08,
                max_iter=200,
                random_state=seed,
                class_weight="balanced",
            )
        except TypeError:
            clf = HistGradientBoostingClassifier(
                max_depth=6,
                learning_rate=0.08,
                max_iter=200,
                random_state=seed,
            )
    else:
        raise ValueError(f"unknown classical model: {name}")
    return Pipeline([("scaler", StandardScaler()), ("clf", clf)])


def cv_evaluate(
    model: Pipeline,
    X: np.ndarray,
    y: np.ndarray,
    folds: int = 5,
    seed: int = 42,
) -> tuple[dict[str, float], np.ndarray]:
    skf = StratifiedKFold(n_splits=min(folds, max(2, int(np.min(np.bincount(y))))), shuffle=True, random_state=seed)
    try:
        proba = cross_val_predict(model, X, y, cv=skf, method="predict_proba", n_jobs=-1)[:, 1]
    except Exception:
        pred = cross_val_predict(model, X, y, cv=skf, n_jobs=-1)
        proba = pred.astype(float)
    return compute_metrics(y, proba), proba


def torch_available() -> bool:
    try:
        import torch  # noqa: F401

        return True
    except Exception:
        return False


@dataclass
class MLPConfig:
    hidden: tuple[int, ...] = (256, 64)
    dropout: float = 0.3
    epochs: int = 40
    lr: float = 1e-3
    weight_decay: float = 1e-4
    batch_size: int = 32
    patience: int = 8
    seed: int = 42
    device: str = "cpu"


class EmbeddingMLP:
    """Small MLP on frozen sequence embeddings. Requires torch."""

    def __init__(self, in_dim: int, cfg: MLPConfig):
        if not torch_available():
            raise ImportError("torch is required for EmbeddingMLP")
        import torch
        import torch.nn as nn

        self.cfg = cfg
        self.device = cfg.device
        layers: list[nn.Module] = []
        d = in_dim
        for h in cfg.hidden:
            layers += [nn.Linear(d, h), nn.ReLU(), nn.Dropout(cfg.dropout)]
            d = h
        layers.append(nn.Linear(d, 1))
        self.net = nn.Sequential(*layers).to(self.device)
        self.torch = torch
        self.scaler_mean_: np.ndarray | None = None
        self.scaler_std_: np.ndarray | None = None

    def _scale_fit(self, X: np.ndarray) -> np.ndarray:
        self.scaler_mean_ = X.mean(0)
        self.scaler_std_ = X.std(0) + 1e-6
        return (X - self.scaler_mean_) / self.scaler_std_

    def _scale(self, X: np.ndarray) -> np.ndarray:
        assert self.scaler_mean_ is not None
        return (X - self.scaler_mean_) / self.scaler_std_

    def fit(self, X: np.ndarray, y: np.ndarray, X_val: np.ndarray | None = None, y_val: np.ndarray | None = None):
        torch = self.torch
        cfg = self.cfg
        torch.manual_seed(cfg.seed)
        Xs = self._scale_fit(X)
        xt = torch.tensor(Xs, dtype=torch.float32, device=self.device)
        yt = torch.tensor(y.reshape(-1, 1), dtype=torch.float32, device=self.device)

        pos = float((y == 1).sum())
        neg = float((y == 0).sum())
        pos_weight = torch.tensor([neg / max(pos, 1.0)], device=self.device)

        opt = torch.optim.AdamW(self.net.parameters(), lr=cfg.lr, weight_decay=cfg.weight_decay)
        loss_fn = torch.nn.BCEWithLogitsLoss(pos_weight=pos_weight)

        best_state = None
        best_val = -1.0
        bad = 0
        n = len(y)
        idx = np.arange(n)

        for epoch in range(cfg.epochs):
            self.net.train()
            np.random.shuffle(idx)
            total = 0.0
            for start in range(0, n, cfg.batch_size):
                b = idx[start : start + cfg.batch_size]
                opt.zero_grad()
                logits = self.net(xt[b])
                loss = loss_fn(logits, yt[b])
                loss.backward()
                opt.step()
                total += float(loss.item()) * len(b)
            train_loss = total / n

            if X_val is not None and y_val is not None:
                val_prob = self.predict_proba(X_val)
                vm = compute_metrics(y_val, val_prob)
                score = vm.get("roc_auc", vm["f1"])
                if np.isnan(score):
                    score = vm["f1"]
                marker = ""
                if score > best_val:
                    best_val = score
                    best_state = {k: v.detach().cpu().clone() for k, v in self.net.state_dict().items()}
                    bad = 0
                    marker = "*"
                else:
                    bad += 1
                print(f"  epoch {epoch+1:03d} loss={train_loss:.4f} val_auc={score:.4f}{marker}")
                if bad >= cfg.patience:
                    print("  early stop")
                    break
            else:
                print(f"  epoch {epoch+1:03d} loss={train_loss:.4f}")

        if best_state is not None:
            self.net.load_state_dict(best_state)
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        torch = self.torch
        self.net.eval()
        Xs = self._scale(X)
        with torch.no_grad():
            xt = torch.tensor(Xs, dtype=torch.float32, device=self.device)
            logits = self.net(xt).squeeze(-1)
            prob = torch.sigmoid(logits).cpu().numpy()
        return prob.astype(np.float64)

    def state_dict_numpy(self) -> dict:
        return {
            "cfg": self.cfg.__dict__,
            "scaler_mean": self.scaler_mean_,
            "scaler_std": self.scaler_std_,
            "state": {k: v.detach().cpu().numpy() for k, v in self.net.state_dict().items()},
        }
