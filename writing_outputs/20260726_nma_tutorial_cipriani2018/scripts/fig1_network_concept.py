# -*- coding: utf-8 -*-
"""图1：从传统 Meta 到网状 Meta —— 直接比较 vs 间接比较的概念图。"""
import os
import sys
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _cjk import setup_cjk_font

setup_cjk_font()
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "figures")

BLUE, ORANGE, GREY, GREEN = "#2E5A88", "#D97706", "#94A3B8", "#059669"

fig, axes = plt.subplots(1, 3, figsize=(15, 5.4))

def node(ax, xy, label, color=BLUE, r=0.13):
    ax.add_patch(Circle(xy, r, facecolor=color, edgecolor="white", lw=2.2, zorder=3))
    ax.text(xy[0], xy[1], label, ha="center", va="center", color="white",
            fontsize=12.5, fontweight="bold", zorder=4)

def edge(ax, p1, p2, color=GREY, ls="-", lw=2.6, r=0.13):
    d = np.array(p2) - np.array(p1)
    L = np.hypot(*d)
    u = d / L
    a, b = np.array(p1) + u * r, np.array(p2) - u * r
    ax.plot([a[0], b[0]], [a[1], b[1]], color=color, ls=ls, lw=lw, zorder=1,
            solid_capstyle="round")

# ---------- 面板 A：传统成对 Meta ----------
ax = axes[0]
A, B = (0.3, 0.55), (0.9, 0.55)
edge(ax, A, B, BLUE, lw=4)
node(ax, A, "A药")
node(ax, B, "B药")
ax.text(0.6, 0.68, "有 12 项 RCT\n直接比过", ha="center", va="bottom",
        fontsize=11, color=BLUE, fontweight="bold")
ax.text(0.6, 0.30, "传统成对 Meta 分析\n一次只能回答\n「A 和 B 谁更好」",
        ha="center", va="top", fontsize=12.5)
ax.set_title("A. 传统 Meta：一次一对", fontsize=14, fontweight="bold", pad=14)

# ---------- 面板 B：间接比较 ----------
ax = axes[1]
P, A2, B2 = (0.6, 0.30), (0.28, 0.78), (0.92, 0.78)
edge(ax, P, A2, BLUE, lw=4)
edge(ax, P, B2, BLUE, lw=4)
edge(ax, A2, B2, ORANGE, ls="--", lw=3.2)
node(ax, P, "安慰剂", color=GREY, r=0.155)
node(ax, A2, "A药")
node(ax, B2, "B药")
ax.text(0.6, 0.90, "A vs B：没人直接比过\n→ 用安慰剂当「桥」推算",
        ha="center", va="bottom", fontsize=11, color=ORANGE, fontweight="bold")
ax.text(0.30, 0.50, "A vs 安慰剂\n(直接)", ha="right", va="center",
        fontsize=10.5, color=BLUE)
ax.text(0.90, 0.50, "B vs 安慰剂\n(直接)", ha="left", va="center",
        fontsize=10.5, color=BLUE)
ax.text(0.6, 0.13, "间接比较：A优于安慰剂 60%，B优于安慰剂 20%\n→ 推算 A 比 B 好约 40%",
        ha="center", va="top", fontsize=11.5)
ax.set_title("B. 间接比较：借「共同对照」搭桥", fontsize=14, fontweight="bold", pad=14)

# ---------- 面板 C：完整证据网络 ----------
ax = axes[2]
drugs = ["安慰剂", "A药", "B药", "C药", "D药", "E药"]
n = len(drugs)
ang = np.linspace(90, 90 - 360, n, endpoint=False) * np.pi / 180
pos = {d: (0.6 + 0.33 * np.cos(a), 0.62 + 0.33 * np.sin(a)) for d, a in zip(drugs, ang)}
links = [("安慰剂", "A药", 5), ("安慰剂", "B药", 4), ("安慰剂", "C药", 3),
         ("安慰剂", "D药", 3), ("安慰剂", "E药", 2), ("A药", "B药", 3),
         ("B药", "C药", 2), ("A药", "C药", 2), ("C药", "D药", 1.5),
         ("D药", "E药", 1.5), ("A药", "D药", 1.2)]
for a, b, w in links:
    edge(ax, pos[a], pos[b], GREY, lw=w, r=0.115)
for d in drugs:
    node(ax, pos[d], d.replace("药", ""), color=GREY if d == "安慰剂" else BLUE, r=0.115)
ax.text(0.6, 0.02, "网状 Meta：所有药物连成一张网\n直接 + 间接证据一起算 → 全部两两比较 + 排序",
        ha="center", va="bottom", fontsize=11.5, color=GREEN, fontweight="bold")
ax.set_title("C. 网状 Meta：整张证据网一起算", fontsize=14, fontweight="bold", pad=14)

for ax in axes:
    ax.set_xlim(0, 1.2)
    ax.set_ylim(0, 1.12)
    ax.axis("off")

fig.suptitle("图1  网状 Meta 分析的核心思想：为什么它能比较「从没被直接比过」的两种药",
             fontsize=15.5, fontweight="bold", y=1.0)
fig.tight_layout(rect=[0, 0, 1, 0.94])
p = os.path.join(OUT, "fig1_network_concept.png")
fig.savefig(p, dpi=170, bbox_inches="tight", facecolor="white")
print("saved", p)
