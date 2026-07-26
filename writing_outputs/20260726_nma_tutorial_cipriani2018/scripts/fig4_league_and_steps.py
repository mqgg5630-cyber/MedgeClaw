# -*- coding: utf-8 -*-
"""图4：联赛表（league table）怎么读 + 读一篇网状 Meta 的 8 步流程。"""
import os
import sys
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _cjk import setup_cjk_font

setup_cjk_font()
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "figures")

fig = plt.figure(figsize=(15.5, 7.6))
gs = fig.add_gridspec(1, 2, width_ratios=[1.15, 1], wspace=0.13)

# ================= 左：联赛表读法 =================
ax = fig.add_subplot(gs[0, 0])
drugs = ["阿米替林", "米氮平", "艾司西酞普兰", "氟西汀", "瑞波西汀"]
n = len(drugs)

# 示意数值：上三角=疗效OR，下三角=可接受度OR
eff = {(0, 1): "1.13", (0, 2): "1.27", (0, 3): "1.40", (0, 4): "1.55",
       (1, 2): "1.12", (1, 3): "1.24", (1, 4): "1.38",
       (2, 3): "1.11", (2, 4): "1.23",
       (3, 4): "1.11"}
sig = {(0, 3), (0, 4), (1, 4), (2, 4)}  # 加粗=显著

ax.set_xlim(-0.15, n + 2.6)
ax.set_ylim(-0.9, n + 1.5)
ax.invert_yaxis()
ax.axis("off")

for i in range(n):
    for j in range(n):
        x, y = j, i
        if i == j:
            ax.add_patch(Rectangle((x, y), 1, 1, facecolor="#1E3A5F", edgecolor="white", lw=1.6))
            ax.text(x + 0.5, y + 0.5, drugs[i], ha="center", va="center",
                    color="white", fontsize=9.6, fontweight="bold")
        elif i < j:
            v = eff[(i, j)]
            is_sig = (i, j) in sig
            ax.add_patch(Rectangle((x, y), 1, 1,
                                   facecolor="#DBEAFE" if is_sig else "#F1F5F9",
                                   edgecolor="white", lw=1.6))
            ax.text(x + 0.5, y + 0.5, v, ha="center", va="center", fontsize=10.5,
                    fontweight="bold" if is_sig else "normal",
                    color="#1E3A5F" if is_sig else "#64748B")
        else:
            ax.add_patch(Rectangle((x, y), 1, 1, facecolor="#FEF3C7",
                                   edgecolor="white", lw=1.6, alpha=0.5))

ax.text(n / 2, n + 0.75, "上三角（蓝）：疗效 OR   ｜   下三角（黄）：可接受度 OR",
        ha="center", fontsize=11, color="#334155", fontweight="bold")

ax.annotate("蓝底加粗\n= 可信区间不跨 1\n= 统计学上确有差别",
            xy=(4.95, 0.5), xytext=(5.6, 1.9),
            fontsize=10.2, color="#1E3A5F", ha="left", va="center",
            arrowprops=dict(arrowstyle="-|>", color="#1E3A5F", lw=1.8,
                            connectionstyle="arc3,rad=-0.25"))
ax.text(n / 2, -0.45,
        "读法：先找行、再找列，交叉格 = 这两种药的对比结果",
        ha="center", fontsize=10.5, color="#334155", style="italic")

ax.set_title("A. 联赛表（league table）：任意两种药的两两比较",
             fontsize=13.5, fontweight="bold", pad=12)

# ================= 右：8 步阅读流程 =================
ax2 = fig.add_subplot(gs[0, 1])
ax2.set_xlim(0, 10)
ax2.set_ylim(0, 10)
ax2.axis("off")

steps = [
    ("1", "看 PICO", "人群、干预、对照、结局分别是什么"),
    ("2", "看证据网络图", "线粗不粗？有没有孤零零的点"),
    ("3", "查同质性/可迁移性", "各研究人群是否可比（transitivity）"),
    ("4", "看森林图", "点估计 + 区间是否跨过无效线"),
    ("5", "看联赛表", "关心的两种药之间到底差多少"),
    ("6", "查一致性检验", "直接证据 vs 间接证据打不打架"),
    ("7", "看 SUCRA 排名", "排名只是概率，别当成绝对高下"),
    ("8", "查 GRADE 证据等级", "结论到底有多可信"),
]

COL = ["#1E3A5F", "#2E5A88", "#0F766E", "#059669",
       "#D97706", "#B45309", "#9333EA", "#C0392B"]

for k, ((num, title, desc), c) in enumerate(zip(steps, COL)):
    y = 9.35 - k * 1.16
    ax2.add_patch(FancyBboxPatch((0.35, y - 0.42), 9.2, 0.86,
                                 boxstyle="round,pad=0.02,rounding_size=0.12",
                                 facecolor="#F8FAFC", edgecolor=c, lw=1.6))
    ax2.add_patch(FancyBboxPatch((0.5, y - 0.30), 0.62, 0.62,
                                 boxstyle="round,pad=0.01,rounding_size=0.1",
                                 facecolor=c, edgecolor="none"))
    ax2.text(0.81, y, num, ha="center", va="center", color="white",
             fontsize=13, fontweight="bold")
    ax2.text(1.32, y + 0.16, title, ha="left", va="center", fontsize=12,
             fontweight="bold", color=c)
    ax2.text(1.32, y - 0.20, desc, ha="left", va="center", fontsize=10.2,
             color="#475569")

ax2.text(5, 0.15, "口诀：先看网 → 再看图 → 最后看「这结论有多可信」",
         ha="center", va="center", fontsize=11.5, fontweight="bold", color="#1E3A5F")

ax2.set_title("B. 读一篇网状 Meta 的 8 步流程", fontsize=13.5, fontweight="bold", pad=12)

fig.suptitle("图4  联赛表读法 与 网状 Meta 阅读流程",
             fontsize=15, fontweight="bold", y=1.0)
fig.tight_layout(rect=[0, 0, 1, 0.95])
p = os.path.join(OUT, "fig4_league_and_steps.png")
fig.savefig(p, dpi=170, bbox_inches="tight", facecolor="white")
print("saved", p)
