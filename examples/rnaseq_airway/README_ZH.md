# airway RNA-seq 示例：从克隆到跑通

这个目录提供一个可以从公开数据开始跑通的 bulk RNA-seq 差异表达示例。它不依赖 OpenClaw、Docker 或模型 API；只需要 Git、Python 和网络即可验证分析主线。

完整报告会生成到：

```text
data/rnaseq_airway_example/output/report.html
data/rnaseq_airway_example/output/report.md
```

## 0. 克隆 MedgeClaw

为了立即拿到本示例，请克隆本 Arena 分支：

```bash
cd ~/projects

git clone --branch arena/019f8d6f-medgeclaw \
  --single-branch --recurse-submodules \
  https://github.com/mqgg5630-cyber/MedgeClaw.git

cd MedgeClaw
```

如果你已经克隆但没有拉取子模块：

```bash
git submodule update --init --recursive
```

> 如果这个分支以后已经合并到 `main`，可以把上面的 `--branch arena/019f8d6f-medgeclaw --single-branch` 去掉。

## 1. 建 Python 虚拟环境

推荐不要污染 conda `base`：

```bash
python3 -m venv "$HOME/.venvs/medgeclaw-rnaseq"
source "$HOME/.venvs/medgeclaw-rnaseq/bin/activate"

python -m pip install --upgrade pip
python -m pip install -r examples/rnaseq_airway/requirements.txt
```

如果 `python3 -m venv` 报错，在 Ubuntu/WSL 中先执行：

```bash
sudo apt update
sudo apt install -y python3-venv
```

确认依赖：

```bash
python - <<'PY'
import pydeseq2, pandas, numpy, scipy, sklearn, matplotlib, seaborn
print('PyDESeq2:', pydeseq2.__version__)
print('pandas:', pandas.__version__)
print('numpy:', numpy.__version__)
print('依赖检查通过')
PY
```

## 2. 下载公开示例数据

脚本使用 sparse Git clone，只拉取 3 个需要的文件，不会把整个教学仓库全部下载下来：

```bash
bash examples/rnaseq_airway/fetch_example_data.sh
```

输入文件会放在：

```text
data/rnaseq_airway_example/input/airway_rawcounts.csv
data/rnaseq_airway_example/input/airway_metadata.csv
data/rnaseq_airway_example/input/annotables_grch38.csv
```

如果你所在网络不能访问 GitHub，可以手动下载同名文件放入上述目录；来源是：

- https://github.com/bioconnector/workshops/blob/master/data/airway_rawcounts.csv
- https://github.com/bioconnector/workshops/blob/master/data/airway_metadata.csv
- https://github.com/bioconnector/workshops/blob/master/data/annotables_grch38.csv

## 3. 运行完整 RNA-seq 分析

```bash
python examples/rnaseq_airway/run_airway_demo.py
```

大约需要 1–3 分钟，取决于电脑性能。正常情况下最后会打印 JSON 摘要，类似：

```text
samples: 8
genes_raw: 64102
genes_after_filter: 22369
fdr_0.05: 3924
strict: 1043
```

分析内容包括：

- count matrix 和 sample metadata 校验
- 低表达过滤
- PyDESeq2 size-factor 归一化
- `~ celltype + dex` 配对/阻断设计
- treated vs control Wald test
- BH FDR 校正
- library size、PCA、样本相关性
- Volcano plot、MA plot、top-gene heatmap
- targeted response signature 检查
- Markdown/HTML 完整报告
- Dashboard 文件生成

## 4. 验证是否跑通

```bash
python - <<'PY'
from pathlib import Path
import json
import pandas as pd

out = Path('data/rnaseq_airway_example/output')
summary = json.loads((out / 'analysis_summary.json').read_text())
res = pd.read_csv(out / 'differential_expression_all_genes.csv')

assert summary['samples'] == 8
assert summary['genes_after_filter'] > 20000
assert summary['fdr_0.05'] > 0
assert (out / 'report.html').exists()
assert (out / 'fig4_volcano.png').exists()
assert len(res) == summary['tested']

print('✅ RNA-seq demo test passed')
print('   FDR < 0.05:', summary['fdr_0.05'])
print('   |log2FC| >= 1:', summary['strict'])
print('   Report:', out / 'report.html')
PY
```

## 5. 查看报告

在 WSL 中启动一个本地服务器：

```bash
python -m http.server 8000 --directory data/rnaseq_airway_example/output
```

然后在 Windows 浏览器打开：

```text
http://localhost:8000/report.html
```

## 6. 查看 Research Dashboard

项目的 Dashboard 需要以任务目录为根目录启动：

```bash
python data/rnaseq_airway_example/dashboard/dashboard_serve.py \
  --root data/rnaseq_airway_example \
  --port 7788
```

浏览器打开：

```text
http://localhost:7788/dashboard/dashboard.html
```

如果 WSL2 的 localhost 转发不可用，查询 WSL IP：

```bash
hostname -I
```

然后访问：

```text
http://<WSL_IP>:7788/dashboard/dashboard.html
```

## 7. 主要产物

```text
data/rnaseq_airway_example/output/
├── report.html
├── report.md
├── analysis_summary.json
├── differential_expression_all_genes.csv
├── differential_expression_significant_padj_0.05.csv
├── differential_expression_significant_padj_0.05_abs_log2fc_1.csv
├── normalized_counts_filtered.csv
├── sample_qc_with_size_factors.csv
├── fig1_library_size_and_detection.png/pdf
├── fig2_pca_samples.png/pdf
├── fig3_sample_correlation.png/pdf
├── fig4_volcano.png/pdf
├── fig5_MA_plot.png/pdf
├── fig6_top_genes_heatmap.png/pdf
├── fig7_pvalue_distribution.png/pdf
└── fig8_targeted_signature_enrichment.png/pdf
```

## 8. 本示例的统计结论

在控制细胞系差异后，22,369 个过滤后基因中：

- 3,924 个 FDR < 0.05
- 1,043 个同时满足 FDR < 0.05 且 |log2FC| >= 1
- 上调代表基因：`CRISPLD2`、`FKBP5`、`TSC22D3`、`DUSP1`、`KLF15`
- 下调代表基因：`VCAM1`、`COL1A1`、`PTGS2`、`CCL2`、`IL6`

## 9. 这和 MedgeClaw 的 Docker 环境是什么关系？

这个示例是为了让你在没有 Docker、没有 OpenClaw 的情况下，先把 RNA-seq 分析跑通。MedgeClaw 完整部署仍然可以按项目根目录 README 操作：

```bash
cp .env.example .env
# 编辑 .env，填写模型 API 配置
bash setup.sh
python3 sync.py
docker compose up -d
```

本地 Demo 采用 PyDESeq2；严格的 R/DESeq2 复核应在 Docker/R 环境中使用相同设计 `~ celltype + dex` 再跑一次。
