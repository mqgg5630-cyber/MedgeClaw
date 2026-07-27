# 生物科研 Skills 全景清单（文献 → 数据 → 分析 → 建模 → 写作发表）

本清单盘点 MedgeClaw 仓库中**所有与生物 / 医学科研相关的 skills**，按科研工作流的 8 个阶段组织，覆盖从文献搜索到代码实现的完整链路。

## 来源与总量

| 来源 | 路径 | 数量 | 说明 |
| --- | --- | --- | --- |
| K-Dense Scientific Skills | `scientific-skills/scientific-skills/` (submodule) | 150 | 数据库、算法库、组学分析、药物发现 |
| K-Dense Scientific Writer | `scientific-writer/skills/` (submodule) | 22 | 文献综述、写作、审稿、海报、幻灯 |
| MedgeClaw 自有 skills | `skills/` | 7 | 调度、复现、可视化、Dashboard、飞书卡片 |

> 两个 submodule 默认为空，需先执行 `git submodule update --init --depth 1`。
> 两份 skills 集合有约 22 个同名条目（writer 的 skills 在 K-Dense 主库中也做了镜像），去重后生物科研可用条目约 **135 个**，其中与生物医学**直接相关**的约 **95 个**（下文列出），其余为金融 / 天文 / 量子 / 材料 / 地理等跨领域通用能力。

---

## 阶段 1 · 文献搜索与调研（12）

| Skill | 用途 |
| --- | --- |
| `pubmed-database` | PubMed E-utilities 直连，布尔 / MeSH 高级检索、批量抓取 |
| `biorxiv-database` | bioRxiv 预印本按关键词 / 作者 / 日期 / 分类检索，下载 PDF |
| `openalex-database` | OpenAlex 学术图谱：作者、机构、引用、研究趋势分析 |
| `literature-review` | 跨库（PubMed / arXiv / bioRxiv / Semantic Scholar）系统性综述流程 |
| `bgpt-paper-search` | 从全文中抽取结构化实验数据（方法、样本量、结论等 25+ 字段） |
| `research-lookup` | Perplexity Sonar Pro 实时检索，自动选模型 |
| `perplexity-search` | 通用 AI 联网搜索（LiteLLM / OpenRouter） |
| `citation-management` | Google Scholar / PubMed 元数据抽取、DOI→BibTeX、引用校验 |
| `scholar-evaluation` | ScholarEval 框架量化评估研究质量 |
| `open-notebook` | 自建 NotebookLM 替代品，文献资料库问答 |
| `markitdown` | PDF / DOCX / PPTX / 图片 OCR → Markdown，喂给 LLM 前的预处理 |
| `uspto-database` | 专利与在先技术检索（转化医学 / IP 场景） |

## 阶段 2 · 假设生成与科研设计（6）

| Skill | 用途 |
| --- | --- |
| `scientific-brainstorming` | 开放式选题、跨学科连接、找研究空白 |
| `hypothesis-generation` | 从观察到可检验假设：预测、机制、实验设计 |
| `hypogenic` | LLM 驱动的表格数据自动假设生成与检验 |
| `scientific-critical-thinking` | 证据质量评估（GRADE、Cochrane 偏倚风险）、混杂识别 |
| `denario` | 多智能体科研系统：从数据 → 方法 → 实验 → 论文全自动 |
| `get-available-resources` | 任务启动前探测 CPU / GPU / 内存 / 磁盘，规划算力 |

## 阶段 3 · 生物数据库检索（26）

**基因与基因组**：`gene-database`（NCBI Gene）、`ensembl-database`（250+ 物种 REST + VEP）、`ena-database`（ENA 序列 / FASTQ / 组装）、`geo-database`（GEO 表达谱 GSE/GSM/GPL）、`gwas-database`（GWAS Catalog SNP-性状关联）、`clinvar-database`（变异致病性）、`cosmic-database`（体细胞突变、Cancer Gene Census、突变签名）、`gget`（20+ 数据库统一 CLI 快查）

**蛋白与结构**：`uniprot-database`、`pdb-database`（RCSB 3D 结构）、`alphafold-database`（2 亿预测结构 + pLDDT/PAE）、`string-database`（蛋白互作网络 + GO/KEGG 富集）

**通路与代谢**：`kegg-database`、`reactome-database`、`hmdb-database`（22 万代谢物）、`brenda-database`（酶动力学 Km/kcat）、`metabolomics-workbench-database`（4200+ 代谢组研究）

**药物与化合物**：`chembl-database`（生物活性 IC50/Ki、SAR）、`pubchem-database`（1.1 亿化合物）、`drugbank-database`、`zinc-database`（2.3 亿可购化合物，虚拟筛选）、`opentargets-database`（靶点-疾病关联、成药性）、`pytdc`（Therapeutics Data Commons AI-ready 数据集）

**临床与监管**：`clinicaltrials-database`（ClinicalTrials.gov API v2）、`fda-database`（openFDA 不良事件、召回、510k/PMA）、`clinpgx-database`（药物基因组 CPIC 指南）

