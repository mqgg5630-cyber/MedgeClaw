#!/usr/bin/env python3
"""环境自检：告诉你 amp-esm / 当前环境缺什么、有什么、推荐怎么跑。"""

from __future__ import annotations

import importlib
import platform
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def _ver(mod_name: str) -> str:
    try:
        m = importlib.import_module(mod_name)
        return getattr(m, "__version__", "unknown")
    except Exception as e:
        return f"MISSING ({type(e).__name__}: {e})"


def _try(label: str, fn) -> tuple[bool, str]:
    try:
        msg = fn()
        return True, msg
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"


def main() -> int:
    print("=" * 64)
    print("AMP-DL-ESMC 环境自检")
    print("=" * 64)
    print(f"Python      : {sys.version.split()[0]}  ({sys.executable})")
    print(f"Platform    : {platform.platform()}")
    print(f"Project     : {ROOT}")
    print()

    core = {
        "numpy": "numpy",
        "pandas": "pandas",
        "sklearn": "sklearn",
        "yaml": "yaml",
        "tqdm": "tqdm",
        "joblib": "joblib",
        "Bio": "Bio",
        "torch": "torch",
        "matplotlib": "matplotlib",
        "seaborn": "seaborn",
        "shap": "shap",
    }
    print("---- 核心依赖 ----")
    missing = []
    for label, mod in core.items():
        v = _ver(mod)
        ok = not v.startswith("MISSING")
        print(f"  [{'OK' if ok else 'NO'}] {label:12s} {v}")
        if not ok:
            missing.append(label)

    print()
    print("---- PyTorch / GPU ----")
    ok, msg = _try("torch", lambda: __import__("torch"))
    if ok:
        import torch

        print(f"  torch       : {torch.__version__}")
        print(f"  cuda_built  : {torch.version.cuda}")
        print(f"  cuda_avail  : {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"  gpu_name    : {torch.cuda.get_device_name(0)}")
            print(f"  gpu_mem_GB  : {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f}")
        else:
            print("  hint        : 无 GPU 也能跑；ESM-C 300M 建议有 GPU，CPU 仅适合 demo 小数据")
    else:
        print(f"  torch MISSING: {msg}")
        missing.append("torch")

    print()
    print("---- 蛋白语言模型 ----")
    # ESM-C (EvolutionaryScale package name: esm)
    esmc_ok = False
    esm2_ok = False
    try:
        import esm  # noqa: F401

        print(f"  esm package : {_ver('esm')}")
        try:
            from esm.models.esmc import ESMC  # noqa: F401

            print("  ESM-C API   : OK  (from esm.models.esmc import ESMC)")
            esmc_ok = True
        except Exception as e:
            print(f"  ESM-C API   : NO   ({e})")
        try:
            import esm as esm_mod

            if hasattr(esm_mod, "pretrained"):
                print("  ESM-2 API   : OK  (fair-esm style esm.pretrained)")
                esm2_ok = True
            else:
                print("  ESM-2 API   : NO  (当前 esm 包无 pretrained；那是 fair-esm)")
        except Exception as e:
            print(f"  ESM-2 API   : NO   ({e})")
    except Exception as e:
        print(f"  esm package : MISSING ({e})")

    if not esm2_ok:
        try:
            # some envs install fair-esm separately
            import fair_esm  # type: ignore  # noqa: F401

            print(f"  fair_esm    : {_ver('fair_esm')}")
        except Exception:
            print("  fair-esm    : not installed as fair_esm")

    print()
    print("---- 特征后端决策 ----")
    if esmc_ok:
        backend = "esmc"
        print("  → 将使用 ESM-C（推荐，当前表征 SOTA 方向）")
    elif esm2_ok:
        backend = "esm2"
        print("  → 将回退 ESM-2（AMP 文献最常见基线）")
    else:
        backend = "handcrafted"
        print("  → 将回退 handcrafted（AAC+DPC+理化；无权重也能跑通流水线）")

    print()
    print("---- 建议安装命令（在 amp-esm 环境）----")
    print("  conda activate amp-esm")
    if missing:
        pip_map = {
            "numpy": "numpy",
            "pandas": "pandas",
            "sklearn": "scikit-learn",
            "yaml": "pyyaml",
            "tqdm": "tqdm",
            "joblib": "joblib",
            "Bio": "biopython",
            "torch": "torch",
            "matplotlib": "matplotlib",
            "seaborn": "seaborn",
            "shap": "shap",
        }
        pkgs = " ".join(pip_map[m] for m in missing if m in pip_map)
        print(f"  pip install {pkgs}")
    if not esmc_ok:
        print("  # ESM-C（EvolutionaryScale）")
        print("  pip install esm")
        print("  # 若与 fair-esm 冲突：先 pip uninstall fair-esm 再装 esm")
        print("  # 或本教程自动回退 handcrafted / 另开环境装 fair-esm")
    print("  # 一键：")
    print(f"  pip install -r {ROOT / 'requirements.txt'}")

    print()
    print("---- 快速冒烟（不下载大模型）----")
    try:
        from src.features import handcrafted_features

        X = handcrafted_features(["GIGKFLHSAKKFGKAFVGEIMNS", "GGGGGGGGGGGGGGGG"])
        print(f"  handcrafted smoke OK  shape={X.shape}")
    except Exception as e:
        print(f"  handcrafted smoke FAIL: {e}")
        return 1

    print()
    print("---- 下一步 ----")
    print("  python scripts/01_prepare_data.py")
    print("  python scripts/02_extract_features.py")
    print("  python scripts/03_train.py")
    print("  python scripts/04_predict.py")
    print("  # 或一键：")
    print("  bash scripts/run_all.sh")
    print()
    print(f"SELECTED_BACKEND={backend}")
    # write a tiny hint file for other scripts
    hint = ROOT / "outputs" / "env_backend.txt"
    hint.parent.mkdir(parents=True, exist_ok=True)
    hint.write_text(backend + "\n", encoding="utf-8")
    print(f"wrote {hint}")
    print("=" * 64)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
