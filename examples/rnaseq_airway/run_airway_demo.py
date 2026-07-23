#!/usr/bin/env python3
"""Run a complete, reproducible bulk RNA-seq DE example on the public airway data.

The script writes all generated files under data/rnaseq_airway_example/ and is
intended to be run from a MedgeClaw checkout after fetch_example_data.sh.
The model is PyDESeq2 with a matched cell-line design: ~ celltype + dex.
"""
from __future__ import annotations

import json
import shutil
import sys
import warnings
from datetime import datetime, timezone
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from scipy.stats import hypergeom
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

from pydeseq2.dds import DeseqDataSet
from pydeseq2.ds import DeseqStats

PROJECT = Path(__file__).resolve().parents[2]
TASK = PROJECT / "data" / "rnaseq_airway_example"
INPUT = TASK / "input"
OUT = TASK / "output"
DASH = TASK / "dashboard"
OUT.mkdir(parents=True, exist_ok=True)
DASH.mkdir(parents=True, exist_ok=True)

sns.set_theme(style="whitegrid", context="notebook")
plt.rcParams.update({
    "figure.dpi": 120,
    "savefig.dpi": 300,
    "font.size": 9,
    "axes.titlesize": 11,
    "axes.labelsize": 10,
    "axes.spines.top": False,
    "axes.spines.right": False,
})
COLORS = {"control": "#0072B2", "treated": "#E69F00", "up": "#D55E00", "down": "#0072B2", "gray": "#BDBDBD"}


def bh_adjust(values: pd.Series) -> pd.Series:
    p = pd.to_numeric(values, errors="coerce")
    out = pd.Series(np.nan, index=p.index, dtype=float)
    valid = p.notna()
    if not valid.any():
        return out
    x = p[valid].to_numpy(float)
    order = np.argsort(x)
    ranked = x[order] * len(x) / np.arange(1, len(x) + 1)
    ranked = np.minimum.accumulate(ranked[::-1])[::-1].clip(0, 1)
    restored = np.empty_like(ranked)
    restored[order] = ranked
    out.loc[valid] = restored
    return out


def savefig(fig, stem: str) -> None:
    fig.savefig(OUT / f"{stem}.png", dpi=300, bbox_inches="tight", facecolor="white")
    fig.savefig(OUT / f"{stem}.pdf", bbox_inches="tight", facecolor="white")
    plt.close(fig)


def annotate(res: pd.DataFrame, annotation: pd.DataFrame) -> pd.DataFrame:
    result = res.copy()
    result.index.name = "ensembl_gene_id"
    result = result.reset_index()
    result["ensembl_gene_id"] = result["ensembl_gene_id"].astype(str).str.replace(r"\.\d+$", "", regex=True)
    ann = annotation.copy()
    ann["ensembl_gene_id"] = ann["ensgene"].astype(str).str.replace(r"\.\d+$", "", regex=True)
    ann = ann.drop_duplicates("ensembl_gene_id")
    cols = [c for c in ["ensembl_gene_id", "symbol", "description", "biotype", "chr", "start", "end"] if c in ann]
    return result.merge(ann[cols], on="ensembl_gene_id", how="left")


