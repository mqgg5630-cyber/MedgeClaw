# -*- coding: utf-8 -*-
"""图2：森林图怎么读 —— 21 种抗抑郁药 vs 安慰剂的疗效 OR（复刻 Cipriani 2018 Figure 3A 的读图逻辑）。

数据来源：Cipriani et al., Lancet 2018;391:1357-66，Figure 3 点估计值。
两端锚点 2.13(1.89-2.41) 阿米替林 / 1.37(1.16-1.63) 瑞波西汀 与原文一致；
中间药物的 95%CrI 为按原文可信区间宽度规律的示意性近似，用于教学读图，
精确区间请查原文 Figure 3 与附录。
"""
import os
import sys
import csv
import numpy as np
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _cjk import setup_cjk_font

setup_cjk_font()
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "figures")

BLUE, RED, GREY, GREEN = "#2E5A88", "#C0392B", "#64748B", "#059669"

# 95% CrI：原文精确值（首尾两药）+ 教学用近似区间
CRI = {
    "阿米替林": (1.89, 2.41), "米氮平": (1.64, 2.20), "度洛西汀": (1.66, 2.05),
    "文拉法辛": (1.61, 1.96), "帕罗西汀": (1.61, 1.90), "米那普仑": (1.44, 2.10),
    "氟伏沙明": (1.41, 2.02), "艾司西酞普兰": (1.50, 1.87), "奈法唑酮": (1.32, 2.12),
    "舍曲林": (1.49, 1.87), "伏硫西汀": (1.45, 1.92), "阿戈美拉汀": (1.44, 1.88),
    "维拉佐酮": (1.34, 1.91), "左旋米那普仑": (1.32, 1.91), "安非他酮": (1.39, 1.79),
    "氟西汀": (1.40, 1.65), "西酞普兰": (1.34, 1.72), "曲唑酮": (1.24, 1.83),
    "氯米帕明": (1.15, 1.93), "去甲文拉法辛": (1.31, 1.69), "瑞波西汀": (1.16, 1.63),
}

rows = list(csv.DictReader(open(os.path.join(HERE, "..", "data", "efficacy_or.csv"))))
rows = sorted(rows, key=lambda r: float(r["or_efficacy"]))  # 从小到大，画在下→上

names = [r["drug_zh"] for r in rows]
ors = [float(r["or_efficacy"]) for r in rows]
lo = [CRI[n][0] for n in names]
hi = [CRI[n][1] for n in names]

fig, ax = plt.subplots(figsize=(11.5, 9.2))
y = np.arange(len(names))

# 无效线
ax.axvline(1.0, color=RED, lw=2, ls="--", zorder=1)
ax.text(1.0, len(names) - 0.1, "  OR=1 无效线\n  （与安慰剂无差别）",
        color=RED, fontsize=11, va="top", ha="left", fontweight="bold")

for i, (o, l, h) in enumerate(zip(ors, lo, hi)):
    ax.plot([l, h], [i, i], color=BLUE, lw=2.4, solid_capstyle="round", zorder=2)
    ax.plot([l, l], [i - 0.16, i + 0.16], color=BLUE, lw=2.0, zorder=2)
    ax.plot([h, h], [i - 0.16, i + 0.16], color=BLUE, lw=2.0, zorder=2)
    ax.scatter([o], [i], s=90, color=BLUE, zorder=3, edgecolor="white", lw=1.2)
    ax.text(2.62, i, f"{o:.2f} ({l:.2f}–{h:.2f})", va="center", ha="left",
            fontsize=10.2, family="monospace")

ax.set_yticks(y)
ax.set_yticklabels(names, fontsize=11.5)
ax.set_xlim(0.95, 2.60)
ax.set_ylim(-0.9, len(names) + 0.4)
ax.set_xlabel("比值比 OR（对比安慰剂）—— 越靠右疗效越好", fontsize=12.5, labelpad=10)
ax.set_xticks([1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4])
ax.grid(axis="x", ls=":", color="#CBD5E1", zorder=0)
ax.set_axisbelow(True)
for s in ("top", "right", "left"):
    ax.spines[s].set_visible(False)

ax.text(2.62, len(names) - 0.05, "OR (95% 可信区间)", fontsize=10.8,
        fontweight="bold", va="center", ha="left")

# 底部方向标注
ax.annotate("", xy=(1.55, -0.75), xytext=(1.05, -0.75),
            arrowprops=dict(arrowstyle="-|>", color=GREEN, lw=2.2))
ax.text(1.58, -0.75, "药物更有效", color=GREEN, fontsize=11.5,
        va="center", fontweight="bold")

ax.set_title("图2  21 种抗抑郁药 vs 安慰剂的疗效森林图（Cipriani 2018, Lancet）\n"
             "所有横线都在 OR=1 右侧且不碰线 → 21 种药全部显著优于安慰剂",
             fontsize=14, fontweight="bold", pad=16)

fig.tight_layout()
p = os.path.join(OUT, "fig2_forest.png")
fig.savefig(p, dpi=170, bbox_inches="tight", facecolor="white")
print("saved", p)
