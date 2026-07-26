"""CJK 字体配置 helper（参考 skills/cjk-viz/SKILL.md，不硬编码字体名）。"""
import os
import glob
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

CANDIDATES = [
    "Noto Sans CJK SC", "Noto Sans SC", "Source Han Sans SC",
    "WenQuanYi Micro Hei", "WenQuanYi Zen Hei",
    "Droid Sans Fallback", "AR PL UMing CN",
    "SimHei", "Microsoft YaHei", "PingFang SC",
]

SEARCH_DIRS = [
    os.path.expanduser("~/.fonts"),
    "/usr/local/lib/python3.11/dist-packages/mplfonts/fonts",
    "/usr/share/fonts",
]


def setup_cjk_font():
    """检测并配置 CJK 字体，返回字体名；找不到返回 None。"""
    available = {f.name for f in fm.fontManager.ttflist}
    for name in CANDIDATES:
        if name in available:
            plt.rcParams["font.sans-serif"] = [name, "DejaVu Sans"]
            plt.rcParams["axes.unicode_minus"] = False
            return name

    # 未注册：尝试从常见目录加载字体文件后重试
    for d in SEARCH_DIRS:
        if not os.path.isdir(d):
            continue
        for ext in ("*.otf", "*.ttf", "*.ttc"):
            for path in glob.glob(os.path.join(d, "**", ext), recursive=True):
                base = os.path.basename(path).lower()
                if any(k in base for k in ("cjk", "hei", "song", "han", "yahei", "ming")):
                    try:
                        fm.fontManager.addfont(path)
                    except Exception:
                        continue
    available = {f.name for f in fm.fontManager.ttflist}
    for name in CANDIDATES:
        if name in available:
            plt.rcParams["font.sans-serif"] = [name, "DejaVu Sans"]
            plt.rcParams["axes.unicode_minus"] = False
            return name

    print("[warn] 未找到可用 CJK 字体，中文可能显示为方块")
    return None