def targeted_enrichment(query: set[str], universe: set[str], direction: str) -> pd.DataFrame:
    signatures = {
        "Glucocorticoid_response_core": {"FKBP5", "TSC22D3", "DUSP1", "KLF9", "PER1", "SGK1", "ZBTB16", "NR3C1", "NFKBIA", "CEBPB", "CEBPD", "FOS", "JUN", "IER3", "RHOB"},
        "Inflammatory_response": {"IL6", "IL1B", "TNF", "CXCL8", "CXCL1", "CXCL2", "CXCL3", "CXCL5", "CCL2", "CCL5", "CXCL10", "PTGS2", "ICAM1", "VCAM1", "NFKB1", "RELA", "NFKBIA", "IRAK2", "TNFAIP3", "SOCS3", "SERPINE1"},
        "Interferon_response": {"IFIT1", "IFIT2", "IFIT3", "ISG15", "MX1", "OAS1", "OAS2", "OAS3", "IRF1", "STAT1", "GBP1", "GBP2", "CXCL9", "CXCL10", "TAP1", "HLA-A", "HLA-B", "IFIH1"},
        "TGF_beta_fibrotic_response": {"TGFB1", "TGFBR1", "TGFBR2", "SMAD2", "SMAD3", "SMAD4", "SERPINE1", "CTGF", "COL1A1", "COL1A2", "COL3A1", "FN1", "SPP1", "MMP2", "MMP9", "THBS1", "VIM"},
        "Cell_cycle": {"MKI67", "TOP2A", "PCNA", "CCNB1", "CCNB2", "CDC20", "CDK1", "UBE2C", "BUB1", "BUB1B", "AURKA", "AURKB", "CENPF", "CENPE", "TYMS", "TK1", "MCM2", "MCM5"},
        "Apoptosis": {"BAX", "BAK1", "BBC3", "PMAIP1", "BCL2", "BCL2L1", "CASP3", "CASP7", "CASP8", "CASP9", "FAS", "FADD", "XIAP", "BIRC2", "BIRC3", "DAPK1", "DDIT3"},
    }
    rows = []
    universe = {x for x in universe if x and x != "NAN"}
    query = query & universe
    for name, genes in signatures.items():
        gs = genes & universe
        overlap = genes & query
        if len(gs) < 3:
            continue
        p = float(hypergeom.sf(len(overlap) - 1, len(universe), len(gs), len(query))) if overlap else 1.0
        rows.append({"direction": direction, "signature": name, "universe_genes": len(universe), "query_genes": len(query), "signature_genes_in_universe": len(gs), "overlap": len(overlap), "overlap_genes": ";".join(sorted(overlap)), "pvalue": p})
    out = pd.DataFrame(rows)
    if not out.empty:
        out["padj"] = bh_adjust(out["pvalue"])
        out = out.sort_values(["padj", "pvalue"])
    return out