**跨库聚合**：`bioservices`（40+ 生信服务统一 Python 接口）

## 阶段 4 · 组学数据分析（代码实现）（20）

**单细胞**：`scanpy`（QC → 归一化 → PCA/UMAP → 聚类 → DE 标准流程）、`anndata`（.h5ad 数据结构）、`scvi-tools`（深度生成模型、批次校正、多模态）、`cellxgene-census`（6100 万细胞图谱查询）、`arboreto`（GRNBoost2/GENIE3 基因调控网络）

**Bulk 转录组**：`pydeseq2`（差异表达、Wald 检验、火山图/MA 图）、`deeptools`（BAM→bigWig、TSS heatmap，ChIP/ATAC/RNA-seq 可视化）

**测序文件与变异**：`pysam`（SAM/BAM/CRAM、VCF/BCF、FASTA/FASTQ）、`tiledbvcf`（群体规模变异存储与并行查询）、`geniml`（BED 区间的机器学习、Region2Vec、scATAC）、`gtars`（Rust 高性能区间运算）

**序列与系统发育**：`biopython`（序列操作、格式解析、Entrez、BLAST 自动化）、`scikit-bio`（比对、多样性指标、UniFrac、PCoA、PERMANOVA，微生物组）、`etetoolkit`（Newick 树操作、直系/旁系同源、NCBI 分类）

**蛋白与结构生物学**：`esm`（ESM3 生成式蛋白设计 / ESM C 嵌入）、`diffdock`（扩散模型分子对接位姿预测）

**质谱与代谢组**：`pyopenms`（LC-MS/MS 全流程：特征检测、肽鉴定、蛋白定量）、`matchms`（谱图相似度、未知化合物鉴定）

**其他实验数据**：`flowio`（流式细胞 FCS 文件解析）、`cobrapy`（约束基础代谢建模 FBA/FVA、基因敲除）

## 阶段 5 · 药物发现与化学信息学（8）

| Skill | 用途 |
| --- | --- |
| `rdkit` | 底层化学信息学：SMILES/SDF、描述符、指纹、子结构、反应 |
| `datamol` | RDKit 的 Pythonic 封装，标准化 / 聚类 / 3D 构象，日常首选 |
| `medchem` | 成药性规则（Lipinski、Veber）、PAINS、结构警报过滤 |
| `molfeat` | 100+ 分子特征化器（ECFP、MACCS、ChemBERTa 预训练） |
| `deepchem` | 分子 ML：ADMET / 毒性预测、MoleculeNet 基准 |
| `torchdrug` | PyTorch 原生 GNN：药物发现、蛋白建模、逆合成 |
| `rowan` | 云端量子化学：pKa、几何优化、AutoDock Vina 对接、Chai-1/Boltz 共折叠 |
| `pymoo` | 多目标优化（NSGA-II/III），分子多属性优化场景可用 |

## 阶段 6 · 临床、影像与医学 AI（12）

**临床数据与医学 AI**：`pyhealth`（EHR 机器学习全流程）、`scikit-survival`（Cox、随机生存森林、生存 SVM）、`neurokit2`（ECG/EEG/EDA/PPG/EMG 生理信号处理）、`neuropixels-analysis`（Kilosort4 spike sorting、质量指标）

**医学影像**：`pydicom`（DICOM 读写）、`imaging-data-commons`（NCI IDC 的 CT/MR/PET 与病理数据）、`histolab`（WSI 切片提取、组织检测、染色归一化）、`pathml`（计算病理：多重免疫荧光 CODEX/Vectra、细胞核分割、组织图）、`omero-integration`（显微镜数据管理、高内涵筛选）

**临床文书与决策**：`clinical-reports`（CARE 病例报告、ICH-E3 CSR、SOAP/H&P）、`clinical-decision-support`（生物标志物分层队列、GRADE 证据分级）、`treatment-plans`（LaTeX/PDF 治疗方案）

## 阶段 7 · 通用统计、机器学习与可视化（代码实现）（17）

**统计**：`statistical-analysis`（检验选择、假设检查、效能分析、APA 报告）、`statsmodels`（OLS/GLM/混合模型/ARIMA + 诊断）、`pymc`（贝叶斯层次模型、MCMC、LOO/WAIC）

**机器学习 / 深度学习**：`scikit-learn`、`pytorch-lightning`、`transformers`、`torch_geometric`（GNN）、`shap`（可解释性）、`umap-learn`（降维）、`aeon`（时间序列 ML）、`networkx`（网络分析）

**可视化**：`scientific-visualization`（Nature/Science/Cell 期刊级多面板图元技能）、`matplotlib`、`seaborn`、`plotly`

**大数据与工程**：`polars`、`dask`、`vaex`、`zarr-python`（分块 N 维数组 / 云存储）、`modal`（云端 GPU 无服务器执行）
（注：`exploratory-data-analysis` 支持 200+ 科学文件格式的自动 EDA，是每次拿到新数据的第一步。）

