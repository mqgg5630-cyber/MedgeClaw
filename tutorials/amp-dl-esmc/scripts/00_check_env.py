#!/usr/bin/env python3
"""环境自检：检测错误 Python、缺包、推荐安装与可跑路径。"""

from __future__ import annotations

import importlib
import os
import platform
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def _ver(mod_name: str) -> str:
    try:
        m = importlib.import_module(mod_name)
        return str(getattr(m, "__version__", "unknown"))
    except Exception as e:
        return f"MISSING ({type(e).__name__})"


def _ok(v: str) -> bool:
    return not v.startswith("MISSING")


def main() -> int:
    py = sys.version_info
    exe = sys.executable
    print("=" * 64)
    print("AMP-DL-ESMC 环境自检")
    print("=" * 64)
    print(f"Python      : {py.major}.{py.minor}.{py.micro}  ({exe})")
    print(f"Platform    : {platform.platform()}")
    print(f"Project     : {ROOT}")
    print(f"VIRTUAL_ENV : {os.environ.get('VIRTUAL_ENV', '(none)')}")
    print(f"CONDA_PREFIX: {os.environ.get('CONDA_PREFIX', '(none)')}")
    print(f"CONDA_DEFAULT_ENV: {os.environ.get('CONDA_DEFAULT_ENV', '(none)')}")
    print()

    # ---- critical: wrong interpreter ----
    problems: list[str] = []
    tips: list[str] = []

    if "medgeclaw-rnaseq" in exe or "medgeclaw-rnaseq" in os.environ.get("VIRTUAL_ENV", ""):
        problems.append(
            "当前 Python 来自 ~/.venvs/medgeclaw-rnaseq，不是 amp-esm。\n"
            "  提示符里即使有 (amp-esm) 也会被 venv 抢 PATH。"
        )
        tips.append(
            "先退出混用环境再进 amp-esm：\n"
            "  deactivate 2>/dev/null; conda deactivate 2>/dev/null; conda deactivate 2>/dev/null\n"
            "  conda activate amp-esm\n"
            "  which python && python -V\n"
            "  # 期望 python 在 .../miniconda3/envs/amp-esm/bin/python，版本多为 3.10/3.11"
        )

    if py >= (3, 13):
        problems.append(
            f"Python {py.major}.{py.minor} 过新：torch / esm / fair-esm 轮子常未就绪（尤其 3.14）。"
        )
        tips.append(
            "ESM-C 请用 conda amp-esm（建议 3.10–3.12）。\n"
            "  conda activate amp-esm && python -V\n"
            "若 amp-esm 也是 3.13+，新建：\n"
            "  conda create -n amp-esmc python=3.11 -y && conda activate amp-esmc"
        )

    if problems:
        print("!!!! 关键问题（先处理再装大包）!!!!")
        for p in problems:
            print(f"  - {p}")
        print()

    # ---- deps ----
    required_min = {
        "numpy": "numpy",
        "pandas": "pandas",
        "sklearn": "scikit-learn",
        "yaml": "pyyaml",
        "joblib": "joblib",
    }
    optional = {
        "tqdm": "tqdm",
        "torch": "torch",
        "Bio": "biopython",
        "matplotlib": "matplotlib",
        "seaborn": "seaborn",
        "shap": "shap",
    }

    print("---- 最小依赖（handcrafted + 经典 ML 必需）----")
    miss_min = []
    for label, pip_name in required_min.items():
        v = _ver(label if label != "sklearn" else "sklearn")
        # yaml module name
        mod = {"sklearn": "sklearn", "yaml": "yaml"}.get(label, label)
        v = _ver(mod)
        flag = "OK" if _ok(v) else "NO"
        print(f"  [{flag}] {label:12s} {v}")
        if not _ok(v):
            miss_min.append(pip_name)

    print()
    print("---- 可选依赖 ----")
    miss_opt = []
    for label, pip_name in optional.items():
        mod = label
        v = _ver(mod)
        flag = "OK" if _ok(v) else "NO"
        print(f"  [{flag}] {label:12s} {v}")
        if not _ok(v):
            miss_opt.append(pip_name)

    print()
    print("---- PyTorch / GPU ----")
    if _ok(_ver("torch")):
        import torch

        print(f"  torch       : {torch.__version__}")
        print(f"  cuda_built  : {torch.version.cuda}")
        print(f"  cuda_avail  : {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"  gpu_name    : {torch.cuda.get_device_name(0)}")
    else:
        print("  torch MISSING — 仍可跑 handcrafted + logistic/RF/HGBM（无 MLP）")

    print()
    print("---- 蛋白语言模型 ----")
    esmc_ok = False
    esm2_ok = False
    try:
        import esm  # noqa: F401

        print(f"  esm package : {_ver('esm')}")
        try:
            from esm.models.esmc import ESMC  # noqa: F401

            print("  ESM-C API   : OK")
            esmc_ok = True
        except Exception as e:
            print(f"  ESM-C API   : NO  ({e})")
        try:
            import esm as em

            if hasattr(em, "pretrained"):
                print("  ESM-2 API   : OK (fair-esm style)")
                esm2_ok = True
            else:
                print("  ESM-2 API   : NO (当前 esm 无 pretrained)")
        except Exception:
            pass
    except Exception:
        print("  esm package : MISSING")
        print("  ESM-C API   : NO")
        print("  ESM-2 API   : NO")

    if esmc_ok:
        backend = "esmc"
        path = "A"
    elif esm2_ok:
        backend = "esm2"
        path = "B"
    elif not miss_min:
        backend = "handcrafted"
        path = "C"
    else:
        backend = "blocked"
        path = "D"

    print()
    print("---- 可跑路径决策 ----")
    paths = {
        "A": "ESM-C 全功能（推荐）",
        "B": "ESM-2 基线",
        "C": "handcrafted + 经典 ML（现在就能冒烟，不需 torch/esm）",
        "D": "先装最小依赖",
    }
    print(f"  SELECTED_BACKEND = {backend}")
    print(f"  PATH             = {path}: {paths[path]}")

    print()
    print("---- 建议命令（复制执行）----")
    if tips:
        print("  # 0) 纠正环境")
        for t in tips:
            for line in t.splitlines():
                print(f"  {line}" if not line.startswith(" ") else f"  {line}")
        print()

    print("  cd", ROOT)
    if miss_min:
        print("  # 1) 最小依赖（路径 C）")
        print(f"  python -m pip install {' '.join(miss_min)}")
    else:
        print("  # 1) 最小依赖已齐 → 可直接：")
        print("  BACKEND=handcrafted bash scripts/run_all.sh")

    print()
    print("  # 2) 可选增强（MLP / 进度条 / 解释）")
    print("  python -m pip install tqdm matplotlib seaborn shap")
    print("  # torch：务必在 Python<=3.12 的 conda 环境装")
    print("  # CPU:  pip install torch --index-url https://download.pytorch.org/whl/cpu")
    print("  # GPU:  按 https://pytorch.org 选择 cu118/cu121 命令")
    print()
    print("  # 3) ESM-C（仅在正确 conda 环境、已有 torch 后）")
    print("  python -m pip install esm")
    print("  # 若与 fair-esm 冲突：pip uninstall fair-esm -y && pip install esm")
    print()
    print("  # 4) 一键（自动选 backend）")
    print("  bash scripts/run_all.sh")
    print("  # 或分层 requirements：")
    print("  python -m pip install -r requirements-minimal.txt")
    print("  python -m pip install -r requirements.txt")

    # which conda amp-esm python if exists
    print()
    print("---- 本机可能的正确解释器 ----")
    candidates = [
        Path.home() / "miniconda3/envs/amp-esm/bin/python",
        Path.home() / "anaconda3/envs/amp-esm/bin/python",
        Path.home() / "mambaforge/envs/amp-esm/bin/python",
        Path.home() / "miniforge3/envs/amp-esm/bin/python",
        Path("/home/w24e/miniconda3/envs/amp-esm/bin/python"),
    ]
    found = False
    for c in candidates:
        if c.exists():
            found = True
            print(f"  FOUND {c}")
            print(f"    → 推荐: {c} scripts/00_check_env.py")
            print(f"    → 或:   source $(dirname {c})/activate  # 若用 conda 请 conda activate amp-esm")
    if not found:
        # try which
        w = shutil.which("conda")
        print(f"  conda executable: {w or 'not in PATH'}")
        print("  运行: conda env list | grep -i amp")

    print()
    print("---- 冒烟（handcrafted，不依赖 tqdm/torch）----")
    try:
        from src.features import handcrafted_features

        X = handcrafted_features(["GIGKFLHSAKKFGKAFVGEIMNS", "GGGGGGGGGGGGGGGG"])
        print(f"  handcrafted smoke OK  shape={X.shape}")
    except Exception as e:
        print(f"  handcrafted smoke FAIL: {e}")
        return 1

    out = ROOT / "outputs"
    out.mkdir(parents=True, exist_ok=True)
    (out / "env_backend.txt").write_text(backend + "\n", encoding="utf-8")
    report = {
        "python": f"{py.major}.{py.minor}.{py.micro}",
        "executable": exe,
        "backend": backend,
        "path": path,
        "miss_min": miss_min,
        "miss_opt": miss_opt,
        "esmc_ok": esmc_ok,
        "esm2_ok": esm2_ok,
        "problems": problems,
    }
    import json

    (out / "env_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {out / 'env_report.json'}")
    print("=" * 64)
    if path == "D":
        return 2
    if problems and path == "C":
        print("NOTE: 路径 C 可用；要 ESM-C 请先换到 amp-esm 的 Python 3.10–3.12")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