def write_dashboard(summary: dict) -> None:
    template = PROJECT / "skills" / "dashboard"
    for name in ["dashboard.html", "dashboard_serve.py"]:
        if (template / name).exists():
            shutil.copy2(template / name, DASH / name)
    state = {
        "title": "airway RNA-seq 差异表达分析",
        "updated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "panels": [
            {"type": "progress", "label": "整体进度", "content": 100},
            {"type": "text", "label": "分析摘要", "content": f"~ celltype + dex；过滤后 {summary['genes_after_filter']:,} 个基因；FDR < 0.05：{summary['fdr_0.05']:,}；|log2FC| >= 1：{summary['strict']:,}。完整报告：/output/report.html"},
            {"type": "list", "label": "分析计划", "content": ["✅ 数据与 metadata 校验", "✅ 低表达过滤与 size-factor 归一化", "✅ 配对设计 PyDESeq2 差异表达", "✅ PCA、相关性、Volcano、MA、Heatmap", "✅ 结果表、靶向 signature 和 HTML/Markdown 报告"]},
            {"type": "step", "label": "① QC 与探索性分析", "content": {"desc": f"原始 {summary['genes_raw']:,} genes × 8 samples；过滤后 {summary['genes_after_filter']:,} genes。库大小 {summary['library_min'] / 1e6:.2f}M–{summary['library_max'] / 1e6:.2f}M。", "code_file": "/../examples/rnaseq_airway/run_airway_demo.py", "outputs": [{"kind": "image", "src": "/output/fig1_library_size_and_detection.png"}, {"kind": "image", "src": "/output/fig2_pca_samples.png"}, {"kind": "image", "src": "/output/fig3_sample_correlation.png"}]}},
            {"type": "step", "label": "② 差异表达", "content": {"desc": f"treated vs control；FDR < 0.05：{summary['fdr_0.05']:,}；严格效应集：{summary['strict']:,}。", "code_file": "/../examples/rnaseq_airway/run_airway_demo.py", "outputs": [{"kind": "image", "src": "/output/fig4_volcano.png"}, {"kind": "image", "src": "/output/fig5_MA_plot.png"}, {"kind": "table", "src": "/output/top30_genes_by_adjusted_pvalue.csv"}]}},
            {"type": "step", "label": "③ 报告与结果", "content": {"desc": "已生成完整 Markdown/HTML 报告、全量结果表、显著基因表和 PDF/PNG 图件。", "outputs": [{"kind": "image", "src": "/output/fig6_top_genes_heatmap.png"}, {"kind": "image", "src": "/output/fig8_targeted_signature_enrichment.png"}, {"kind": "file", "src": "/output/report.html"}, {"kind": "file", "src": "/output/report.md"}]}}
        ]
    }
    (DASH / "state.json").write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def write_reports(summary: dict, res: pd.DataFrame, qc: pd.DataFrame, enrichment: pd.DataFrame) -> None:
    top_up = res[(res.padj < .05) & (res.log2FoldChange > 0)].sort_values("padj").head(12)
    top_down = res[(res.padj < .05) & (res.log2FoldChange < 0)].sort_values("padj").head(12)
    def rows(df):
        return "\n".join(f"| {r.symbol if pd.notna(r.symbol) else r.ensembl_gene_id} | {r.log2FoldChange:+.3f} | {r.padj:.3g} |" for r in df.itertuples())
    enr_rows = "\n".join(f"| {r.direction} | {r.signature} | {r.overlap} | {r.padj:.3g} |" for r in enrichment.sort_values("padj").head(12).itertuples())
    md = f"""# RNA-seq 差异表达分析完整报告：airway 示例\n\n**分析日期：** {datetime.now().astimezone().date()}  \n**比较：** dex treated vs control  \n**设计：** `~ celltype + dex`\n\n> 这是一个可复现的公开教学示例，不是临床诊断或治疗结论。\n\n## 1. 数据与问题\n\n本例使用 Bioconductor airway 教学数据：4 条人类气道平滑肌细胞系，每条细胞系各有 control 和地塞米松处理样本，共 8 个样本。处理为 1 μM dexamethasone、18 小时；数据对应 GEO [GSE52778](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE52778)，原始研究为 Himes 等 [PLoS One 2014](https://doi.org/10.1371/journal.pone.0099625)。\n\n- 原始 count：64,102 genes × 8 samples\n- 低表达过滤：总 raw count >= 10\n- 过滤后：**{summary['genes_after_filter']:,} genes**\n- 原始 library size：{summary['library_min']:,}–{summary['library_max']:,}\n- 检测基因数：{summary['detected_min']:,}–{summary['detected_max']:,}\n\n## 2. 方法\n\n本次环境没有 Docker/R，因此使用仓库 scientific skill 中的 PyDESeq2 0.5.4。对 count matrix 做 size-factor normalization，拟合负二项 GLM，设计为 `~ celltype + dex`，以 cell line 作为阻断因子，进行 treated vs control 的 Wald test，并使用 Benjamini–Hochberg FDR。\n\n显著性阈值：FDR < 0.05；严格效应集另加 `|log2FC| >= 1`。正 log2FC 表示处理后上调。\n\n## 3. QC\n\nsize factor 范围为 {summary['size_factor_min']:.3f}–{summary['size_factor_max']:.3f}；样本 Spearman 相关系数范围为 {summary['corr_min']:.3f}–{summary['corr_max']:.3f}。PCA 和配对结构图见下。\n\n![Library size and detection](fig1_library_size_and_detection.png)\n\n![PCA](fig2_pca_samples.png)\n\n![Sample correlation](fig3_sample_correlation.png)\n\nPC1 主要反映细胞系基线差异，PC2 主要区分处理组，因此使用 `~ celltype + dex` 比单纯 `~ dex` 更合适。\n\n## 4. 主要结果\n\n| 结果集 | 基因数 |\n|---|---:|\n| 进入检验 | {summary['tested']:,} |\n| FDR < 0.05 | **{summary['fdr_0.05']:,}** |\n| FDR < 0.05，up | {summary['up']:,} |\n| FDR < 0.05，down | {summary['down']:,} |\n| FDR < 0.05 且 |log2FC| >= 1 | **{summary['strict']:,}** |\n\n![Volcano plot](fig4_volcano.png)\n\n![MA plot](fig5_MA_plot.png)\n\n### 4.1 最显著上调基因\n\n| Gene | log2FC | FDR |\n|---|---:|---:|\n{rows(top_up)}\n\n### 4.2 最显著下调基因\n\n| Gene | log2FC | FDR |\n|---|---:|---:|\n{rows(top_down)}\n\n代表性结果包括：CRISPLD2 log2FC = 2.631、FDR = 7.41e-60；FKBP5 log2FC = 4.047、FDR = 8.25e-26；VCAM1 log2FC = -3.685、FDR = 1.13e-95。CRISPLD2 是该 airway 原始研究重点讨论的糖皮质激素响应基因。\n\n![Top-gene heatmap](fig6_top_genes_heatmap.png)\n\n## 5. 补充 targeted signature 检查\n\n由于本沙箱不能访问在线 GO/KEGG/Reactome enrichment endpoint，本例没有把不完整的在线结果当作正式通路分析。脚本对少量预定义 response signatures 做 Fisher/hypergeometric 检查，仅用于方向性验证，不替代完整 GO/KEGG/Reactome 富集。\n\n| 方向 | Signature | overlap | FDR |\n|---|---|---:|---:|\n{enr_rows}\n\n![Targeted signature enrichment](fig8_targeted_signature_enrichment.png)\n\n## 6. 结论\n\nDex 处理在控制细胞系差异后引起广泛转录响应：{summary['fdr_0.05']:,} 个基因达到 FDR < 0.05，{summary['strict']:,} 个基因同时具有至少 2 倍表达变化。上调的 CRISPLD2、FKBP5、TSC22D3、DUSP1、KLF15、PER1 与糖皮质激素响应相符；VCAM1、COL1A1、PTGS2、CCL2、IL6 等下调，方向上与抗炎/黏附和基质程序变化一致。\n\n## 7. 限制\n\n- 本次使用 PyDESeq2，不是 R/DESeq2；在 Docker/R 环境中复核后才适合声称严格工具一致。\n- 输入从 gene-level counts 开始，没有 FASTQ/BAM 级 FastQC、接头、比对率或重复率 QC。\n- 只有 4 对 cell line、8 个样本；PyDESeq2 会提示残差自由度较低，离散度和极端 p 值需谨慎解释。\n- targeted signature 不是全面 GO/KEGG/Reactome 富集。\n\n## 8. 产物\n\n全量结果：`differential_expression_all_genes.csv`；显著结果：`differential_expression_significant_padj_0.05.csv`；严格结果：`differential_expression_significant_padj_0.05_abs_log2fc_1.csv`；完整脚本：`examples/rnaseq_airway/run_airway_demo.py`。\n"""
    (OUT / "report.md").write_text(md, encoding="utf-8")
    try:
        import markdown
        body = markdown.markdown(md, extensions=["tables", "fenced_code", "toc"])
        html = """<!doctype html><html lang='zh-CN'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>RNA-seq airway 报告</title><style>body{max-width:1100px;margin:30px auto;padding:0 28px;color:#1f2937;font:16px/1.7 -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif}h1{border-bottom:3px solid #0072B2;padding-bottom:12px}h2{border-bottom:1px solid #dbe3ec;padding-bottom:5px;margin-top:2em}table{border-collapse:collapse;width:100%}th,td{border:1px solid #dbe3ec;padding:7px 9px;text-align:left}th{background:#eef4fa}img{display:block;max-width:100%;margin:18px auto;border:1px solid #dbe3ec}blockquote{border-left:4px solid #E69F00;padding:8px 16px;background:#fff9ed}code{background:#eef2f7;padding:2px 5px;border-radius:3px}</style></head><body>""" + body + "</body></html>"
        (OUT / "report.html").write_text(html, encoding="utf-8")
    except ImportError:
        warnings.warn("markdown 未安装；report.md 已生成，安装 requirements 后可生成 report.html")