## 阶段 8 · 写作、图表与发表（14）

| Skill | 用途 |
| --- | --- |
| `scientific-writing` | 核心写作技能：IMRAD、成段散文（禁止 bullet）、两阶段大纲→行文 |
| `venue-templates` | Nature / Science / PLOS / IEEE / NeurIPS 及 NSF/NIH 模板 |
| `research-grants` | NSF、NIH、DOE、DARPA 标书撰写与评审标准 |
| `peer-review` | 结构化审稿清单：方法学、统计有效性、可复现性 |
| `scientific-schematics` | AI 生成出版级示意图（通路图、网络架构、流程） |
| `infographics` | 信息图，带 Gemini 3 Pro 质量复审迭代 |
| `scientific-slides` | 学术报告 / 答辩幻灯 |
| `latex-posters` | beamerposter / tikzposter 会议海报 |
| `pptx-posters` | 仅在明确要求 PPTX 时使用 |
| `paper-2-web` | 论文 → 交互网站 / 讲解视频 |
| `markdown-mermaid-writing` | 文本化图表作为默认文档标准 |
| `generate-image` | FLUX / Gemini 通用图像生成 |
| `document-skills` | 文档处理套件 |
| `iso-13485-certification` | 医疗器械质量体系文档（法规方向） |

## 阶段 9 · 实验室与平台集成（9）

`benchling-integration`（R&D 平台：注册表、库存、ELN）、`labarchive-integration`（电子实验记录本 API）、`protocolsio-integration`（实验方案检索 / 发布）、`opentrons-integration`（OT-2/Flex 移液机器人协议）、`pylabrobot`（跨厂商实验室自动化：Hamilton、Tecan、酶标仪）、`adaptyv`（云实验室蛋白湿实验验证）、`lamindb`（生物数据 FAIR 化、可追溯）、`dnanexus-integration`（云基因组平台、app/workflow）、`latchbio-integration`（Latch SDK、Nextflow/Snakemake 流水线）

## MedgeClaw 自有 skills（7）

| Skill | 用途 |
| --- | --- |
| `biomed-dispatch` | **入口调度**：把生信 / 基因组 / 药物发现 / 临床分析任务派发给 Claude Code + K-Dense skills |
| `paper-reproduce` | 论文复现方法论：数据探索 → 变量映射 → 样本筛选 → 回归 → Markdown/LaTeX 复现报告 |
| `charls-reproduce` | CHARLS 数据库专用：变量映射、认知功能评分、CESD-10、社会隔离指数、慢病编码 |
| `dashboard` | 本地实时任务看板（进度、代码、产物预览） |
| `cjk-viz` | matplotlib 中文字体检测，避免图表方块乱码（画中文图前必跑） |
| `svg-ui-templates` | 列表 / 清单 / 流水线状态 / 富文本四类 SVG 面板 |
| `feishu-rich-card` | 飞书图文富卡片推送分析结果 |

---

## 端到端串联示例：一次完整的生物科研任务

```
选题        scientific-brainstorming → hypothesis-generation
文献        literature-review → pubmed-database + biorxiv-database → citation-management
数据获取    geo-database / cellxgene-census / clinicaltrials-database
环境检查    get-available-resources → cjk-viz（如需中文图）
探索        exploratory-data-analysis → anndata / polars
分析        scanpy（单细胞）或 pydeseq2（bulk）→ string-database / reactome-database 富集
建模        scikit-learn / scvi-tools / scikit-survival → shap 解释
可视化      scientific-visualization + matplotlib/seaborn
批判性检查  scientific-critical-thinking → statistical-analysis 复核
写作        scientific-writing → scientific-schematics → venue-templates → peer-review
汇报        dashboard / feishu-rich-card / scientific-slides / latex-posters
```

## 非生物领域（可忽略，共约 24 个）

金融经济：`alpha-vantage`、`edgartools`、`fred-economic-data`、`usfiscaldata`、`hedgefundmonitor`、`market-research-reports`、`datacommons-client`
量子计算：`qiskit`、`cirq`、`pennylane`、`qutip`
物理材料天文：`astropy`、`pymatgen`、`fluidsim`、`sympy`、`matlab`
强化学习 / 仿真 / 其他：`stable-baselines3`、`pufferlib`、`simpy`、`geopandas`、`timesfm-forecasting`、`offer-k-dense-web`、`parallel-web`

> 其中 `sympy`、`matlab`、`simpy`、`timesfm-forecasting` 在药代动力学建模、流行病学仿真、生理时序预测等场景仍可复用。

## 快速使用

```bash
# 拉取全部 skills
git submodule update --init --depth 1

# 查看某个 skill 的完整说明
cat scientific-skills/scientific-skills/scanpy/SKILL.md

# 关键词检索
grep -ril "single-cell" scientific-skills/scientific-skills/*/SKILL.md
```
