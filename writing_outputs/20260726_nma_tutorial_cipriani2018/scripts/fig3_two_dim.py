# -*- coding: utf-8 -*-
"""图3：疗效 × 可接受度 二维象限图（复刻 Cipriani 2018 Figure 5 的读图逻辑）。

X 轴 = 疗效 OR（越右越有效）；Y 轴 = 全因脱落 OR（越低越少人退出 = 越好耐受）。
理想药物 = 右下角（有效 + 好耐受）。
"""
import os
import sys
import csv
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _cjk import setup_cjk_font

setup_cjk_font()
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "figures")

rows = list(csv.DictReader(open(os.path.join(HERE, "..", "data", "efficacy_or.csv"))))
COLORS = {"SSRI": "#2E5A88", "SNRI": "#0F766E", "三环类 TCA": "#C0392B", "其他": "#D97706"}

fig, ax = plt.subplots(figsize=(11.5, 8.8))

XMIN, XMAX, YMIN, YMAX = 1.28, 2.30, 0.78, 1.40
xm, ym = 1.65, 1.05  # 分界线

# 右下 = 理想区（有效 + 脱落少）
ax.fill_between([xm, XMAX], YMIN, ym, color="#DCFCE7", alpha=0.7, zorder=0)
# 左上 = 不利区（疗效弱 + 脱落多）
ax.fill_between([XMIN, xm], ym, YMAX, color="#FEE2E2", alpha=0.55, zorder=0)

ax.text(XMAX - 0.02, YMIN + 0.015, "理想区：有效 + 好耐受", ha="right", va="bottom",
        fontsize=13, color="#166534", fontweight="bold", zorder=1)
ax.text(XMIN + 0.02, YMAX - 0.015, "不利区：疗效偏弱 + 更易脱落", ha="left", va="top",
        fontsize=13, color="#991B1B", fontweight="bold", zorder=1)

ax.axvline(xm, color="#94A3B8", ls="--", lw=1.5, zorder=1)
ax.axhline(ym, color="#94A3B8", ls="--", lw=1.5, zorder=1)
ax.axhline(1.0, color="#C0392B", ls=":", lw=1.6, zorder=1)
ax.text(XMIN + 0.015, 0.998, "脱落 OR=1（与安慰剂一样）", fontsize=9.5,
        color="#C0392B", va="bottom", ha="left", zorder=2)

seen = set()
for r in rows:
    x, y = float(r["or_efficacy"]), float(r["or_acceptability"])
    c = COLORS[r["class_zh"]]
    lbl = r["class_zh"] if r["class_zh"] not in seen else None
    seen.add(r["class_zh"])
    ax.scatter(x, y, s=150, color=c, edgecolor="white", lw=1.8, zorder=3, label=lbl)

OFF = {
    "阿米替林": (0, -0.022), "米氮平": (0.028, 0.010), "度洛西汀": (0.028, 0.012),
    "文拉法辛": (-0.028, 0.014), "帕罗西汀": (0.026, -0.014), "米那普仑": (-0.026, 0.014),
    "氟伏沙明": (0.026, 0.012), "艾司西酞普兰": (0.026, -0.012), "奈法唑酮": (-0.026, 0.014),
    "舍曲林": (0.026, 0.014), "伏硫西汀": (-0.026, -0.012), "阿戈美拉汀": (0.026, 0.012),
    "维拉佐酮": (0.026, 0.012), "左旋米那普仑": (-0.026, -0.014), "安非他酮": (-0.026, 0.014),
    "氟西汀": (-0.026, -0.014), "西酞普兰": (-0.026, 0.014), "曲唑酮": (0.026, -0.012),
    "氯米帕明": (0.026, 0.012), "去甲文拉法辛": (-0.026, 0.014), "瑞波西汀": (0.026, 0.012),
}
for r in rows:
    x, y = float(r["or_efficacy"]), float(r["or_acceptability"])
    dx, dy = OFF.get(r["drug_zh"], (0.02, 0.012))
    ha = "left" if dx > 0 else ("right" if dx < 0 else "center")
    ax.text(x + dx, y + dy, r["drug_zh"], fontsize=10.2, ha=ha, va="center",
            color="#1E293B", zorder=4)

ax.set_xlim(XMIN, XMAX)
ax.set_ylim(YMIN, YMAX)
ax.set_xlabel("疗效 OR（对比安慰剂）→ 越靠右越有效", fontsize=12.5, labelpad=10)
ax.set_ylabel("全因脱落 OR（对比安慰剂）↓ 越靠下越少人中途停药", fontsize=12.5, labelpad=10)
ax.grid(ls=":", color="#E2E8F0", zorder=0)
ax.set_axisbelow(True)
for s in ("top", "right"):
    ax.spines[s].set_visible(False)

ax.legend(title="药物类别", loc="upper right", fontsize=10.5, title_fontsize=11,
          frameon=True, framealpha=0.95)
ax.set_title("图3  疗效 × 可接受度：一张图看懂「哪些药两头都好」\n"
             "（点越靠右下角＝既有效、又不容易让人中途停药）",
             fontsize=14, fontweight="bold", pad=16)

fig.tight_layout()
p = os.path.join(OUT, "fig3_two_dim.png")
fig.savefig(p, dpi=170, bbox_inches="tight", facecolor="white")
print("saved", p)