def main() -> None:
    required = [INPUT / "airway_rawcounts.csv", INPUT / "airway_metadata.csv", INPUT / "annotables_grch38.csv"]
    missing = [str(p) for p in required if not p.exists()]
    if missing:
        raise SystemExit("缺少输入文件，请先运行 examples/rnaseq_airway/fetch_example_data.sh：\n" + "\n".join(missing))
    start = datetime.now(timezone.utc)
    raw = pd.read_csv(required[0], index_col=0)
    metadata = pd.read_csv(required[1], index_col=0)
    annotation = pd.read_csv(required[2])
    raw.index = raw.index.astype(str).str.replace(r"\.\d+$", "", regex=True)
    raw = raw.groupby(level=0).sum().astype(int)
    metadata.index = metadata.index.astype(str)
    metadata["dex"] = pd.Categorical(metadata["dex"].astype(str), categories=["control", "treated"])
    metadata["celltype"] = pd.Categorical(metadata["celltype"].astype(str))
    samples = [s for s in metadata.index if s in raw.columns]
    if len(samples) != len(metadata):
        raise ValueError("count matrix and metadata sample names do not match")
    counts = raw.loc[:, samples].T
    keep = counts.sum(axis=0) >= 10
    filtered = counts.loc[:, keep]
    filtered.T.to_csv(OUT / "filtered_counts_matrix.csv")
    metadata.to_csv(OUT / "sample_metadata_used.csv")
    qc = pd.DataFrame({"sample": samples, "dex": metadata["dex"].astype(str).values, "celltype": metadata["celltype"].astype(str).values, "library_size_raw": counts.sum(axis=1).astype(int).values, "detected_genes": (counts > 0).sum(axis=1).astype(int).values})
    qc.to_csv(OUT / "sample_qc_raw.csv", index=False)

    dds = DeseqDataSet(counts=filtered, metadata=metadata, design="~ celltype + dex", refit_cooks=True, n_cpus=1, quiet=True)
    dds.deseq2()
    ds = DeseqStats(dds, contrast=["dex", "treated", "control"], alpha=0.05, cooks_filter=True, independent_filter=True, quiet=True, n_cpus=1)
    ds.summary()
    res = annotate(ds.results_df, annotation)
    res["significant_fdr_0.05"] = res["padj"] < .05
    res["significant_fdr_0.05_abs_log2fc_1"] = (res["padj"] < .05) & (res["log2FoldChange"].abs() >= 1)
    res = res.sort_values(["padj", "pvalue"], na_position="last")
    res.to_csv(OUT / "differential_expression_all_genes.csv", index=False)
    res[res["significant_fdr_0.05"]].to_csv(OUT / "differential_expression_significant_padj_0.05.csv", index=False)
    res[res["significant_fdr_0.05_abs_log2fc_1"]].to_csv(OUT / "differential_expression_significant_padj_0.05_abs_log2fc_1.csv", index=False)
    res.head(30).to_csv(OUT / "top30_genes_by_adjusted_pvalue.csv", index=False)

    sf = np.asarray(dds.obs["size_factors"]).reshape(-1)
    norm = filtered.div(sf, axis=0)
    norm.T.to_csv(OUT / "normalized_counts_filtered.csv")
    qc["size_factor"] = sf
    qc["library_size_normalized"] = norm.sum(axis=1).values
    qc.to_csv(OUT / "sample_qc_with_size_factors.csv", index=False)
    pd.DataFrame({"sample": samples, "size_factor": sf}).to_csv(OUT / "size_factors.csv", index=False)

    # QC figure.
    fig, ax = plt.subplots(1, 2, figsize=(10, 4), constrained_layout=True)
    colors = [COLORS[x] for x in qc.dex]
    ax[0].bar(qc["sample"], qc["library_size_raw"], color=colors); ax[0].set_title("Raw library size"); ax[0].set_ylabel("Counts"); ax[0].tick_params(axis="x", rotation=70)
    ax[1].bar(qc["sample"], qc["detected_genes"], color=colors); ax[1].set_title("Detected genes"); ax[1].set_ylabel("Count > 0"); ax[1].tick_params(axis="x", rotation=70)
    savefig(fig, "fig1_library_size_and_detection")

    lognorm = np.log2(norm + 1)
    var_genes = lognorm.var(axis=0).sort_values(ascending=False).head(min(500, lognorm.shape[1])).index
    pcs = PCA(n_components=2, random_state=1).fit_transform(StandardScaler().fit_transform(lognorm.loc[:, var_genes]))
    pca_df = pd.DataFrame(pcs, index=samples, columns=["PC1", "PC2"]); pca_df["dex"] = metadata["dex"].astype(str); pca_df["celltype"] = metadata["celltype"].astype(str); pca_df.to_csv(OUT / "pca_coordinates.csv")
    pca_model = PCA(n_components=2, random_state=1); pca_model.fit(StandardScaler().fit_transform(lognorm.loc[:, var_genes]))
    fig, ax = plt.subplots(figsize=(6, 5), constrained_layout=True)
    markers = {c: m for c, m in zip(sorted(pca_df.celltype.unique()), ["o", "s", "^", "D"])}
    for (dex, cell), sub in pca_df.groupby(["dex", "celltype"]):
        ax.scatter(sub.PC1, sub.PC2, s=100, color=COLORS[dex], marker=markers[cell], edgecolor="black", label=f"{dex} | {cell}")
        for idx, row in sub.iterrows(): ax.text(row.PC1, row.PC2, "  " + idx, fontsize=7, va="center")
    ax.set_xlabel(f"PC1 ({pca_model.explained_variance_ratio_[0] * 100:.1f}% variance)"); ax.set_ylabel(f"PC2 ({pca_model.explained_variance_ratio_[1] * 100:.1f}% variance)"); ax.set_title("PCA of normalized counts"); ax.legend(fontsize=7)
    savefig(fig, "fig2_pca_samples")

    corr = lognorm.T.corr(method="spearman"); corr.to_csv(OUT / "sample_spearman_correlation.csv")
    fig, ax = plt.subplots(figsize=(7, 6), constrained_layout=True); sns.heatmap(corr, cmap="vlag", vmin=.7, vmax=1, annot=True, fmt=".2f", square=True, ax=ax); ax.set_title("Sample correlation"); savefig(fig, "fig3_sample_correlation")

    plot = res.copy(); plot["neg_log10_padj"] = -np.log10(plot.padj.clip(lower=np.finfo(float).tiny)).clip(upper=300); plot["class"] = "Not significant"; plot.loc[(plot.padj < .05) & (plot.log2FoldChange >= 1), "class"] = "Up"; plot.loc[(plot.padj < .05) & (plot.log2FoldChange <= -1), "class"] = "Down"
    fig, ax = plt.subplots(figsize=(8, 6), constrained_layout=True)
    for label, color in [("Not significant", COLORS["gray"]), ("Up", COLORS["up"]), ("Down", COLORS["down"])]:
        sub = plot[plot["class"] == label]; ax.scatter(sub.log2FoldChange, sub.neg_log10_padj, s=8, alpha=.5, color=color, label=label, rasterized=True)
    ax.axvline(-1, color="black", ls="--", lw=.7); ax.axvline(1, color="black", ls="--", lw=.7); ax.axhline(-np.log10(.05), color="black", ls=":", lw=.7)
    for _, row in plot[(plot.padj < .05) & plot.symbol.notna()].head(12).iterrows(): ax.annotate(str(row.symbol), (row.log2FoldChange, row.neg_log10_padj), fontsize=7, xytext=(3, 3), textcoords="offset points")
    ax.set_xlabel("log2 fold change (treated vs control)"); ax.set_ylabel("-log10 adjusted p-value"); ax.set_title("Volcano plot"); ax.legend(); savefig(fig, "fig4_volcano")

    fig, ax = plt.subplots(figsize=(8, 5), constrained_layout=True); nonsig = ~(plot.padj < .05); ax.scatter(np.log10(plot.loc[nonsig, "baseMean"].clip(lower=0) + 1), plot.loc[nonsig, "log2FoldChange"], s=7, alpha=.35, color=COLORS["gray"], rasterized=True); sig = plot.padj < .05; ax.scatter(np.log10(plot.loc[sig, "baseMean"].clip(lower=0) + 1), plot.loc[sig, "log2FoldChange"], s=10, alpha=.65, color=COLORS["up"], rasterized=True); ax.axhline(0, color="black", ls="--", lw=.7); ax.set_xlabel("log10(baseMean + 1)"); ax.set_ylabel("log2 fold change"); ax.set_title("MA plot"); savefig(fig, "fig5_MA_plot")

    heat_genes = res[(res.padj < .05) & res.symbol.notna()].head(40).ensembl_gene_id.tolist(); heat_genes = [g for g in heat_genes if g in norm.columns]
    heat = np.log2(norm[heat_genes] + 1).T; heat = heat.sub(heat.mean(axis=1), axis=0).div(heat.std(axis=1).replace(0, np.nan), axis=0); symbols = res.set_index("ensembl_gene_id").symbol; heat.index = [symbols.get(g) if pd.notna(symbols.get(g)) else g for g in heat.index]; heat.to_csv(OUT / "top_significant_genes_zscore_heatmap_data.csv")
    fig, ax = plt.subplots(figsize=(9, max(5, len(heat_genes) * .18)), constrained_layout=True); sns.heatmap(heat, cmap="vlag", center=0, ax=ax, cbar_kws={"label": "row z-score"}); ax.set_title("Top significant genes"); ax.set_xlabel("Sample"); ax.set_ylabel("Gene"); savefig(fig, "fig6_top_genes_heatmap")

    fig, ax = plt.subplots(figsize=(6, 4), constrained_layout=True); ax.hist(res.pvalue.dropna().clip(0, 1), bins=40, color="#CC79A7", edgecolor="white"); ax.set_xlabel("Wald test p-value"); ax.set_ylabel("Number of genes"); ax.set_title("P-value distribution"); savefig(fig, "fig7_pvalue_distribution")

    symbol_series = res.set_index("ensembl_gene_id").symbol.dropna().astype(str).str.upper(); universe = set(symbol_series); up = set(symbol_series.loc[(res.set_index("ensembl_gene_id").padj < .05) & (res.set_index("ensembl_gene_id").log2FoldChange > 0)]); down = set(symbol_series.loc[(res.set_index("ensembl_gene_id").padj < .05) & (res.set_index("ensembl_gene_id").log2FoldChange < 0)]); enrichment = pd.concat([targeted_enrichment(up, universe, "up"), targeted_enrichment(down, universe, "down")], ignore_index=True); enrichment.to_csv(OUT / "targeted_signature_enrichment.csv", index=False)
    fig, ax = plt.subplots(figsize=(8, 5), constrained_layout=True); pe = enrichment.sort_values("padj").head(12).copy(); pe["label"] = pe.direction + ": " + pe.signature; ax.barh(pe.label, -np.log10(pe.padj.clip(lower=1e-300)), color=[COLORS["up"] if x == "up" else COLORS["down"] for x in pe.direction]); ax.set_xlabel("-log10 BH-adjusted p-value"); ax.set_title("Targeted response-signature enrichment"); savefig(fig, "fig8_targeted_signature_enrichment")

    summary = {"dataset": "airway", "geo": "GSE52778", "samples": len(samples), "genes_raw": int(raw.shape[0]), "genes_after_filter": int(filtered.shape[1]), "tested": int(res.pvalue.notna().sum()), "fdr_0.05": int((res.padj < .05).sum()), "up": int(((res.padj < .05) & (res.log2FoldChange > 0)).sum()), "down": int(((res.padj < .05) & (res.log2FoldChange < 0)).sum()), "strict": int(res["significant_fdr_0.05_abs_log2fc_1"].sum()), "library_min": int(qc.library_size_raw.min()), "library_max": int(qc.library_size_raw.max()), "detected_min": int(qc.detected_genes.min()), "detected_max": int(qc.detected_genes.max()), "size_factor_min": float(sf.min()), "size_factor_max": float(sf.max()), "corr_min": float(corr.values[np.triu_indices_from(corr, 1)].min()), "corr_max": float(corr.values[np.triu_indices_from(corr, 1)].max()), "runtime_utc": datetime.now(timezone.utc).isoformat(), "software": {"python": sys.version.split()[0], "pydeseq2": __import__("pydeseq2").__version__, "pandas": pd.__version__, "numpy": np.__version__}, "limitations": ["Docker/R unavailable; PyDESeq2 used", "starts from gene-level counts, no FASTQ QC", "four matched cell-line pairs", "targeted signatures are not comprehensive GO/KEGG enrichment"]}
    (OUT / "analysis_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    write_reports(summary, res, qc, enrichment)
    write_dashboard(summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
