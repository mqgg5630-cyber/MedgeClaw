// 内容源文件：肿瘤生物信息学 R 语言学习与复现手册（2026 版）
// 每个 block: {t: 类型, ...}
// 类型: h1 h2 h3 p b(bullet) n(number) code tbl links img note pb quote

const C = [];
const h1 = (x) => C.push({ t: 'h1', x });
const h2 = (x) => C.push({ t: 'h2', x });
const h3 = (x) => C.push({ t: 'h3', x });
const p  = (x) => C.push({ t: 'p', x });
const b  = (...x) => x.forEach((y) => C.push({ t: 'b', x: y }));
const n  = (id, ...x) => x.forEach((y) => C.push({ t: 'n', x: y, id }));
const code = (lang, x) => C.push({ t: 'code', lang, x });
const tbl = (head, rows, widths) => C.push({ t: 'tbl', head, rows, widths });
const note = (x) => C.push({ t: 'note', x });
const img = (path, w, h, cap) => C.push({ t: 'img', path, w, h, cap });
const pb = () => C.push({ t: 'pb' });
const toc = () => C.push({ t: 'toc' });

/* ============================== 封面 ============================== */
C.push({ t: 'title', x: '肿瘤生物信息学 R 语言学习与复现手册' });
C.push({ t: 'subtitle', x: '面向零基础的公开资源导航 · 可复现代码 · 单细胞专题（2026 年 7 月版）' });
p('');
tbl(
  ['项目', '说明'],
  [
    ['文档版本', 'v1.0（2026-07-26 编制）'],
    ['软件基线', 'R 4.6.0 + Bioconductor 3.23（2026-04-29 发布，2418 个软件包）'],
    ['适用人群', 'R 零基础 / 初学生信 / 需要复现肿瘤组学与单细胞分析的临床与基础科研人员'],
    ['内容构成', '学习路线图 + 精选公开教程与仓库链接 + 可直接运行的 R 代码 + 避坑清单'],
    ['链接核查', '全部链接与版本号于 2026-07-26 通过 GitHub API / CRAN / Bioconductor 官网实时核对'],
    ['生成方式', 'MedgeClaw · docx 文档技能生成；内容经 scientific-critical-thinking / geo-database / scanpy 等科学技能交叉校验'],
  ],
  [2400, 6960]
);
pb();

/* ============================== 使用说明 + 目录 ============================== */
h1('如何使用这本手册');
p('这本手册不是一篇综述，而是一份"打开链接就能开始做"的操作清单。它解决三个问题：学什么、去哪学、怎么让代码在自己电脑上真的跑起来。');
h3('三条使用路径');
tbl(
  ['你的情况', '建议路径', '预计耗时'],
  [
    ['完全没写过 R', '第 1 章装环境 → 第 2 章路线图 → 第 3 章 R 与 Bioconductor 入门 → 第 5 章跑通第一个差异分析', '2～3 周'],
    ['会一点 R，想做 TCGA/GEO 数据挖掘', '第 4 章数据获取 → 第 5～8 章（差异、富集、生存、突变、免疫浸润）', '3～4 周'],
    ['直接冲单细胞', '第 1 章装环境 → 第 9 章 Seurat v5 全流程 → 第 10 章高级专题（inferCNV、拟时序、细胞通讯）', '4～6 周'],
  ],
  [2600, 4760, 2000]
);
h3('阅读约定');
b(
  '灰底等宽字体 = 可直接复制到 RStudio 控制台运行的代码；代码里的注释以 # 开头。',
  '每章末尾的"避坑"段落，是初学者最常卡住的地方，建议先读一遍再写代码。',
  '链接表中的"更新"列是该仓库/网站最近一次内容更新时间，用来判断资料是否还"新鲜"；"星标"为 GitHub Stars。',
  '标注【强烈推荐】的资源，是同类里最值得优先投入时间的。'
);
note('重要提醒：所有版本号与链接的核查时间是 2026 年 7 月 26 日。生物信息软件迭代很快，半年后请以官网 NEWS/CHANGELOG 为准。判断一个 R 包还"活着"的最快方法：看它 GitHub 仓库最近一次 commit 是不是在 12 个月以内。');
pb();
toc();
pb();

/* ============================== 第1章 环境 ============================== */
h1('第 1 章 环境搭建：先让代码能跑起来');
p('90% 的初学者不是死在算法上，而是死在装包上。这一章的目标：用最少的折腾，得到一个能跑通全书代码的环境。');

h2('1.1 版本基线（2026 年 7 月）');
tbl(
  ['组件', '当前版本', '说明'],
  [
    ['R', '4.6.x', 'Bioconductor 3.23 要求 R 4.6，版本不匹配会导致 BiocManager 拒绝安装'],
    ['Bioconductor', '3.23（2026-04-29 发布）', '含 2418 个软件包；上一版 3.22 对应 R 4.5'],
    ['RStudio Desktop', '最新稳定版', '或使用 Positron / VS Code + R 扩展'],
    ['Seurat', '5.5.1（CRAN，2026-06-26）', '单细胞主力包，v5 的对象结构与 v4 有较大差异'],
  ],
  [2000, 2800, 4560]
);

h2('1.2 三种安装路线（按推荐度排序）');
h3('路线 A：本机安装（最常见）');
code('r', `# 1) 安装 BiocManager（Bioconductor 的包管理器）
if (!requireNamespace("BiocManager", quietly = TRUE))
  install.packages("BiocManager")

# 2) 确认你的 Bioconductor 版本；应输出 '3.23'
BiocManager::version()

# 3) 国内用户强烈建议设置镜像（放进 ~/.Rprofile 可永久生效）
options(repos = c(CRAN = "https://mirrors.tuna.tsinghua.edu.cn/CRAN/"))
options(BioC_mirror = "https://mirrors.tuna.tsinghua.edu.cn/bioconductor")

# 4) 一次性安装本书 Bulk 部分需要的包
BiocManager::install(c(
  "DESeq2", "edgeR", "limma", "clusterProfiler", "org.Hs.eg.db",
  "enrichplot", "GSVA", "fgsea", "ComplexHeatmap", "GEOquery",
  "TCGAbiolinks", "maftools", "biomaRt", "SummarizedExperiment"
), ask = FALSE, update = TRUE)

# 5) CRAN 侧的常用包
install.packages(c("tidyverse", "survival", "survminer", "glmnet",
                   "timeROC", "patchwork", "ggpubr", "pheatmap", "data.table"))`);

h3('路线 B：Docker（最省心，推荐给"装包总失败"的人）');
p('Rocker 项目提供了预装 R + RStudio + Bioconductor 的官方镜像，一条命令得到一个浏览器里的 RStudio，不污染本机环境。');
code('bash', `# 拉取并运行 Bioconductor 官方镜像（含 RStudio Server）
docker run -e PASSWORD=mypassword -p 8787:8787 \\
  -v $HOME/projects:/home/rstudio/projects \\
  bioconductor/bioconductor_docker:RELEASE_3_23

# 浏览器打开 http://localhost:8787
# 用户名 rstudio，密码 mypassword`);
b(
  'Rocker 项目主页：https://rocker-project.org/',
  'Bioconductor 官方 Docker 说明：https://bioconductor.org/help/docker/',
  '本仓库（MedgeClaw）自带 docker-compose，已集成 R + RStudio + JupyterLab，可直接 docker compose up。'
);

h3('路线 C：conda / mamba（跨语言项目适用）');
code('bash', `mamba create -n onco-r -c conda-forge -c bioconda \\
  r-base=4.6 r-seurat r-tidyverse r-harmony \\
  bioconductor-deseq2 bioconductor-clusterprofiler bioconductor-singler
mamba activate onco-r`);
note('避坑：Windows 用户请先装 Rtools（版本要与 R 主版本匹配），否则任何需要编译的源码包都会失败；macOS 用户装 Xcode Command Line Tools（xcode-select --install），Apple Silicon 还需 gfortran。Linux 用户常缺的系统依赖：libcurl4-openssl-dev、libxml2-dev、libhdf5-dev、libglpk-dev、libfftw3-dev。');

h2('1.3 让分析"可复现"的三件套');
tbl(
  ['工具', '作用', '链接'],
  [
    ['renv', '给每个项目锁定包版本，生成 renv.lock，换台电脑一键还原', 'https://rstudio.github.io/renv/'],
    ['Quarto / R Markdown', '代码 + 结果 + 文字合成一个文件，导出 HTML/PDF/Word', 'https://quarto.org/ ；https://bookdown.org/yihui/rmarkdown/'],
    ['Git + GitHub', '版本管理，也是你找资料时最主要的资源来源', 'https://happygitwithr.com/'],
  ],
  [1600, 4400, 3360]
);
code('r', `# 在项目目录里初始化 renv
renv::init()      # 扫描代码，建立项目私有包库
renv::snapshot()  # 把当前所有包版本写进 renv.lock
renv::restore()   # 换机器时，一键还原到完全一致的版本

# 每个脚本开头都写这两行，是可复现的最低成本保险
set.seed(20260726)
sessionInfo()`);
pb();

/* ============================== 第2章 路线图 ============================== */
h1('第 2 章 学习路线图：从零到能独立复现一篇文章');
img('figures/roadmap.png', 620, 341, '图 2-1　肿瘤生物信息学 R 语言学习路线（五阶段）');

h2('2.1 五个阶段与时间预算');
tbl(
  ['阶段', '要掌握的能力', '核心资源', '建议时长'],
  [
    ['① R 基础', '向量/数据框、读写文件、dplyr 管道、ggplot2 出图', 'R for Data Science (2e)、Intro-to-R-flipped', '1～2 周'],
    ['② Bioconductor 数据结构', '看懂 SummarizedExperiment 与 SingleCellExperiment，会取 assay/colData/rowData', 'carpentries bioc-intro、OSCA 前几章', '3～5 天'],
    ['③ 公共数据获取', '从 GDC/TCGA、GEO、UCSC Xena 拿到表达矩阵 + 临床信息并对齐', 'TCGAbiolinks 与 GEOquery 官方 vignette', '3～5 天'],
    ['④ Bulk 分析主线', '差异表达 → 富集 → 生存 → 突变 → 免疫浸润，能画出论文级别的图', 'rnaseqGene workflow、clusterProfiler 官方书', '2～3 周'],
    ['⑤ 单细胞主线', 'QC → 降维聚类 → 去批次 → 细胞注释 → CNV/拟时序/通讯', 'Seurat vignettes、OSCA、NBIS workshop', '4～6 周'],
  ],
  [1200, 3400, 3160, 1600]
);

h2('2.2 一个"能发文章"的最小技能闭环');
n('ml1',
  '拿到数据：TCGA 某癌种表达矩阵 + 临床随访；或 GEO 上一套带分组的数据集。',
  '质控与标准化：过滤低表达基因，counts → DESeq2/edgeR 做差异分析。',
  '生物学解释：差异基因做 GO/KEGG 富集、GSEA，找到通路层面的故事。',
  '临床关联：目标基因/评分做 Kaplan-Meier 与 Cox，画 ROC 判断预后价值。',
  '机制补充：单细胞数据定位到底是哪群细胞在表达这个基因，做细胞通讯与拟时序。',
  '可复现打包：Quarto 报告 + renv.lock + GitHub 仓库，投稿时审稿人要代码你能立刻给出。'
);
note('给初学者的忠告：不要一上来就追"最新最热的方法"。审稿人真正看重的是分析链条的自洽与可复现性。DESeq2（2014）和 Seurat 这些"老"工具至今仍是主流，正因为它们被反复验证过。');
pb();

/* ============================== 第3章 入门资源 ============================== */
h1('第 3 章 R 语言与 Bioconductor 入门资源');

h2('3.1 R 语言基础【必学】');
tbl(
  ['资源', '语言', '形式', '链接与说明'],
  [
    ['R for Data Science (2e)【强烈推荐】', '英文（有中文社区译本）', '免费在线书', 'https://r4ds.hadley.nz/　Hadley Wickham 著，tidyverse 官方教材，读前 12 章即可'],
    ['Intro to R (HBC, flipped)', '英文', '课程网页 + 练习', 'https://hbctraining.github.io/Intro-to-R-flipped/　哈佛医学院生信核心组，专为生物背景学员设计'],
    ['Introduction to data analysis with R and Bioconductor', '英文', 'Carpentries 课程', 'https://carpentries-incubator.github.io/bioc-intro/　2026-07 仍在更新，从 Excel 思维过渡到 R 最平滑'],
    ['ggplot2: Elegant Graphics for Data Analysis (3e)', '英文', '免费在线书', 'https://ggplot2-book.org/　出图卡住时的字典'],
    ['R Graphics Cookbook', '英文', '免费在线书', 'https://r-graphics.org/　按"我想画成什么样"直接查'],
  ],
  [2300, 1200, 1300, 4560]
);

h2('3.2 Bioconductor 数据结构【绕不开】');
p('Bioconductor 的世界里，几乎所有组学数据都装在两个容器里：SummarizedExperiment（bulk）与 SingleCellExperiment（单细胞）。搞懂它们，读别人的代码会轻松一半。');
code('r', `library(SummarizedExperiment)
# 假设 se 是一个 SummarizedExperiment 对象
assay(se)            # 表达矩阵：行=基因，列=样本
assayNames(se)       # 有哪些矩阵（counts / logcounts / tpm ...）
colData(se)          # 样本层面的元数据（分组、分期、生存时间）
rowData(se)          # 基因层面的注释（gene_id、symbol、biotype）
metadata(se)         # 实验层面的杂项
se[, se$group == "Tumor"]        # 按样本取子集
se[rowSums(assay(se)) > 10, ]    # 按基因过滤`);
tbl(
  ['资源', '链接', '备注'],
  [
    ['Bioconductor 官方安装页', 'https://www.bioconductor.org/install/', '确认当前 release 版本（现为 3.23 / R 4.6.0）'],
    ['Bioconductor 课程材料汇总', 'https://bioconductor.org/help/course-materials/', '历年 workshop 的幻灯片与代码'],
    ['BiocWorkshops 合集', 'https://bioconductor.github.io/BiocWorkshops/', '经典系统教程（2018 年，概念部分至今有效，代码需按新版微调）'],
    ['SummarizedExperiment vignette', 'https://bioconductor.org/packages/release/bioc/vignettes/SummarizedExperiment/inst/doc/SummarizedExperiment.html', '官方权威说明'],
  ],
  [2600, 4900, 1860]
);
note('避坑：Bioconductor 的包不要用 install.packages() 装，必须用 BiocManager::install()；同一环境里混装不同 Bioconductor 版本的包，是"函数找不到""S4 方法不匹配"这类怪错的头号原因。用 BiocManager::valid() 可以一键体检。');
pb();

/* ============================== 第4章 数据获取 ============================== */
h1('第 4 章 公共肿瘤数据从哪来、怎么拿');

h2('4.1 主要数据门户');
tbl(
  ['平台', '内容', '链接', '适合场景'],
  [
    ['GDC Data Portal', 'TCGA / TARGET / CPTAC 等，表达、突变、拷贝数、临床', 'https://portal.gdc.cancer.gov/', '肿瘤数据挖掘的第一站'],
    ['UCSC Xena', '已整理好的 pan-cancer 矩阵（237 队列 / 2256 数据集）', 'https://xenabrowser.net/datapages/', '不想写下载代码时，直接点下载表格'],
    ['cBioPortal', '538 个研究 / 近 40 万样本的突变与临床', 'https://www.cbioportal.org/', '快速查某个基因在各癌种的突变频率'],
    ['NCBI GEO', '海量 bulk 与单细胞数据集（GSE/GSM/GPL）', 'https://www.ncbi.nlm.nih.gov/geo/', '复现某篇具体文章的数据'],
    ['TISCH2', '190 套肿瘤单细胞数据集、约 630 万细胞，统一注释', 'https://tisch.compbio.cn/', '查某基因在肿瘤微环境中由哪群细胞表达'],
    ['CELLxGENE Discover', '标准化单细胞图谱，支持在线探索与下载 h5ad', 'https://cellxgene.cziscience.com/', '找参考图谱做细胞注释'],
    ['Human Protein Atlas', '蛋白/RNA 表达与预后信息', 'https://www.proteinatlas.org/', '快速验证候选基因'],
  ],
  [1700, 3100, 2760, 1800]
);

h2('4.2 用 TCGAbiolinks 下载 TCGA 表达矩阵（可直接运行）');
p('TCGAbiolinks 是 Bioconductor 上最主流的 GDC 数据接口（Bioconductor 3.23 收录，需 R 4.6）。下面这段以 TCGA-LIHC（肝癌）为例。');
code('r', `library(TCGAbiolinks)
library(SummarizedExperiment)

# 1) 构建查询：STAR 比对得到的基因表达定量
query <- GDCquery(
  project       = "TCGA-LIHC",
  data.category = "Transcriptome Profiling",
  data.type     = "Gene Expression Quantification",
  workflow.type = "STAR - Counts"
)

# 2) 下载（首次会比较久，文件存在当前目录 GDCdata/ 下）
GDCdownload(query, method = "api", files.per.chunk = 20)

# 3) 整理成 SummarizedExperiment
se <- GDCprepare(query)

# 4) 取出你要的矩阵与临床信息
counts <- assay(se, "unstranded")   # 原始 counts，用于 DESeq2/edgeR
tpm    <- assay(se, "tpm_unstrand") # TPM，用于样本间比较、画热图
clin   <- as.data.frame(colData(se))

# 5) 用条形码第 14-15 位区分肿瘤(01-09)与正常(10-19)
group <- ifelse(as.numeric(substr(colnames(counts), 14, 15)) < 10, "Tumor", "Normal")
table(group)

# 6) 下载体细胞突变（MAF），供第 8 章 maftools 使用
q_mut <- GDCquery(
  project       = "TCGA-LIHC",
  data.category = "Simple Nucleotide Variation",
  data.type     = "Masked Somatic Mutation",
  access        = "open"
)
GDCdownload(q_mut); maf_df <- GDCprepare(q_mut)`);

h2('4.3 用 GEOquery 抓 GEO 数据');
code('r', `library(GEOquery)

# 下载一套芯片数据集（destdir 指定缓存目录，避免每次重下）
gset <- getGEO("GSE39582", GSEMatrix = TRUE, destdir = "./geo_cache")
eset <- gset[[1]]

expr <- exprs(eset)      # 表达矩阵
pdat <- pData(eset)      # 样本临床信息（重点看这里的分组列）
fdat <- fData(eset)      # 探针注释

# 探针 → 基因 symbol：一个基因多探针时取表达量最大的那个
library(dplyr); library(tibble)
ann <- fdat[, c("ID", "Gene symbol")]; colnames(ann) <- c("probe", "symbol")
expr_gene <- as.data.frame(expr) |>
  rownames_to_column("probe") |>
  inner_join(ann, by = "probe") |>
  filter(symbol != "", !grepl("///", symbol)) |>
  mutate(rowmean = rowMeans(across(where(is.numeric)))) |>
  arrange(desc(rowmean)) |>
  distinct(symbol, .keep_all = TRUE) |>
  column_to_rownames("symbol") |>
  select(-probe, -rowmean)

# 高通量测序类 GSE 的 supplementary 文件（counts 表）这样拿：
# getGEOSuppFiles("GSE123456", baseDir = "./geo_cache")`);
tbl(
  ['工具/教程', '链接', '说明'],
  [
    ['TCGAbiolinks 官方文档', 'https://bioconductor.org/packages/release/bioc/html/TCGAbiolinks.html', 'Bioconductor 3.23 在册；vignette 里有各数据类型的完整示例'],
    ['TCGAWorkflow（官方工作流包）', 'https://bioconductor.org/packages/release/workflows/html/TCGAWorkflow.html', '从下载到通路分析的整段范例'],
    ['easyTCGA（中文友好）', 'https://github.com/ayueme/easyTCGA', '把下载与整理封装成一两个函数，初学者省时；156★，2025-09 更新'],
    ['GEOquery', 'https://bioconductor.org/packages/release/bioc/html/GEOquery.html', 'GEO 官方 R 接口'],
    ['Accessing public genomic data (HBC)', 'https://hbctraining.github.io/Accessing_public_genomic_data/', '手把手讲公共数据库结构与下载策略'],
    ['tinyarray', 'https://github.com/xjsun1221/tinyarray', '中文作者维护，芯片/TCGA 常规流程的快捷函数集'],
  ],
  [2200, 4400, 2760]
);
note('避坑三连：① TCGA 同一个病人可能有多个样本，做生存分析前要去重（保留 01A 主瘤样本）；② 临床表里的生存时间分散在 days_to_death 与 days_to_last_follow_up 两列，需要合并；③ GEO 的分组信息常藏在 pdata 的 characteristics_ch1 里，务必人工核对，不要凭样本顺序猜分组。');
pb();

/* ============================== 第5章 差异表达 ============================== */
h1('第 5 章 Bulk RNA-seq 差异表达分析');

h2('5.1 选哪个包');
tbl(
  ['包', '适用输入', '特点', '官方教程'],
  [
    ['DESeq2', '原始 counts', '小样本稳健，收缩估计好，最常用', 'https://bioconductor.org/packages/release/bioc/vignettes/DESeq2/inst/doc/DESeq2.html'],
    ['edgeR', '原始 counts', 'quasi-likelihood 检验，大样本快；用户手册极详尽', 'https://bioconductor.org/packages/release/bioc/vignettes/edgeR/inst/doc/edgeRUsersGuide.pdf'],
    ['limma-voom', 'counts 或芯片', '速度最快，复杂实验设计（配对、多因子）最灵活', 'https://bioconductor.org/packages/release/bioc/vignettes/limma/inst/doc/usersguide.pdf'],
  ],
  [1200, 1600, 3200, 3360]
);

h2('5.2 完整可运行示例（内置 airway 数据，无需下载）');
code('r', `# ── 准备：这段代码不依赖任何外部下载，复制即可跑通 ──
BiocManager::install(c("airway", "DESeq2", "EnhancedVolcano"))

library(airway); library(DESeq2)
data(airway)
se <- airway
se$dex <- relevel(se$dex, ref = "untrt")   # 指定对照组，方向别搞反

# 1) 构建 DESeq2 对象
dds <- DESeqDataSet(se, design = ~ cell + dex)   # cell 为批次/配对因素

# 2) 过滤低表达基因：至少在 3 个样本里 count >= 10
keep <- rowSums(counts(dds) >= 10) >= 3
dds  <- dds[keep, ]

# 3) 主分析（标准化 + 离散度估计 + 检验，一步完成）
dds <- DESeq(dds)
res <- results(dds, contrast = c("dex", "trt", "untrt"), alpha = 0.05)

# 4) log2FC 收缩：让火山图不被低表达基因的巨大 FC 干扰
res_shrunk <- lfcShrink(dds, coef = "dex_trt_vs_untrt", type = "apeglm")

# 5) 结果整理
res_df <- as.data.frame(res_shrunk)
res_df$gene <- rownames(res_df)
sig <- subset(res_df, padj < 0.05 & abs(log2FoldChange) > 1)
cat("显著差异基因数：", nrow(sig), "\\n")

# 6) 样本层面质控：PCA 看分组是否分得开（比任何统计都直观）
vsd <- vst(dds, blind = FALSE)
plotPCA(vsd, intgroup = c("dex", "cell"))

# 7) 火山图
library(EnhancedVolcano)
EnhancedVolcano(res_df, lab = res_df$gene,
                x = "log2FoldChange", y = "padj",
                pCutoff = 0.05, FCcutoff = 1,
                title = "Dexamethasone vs Untreated")

# 8) 保存
write.csv(res_df, "DEG_all.csv", row.names = FALSE)
saveRDS(dds, "dds.rds")`);

h2('5.3 edgeR 版本（同一份数据，交叉验证）');
code('r', `library(edgeR)
y <- DGEList(counts = assay(airway), group = airway$dex)
keep <- filterByExpr(y, group = y$samples$group)   # edgeR 官方过滤函数
y <- y[keep, , keep.lib.sizes = FALSE]
y <- normLibSizes(y)                                # TMM 标准化
design <- model.matrix(~ cell + dex, data = as.data.frame(colData(airway)))
y   <- estimateDisp(y, design)
fit <- glmQLFit(y, design)
qlf <- glmQLFTest(fit, coef = "dextrt")
topTags(qlf, n = 20)`);
note('避坑：① 千万不要把 TPM/FPKM 喂给 DESeq2 或 edgeR，它们要的是原始整数 counts；② 分组顺序决定 log2FC 的正负，务必用 relevel() 或 contrast 明确指定；③ 有批次效应时，正确做法是把批次写进 design 公式，而不是先用 removeBatchEffect 改数据再做检验（后者会让 p 值失真，removeBatchEffect 只适合出图前的可视化）。');

h2('5.4 推荐配套教程');
tbl(
  ['资源', '链接', '说明'],
  [
    ['rnaseqGene 官方工作流【强烈推荐】', 'https://www.bioconductor.org/packages/release/workflows/vignettes/rnaseqGene/inst/doc/rnaseqGene.html', 'Bioconductor 官方端到端范例，从 counts 到富集'],
    ['Intro to bulk RNA-seq (HBC)', 'https://hbctraining.github.io/Intro-to-bulk-RNAseq/', '150★；讲 FASTQ→counts 的上游流程（需命令行基础），下游 R 分析见下一行 Intro-to-DGE'],
    ['Intro to DGE (HBC)', 'https://hbctraining.github.io/Intro-to-DGE/', '专讲差异表达统计原理，2026-05 更新'],
    ['CRUK Bulk RNAseq Course', 'https://github.com/bioinformatics-core-shared-training/Bulk_RNAseq_Course_Base', '剑桥 CRUK 核心组课程，2026-05 更新'],
    ['EnhancedVolcano', 'https://github.com/kevinblighe/EnhancedVolcano', '火山图事实标准，466★'],
  ],
  [2600, 4400, 2360]
);
pb();

/* ============================== 第6章 富集 ============================== */
h1('第 6 章 功能富集与通路分析');

h2('6.1 clusterProfiler 全家桶');
p('clusterProfiler 是这个领域使用最广的 R 包（GitHub 1217★，2026-07 仍在更新）。官方配套电子书《Biomedical Knowledge Mining using GOSemSim and clusterProfiler》持续维护，是最权威的参考。');
code('r', `library(clusterProfiler); library(org.Hs.eg.db); library(enrichplot)

# 输入：上一章得到的显著差异基因（SYMBOL）
deg <- sig$gene

# 1) ID 转换：多数富集函数需要 ENTREZID
ids <- bitr(deg, fromType = "SYMBOL", toType = "ENTREZID", OrgDb = org.Hs.eg.db)

# 2) GO 过表达分析（ORA）
ego <- enrichGO(gene          = ids$ENTREZID,
                OrgDb         = org.Hs.eg.db,
                ont           = "BP",          # BP / MF / CC / ALL
                pAdjustMethod = "BH",
                pvalueCutoff  = 0.05,
                qvalueCutoff  = 0.2,
                readable      = TRUE)          # 结果自动转回 SYMBOL
dotplot(ego, showCategory = 20) + ggplot2::ggtitle("GO Biological Process")

# 3) KEGG
ekegg <- enrichKEGG(gene = ids$ENTREZID, organism = "hsa", pvalueCutoff = 0.05)

# 4) GSEA：用全部基因的排序而非只用显著基因，信息量更大
gl <- res_df$log2FoldChange
names(gl) <- res_df$gene
gl <- sort(na.omit(gl), decreasing = TRUE)
gse <- gseGO(geneList = gl, OrgDb = org.Hs.eg.db, keyType = "SYMBOL",
             ont = "BP", pvalueCutoff = 0.05, eps = 0)
gseaplot2(gse, geneSetID = 1:3)

# 5) 常用可视化
cnetplot(ego, showCategory = 5)                       # 基因-通路网络
emapplot(pairwise_termsim(ego), showCategory = 30)    # 通路相似性聚类
ridgeplot(gse, showCategory = 15)                     # GSEA 山脊图`);

h2('6.2 ssGSEA / GSVA：把通路变成"每个样本一个分数"');
code('r', `library(GSVA); library(msigdbr)

# 取 MSigDB Hallmark 基因集（50 条，肿瘤研究最常用）
h <- msigdbr(species = "Homo sapiens", collection = "H")
gset <- split(h$gene_symbol, h$gs_name)

# GSVA 新版 API：先建参数对象，再 gsva()
par <- gsvaParam(exprData = as.matrix(log2(tpm + 1)),
                 geneSets = gset, kcdf = "Gaussian")
gsva_mat <- gsva(par)   # 行=通路，列=样本，可直接拿去做差异或生存分析

pheatmap::pheatmap(gsva_mat, show_colnames = FALSE, scale = "row")`);
tbl(
  ['资源', '链接', '说明'],
  [
    ['clusterProfiler 官方书【强烈推荐】', 'https://yulab-smu.top/biomedical-knowledge-mining-book/', '中山大学余光创团队维护，含 GO/KEGG/GSEA/MeSH/Reactome 全部用法'],
    ['clusterProfiler 仓库', 'https://github.com/YuLab-SMU/clusterProfiler', '1217★；issue 区是最好的答疑库'],
    ['Nature Protocols 2024 多组学富集协议', 'https://www.nature.com/articles/s41596-024-01020-z', '同一团队发表的方法学规范，写文章时可引用'],
    ['MSigDB', 'https://www.gsea-msigdb.org/gsea/msigdb', '基因集来源；R 侧用 msigdbr 包获取'],
    ['fgsea', 'https://bioconductor.org/packages/release/bioc/html/fgsea.html', '快速 GSEA 实现，大规模跑分析时用'],
    ['decoupleR', 'https://saezlab.github.io/decoupleR/', '通路/转录因子活性推断（PROGENy、DoRothEA），bulk 与单细胞通用'],
  ],
  [2600, 4400, 2360]
);
note('避坑：① 富集分析的"背景基因集"应当是你实际检测到的所有基因，而不是全基因组——clusterProfiler 里用 universe 参数指定，否则结果会系统性偏倚（这一点 2026 年 clusterProfiler 作者专门发文讨论过）；② KEGG 在线接口偶尔抽风，可用 download_KEGG 缓存；③ 富集结果里全是"cancer pathway""metabolic process"这类超大通路时，说明差异基因太多，先收紧阈值。');
pb();

/* ============================== 第7章 生存 ============================== */
h1('第 7 章 生存分析与预后模型');

h2('7.1 Kaplan-Meier 与 Cox');
code('r', `library(survival); library(survminer)

# clin 需含：time（随访时间，天）、status（1=事件/死亡，0=删失）
clin$time   <- ifelse(is.na(clin$days_to_death),
                      clin$days_to_last_follow_up, clin$days_to_death)
clin$status <- ifelse(clin$vital_status == "Dead", 1, 0)
clin <- subset(clin, !is.na(time) & time > 0)

# 按目标基因表达中位数分高低组
g <- "TP53"
clin$expr  <- as.numeric(log2(tpm[g, rownames(clin)] + 1))
clin$group <- ifelse(clin$expr > median(clin$expr), "High", "Low")

fit <- survfit(Surv(time, status) ~ group, data = clin)
ggsurvplot(fit, data = clin, pval = TRUE, risk.table = TRUE,
           conf.int = TRUE, xlab = "Time (days)",
           legend.title = g, palette = c("#E64B35", "#4DBBD5"))

# 单因素 Cox
summary(coxph(Surv(time, status) ~ expr, data = clin))

# 多因素 Cox（校正年龄、分期）
cox_m <- coxph(Surv(time, status) ~ expr + age_at_index + ajcc_pathologic_stage,
               data = clin)
ggforest(cox_m, data = clin)      # 森林图

# 等比例风险假设检验：p > 0.05 才说明 Cox 模型用得住
cox.zph(cox_m)`);

h2('7.2 LASSO 构建多基因预后模型');
code('r', `library(glmnet); library(timeROC)

X <- t(log2(tpm[candidate_genes, rownames(clin)] + 1))
y <- Surv(clin$time, clin$status)

set.seed(20260726)
cvfit <- cv.glmnet(X, y, family = "cox", alpha = 1, nfolds = 10)
plot(cvfit)

coefs <- coef(cvfit, s = "lambda.min")
sel   <- rownames(coefs)[which(coefs != 0)]
cat("入选基因：", paste(sel, collapse = ", "), "\\n")

# 风险评分
clin$riskscore <- as.numeric(predict(cvfit, newx = X, s = "lambda.min"))
clin$riskgroup <- ifelse(clin$riskscore > median(clin$riskscore), "High", "Low")

# 时间依赖 ROC：看 1/3/5 年预测能力
roc <- timeROC(T = clin$time, delta = clin$status, marker = clin$riskscore,
               cause = 1, times = c(365, 1095, 1825), iid = TRUE)
roc$AUC`);
tbl(
  ['资源', '链接', '说明'],
  [
    ['survminer', 'https://rpkgs.datanovia.com/survminer/', 'KM 曲线与森林图的标准工具，571★，2026-07 更新'],
    ['Survival Analysis in R (Emily Zabor)', 'https://www.emilyzabor.com/survival-analysis-in-r.html', '最清晰的英文入门教程，2026-05-21 更新；含竞争风险与 ggsurvfit 新写法'],
    ['glmnet 官方站', 'https://glmnet.stanford.edu/', 'LASSO/Elastic Net 的权威文档'],
    ['scikit-survival（Python 侧对照）', 'https://scikit-survival.readthedocs.io/', '想用机器学习做生存预测时的补充'],
  ],
  [2600, 4400, 2360]
);
note('避坑：① "按中位数分组"很常见但会损失信息，建议同时报告连续变量的 Cox 结果；用 surv_cutpoint() 找最优切点时必须说明并做多重检验校正，否则容易被审稿人质疑 p-hacking；② 建模一定要有独立验证集（如 GEO 队列），只在 TCGA 里训练+测试没有说服力；③ 时间单位统一（天/月），别一半天一半月。');
pb();

/* ============================== 第8章 突变与免疫 ============================== */
h1('第 8 章 体细胞突变与肿瘤微环境');

h2('8.1 maftools：突变全景图');
p('maftools（Bioconductor 3.23，版本 2.28.0）是 MAF 文件分析的事实标准，一行代码出瀑布图。');
code('r', `library(maftools)

maf <- read.maf(maf = maf_df, clinicalData = clin)

plotmafSummary(maf, rmOutlier = TRUE, addStat = "median", dashboard = TRUE)
oncoplot(maf, top = 20)                          # 瀑布图/oncoprint
somaticInteractions(maf, top = 25, pvalue = c(0.05, 0.1))   # 共突变/互斥
tmb_res <- tmb(maf)                              # 肿瘤突变负荷
lollipopPlot(maf, gene = "TP53", AACol = "HGVSp_Short")
oncodrive(maf, minMut = 5, pvalMethod = "zscore") |> plotOncodrive()

# 与临床结局关联
mafSurvival(maf, genes = "TP53", time = "time", Status = "status", isTCGA = TRUE)`);

h2('8.2 免疫浸润与 TME 解卷积');
tbl(
  ['工具', '方法', '链接', '备注'],
  [
    ['IOBR【强烈推荐】', '集成 CIBERSORT/TIMER/xCell/MCPcounter/ESTIMATE/EPIC/IPS/quanTIseq 共 8 种 + 200 余套signature', 'https://github.com/IOBR/IOBR', '292★，2026-07 活跃更新；配套电子书 https://iobr.github.io/book/'],
    ['immunedeconv', '统一接口调用多种解卷积方法', 'https://github.com/omnideconv/immunedeconv', '546★，方法学基准评估配套'],
    ['ESTIMATE', '基质/免疫评分与肿瘤纯度', 'https://bioinformatics.mdanderson.org/estimate/', '经典、引用极高'],
    ['TIMER2.0（网页版）', '在线免疫浸润分析', 'http://timer.cistrome.org/', '不想写代码时用；站点偶有维护中断'],
    ['TIDE', '免疫治疗响应预测', 'https://tide.comp-genomics.org/', '免疫治疗方向必备'],
    ['oncoPredict', '药物敏感性（IC50）预测', 'https://cran.r-project.org/package=oncoPredict', 'CRAN 1.3.1（2026-06-29），基于 GDSC/CTRP 训练'],
  ],
  [1700, 2900, 2900, 1860]
);
code('r', `library(IOBR)
# 输入：log2(TPM+1) 表达矩阵，行=基因 symbol，列=样本
cibersort <- deconvo_tme(eset = expr_log, method = "cibersort", arrays = FALSE, perm = 200)
estimate  <- deconvo_tme(eset = expr_log, method = "estimate")
mcp       <- deconvo_tme(eset = expr_log, method = "mcpcounter")

# 200+ 内置 signature 打分（PCA / ssGSEA / z-score 三选一）
sig_score <- calculate_sig_score(eset = expr_log,
                                 signature = signature_collection,
                                 method = "ssgsea")`);
note('避坑：CIBERSORT 的原始代码有学术使用许可要求，商业用途需申请；不同解卷积方法给出的细胞比例含义不同（有的是相对比例、有的是绝对丰度），不可跨方法直接比较数值，只能比较组间趋势。');
pb();

/* ============================== 第9章 单细胞 ============================== */
h1('第 9 章 单细胞 RNA-seq：Seurat v5 完整流程');
p('这是全书最重的一章。单细胞分析的主流有两条路线：R 侧的 Seurat（上手快、生态丰富）与 Bioconductor 侧的 OSCA/scran/scater（统计更严谨、与其他 Bioconductor 工具无缝衔接）。建议以 Seurat 为主线，遇到统计细节时查 OSCA。');

h2('9.1 三本"官方教材"');
tbl(
  ['资源', '链接', '最近更新 / 说明'],
  [
    ['Seurat 官方 vignettes【强烈推荐】', 'https://satijalab.org/seurat/articles/get_started_v5_new', 'Seurat 5.5.1；入门读 pbmc3k 引导教程，进阶读 integration / sketch / spatial 系列'],
    ['OSCA：Orchestrating Single-Cell Analysis with Bioconductor【强烈推荐】', 'https://bioconductor.org/books/release/OSCA/', '基于 Bioconductor 3.23 / R 4.6 自动重编译，代码保证可跑；分 intro/basic/advanced/workflows 四册'],
    ['Single-cell best practices (Theis lab)', 'https://www.sc-best-practices.org/', 'Python 为主但方法学讨论最全面，是"该选哪种方法"的判断依据'],
  ],
  [2900, 3400, 3060]
);

h2('9.2 标准流程（pbmc3k，官方演示数据）');
code('r', `library(Seurat); library(tidyverse); library(patchwork)

# 数据：https://cf.10xgenomics.com/samples/cell/pbmc3k/pbmc3k_filtered_gene_bc_matrices.tar.gz
counts <- Read10X(data.dir = "filtered_gene_bc_matrices/hg19/")
obj <- CreateSeuratObject(counts, project = "pbmc3k",
                          min.cells = 3, min.features = 200)

# ── 1. 质控 ──
obj[["percent.mt"]] <- PercentageFeatureSet(obj, pattern = "^MT-")
obj[["percent.rb"]] <- PercentageFeatureSet(obj, pattern = "^RP[SL]")
VlnPlot(obj, c("nFeature_RNA", "nCount_RNA", "percent.mt"), ncol = 3)

obj <- subset(obj, subset = nFeature_RNA > 200 & nFeature_RNA < 5000 &
                            percent.mt < 15)

# ── 2. 标准化 → 高变基因 → 标准化缩放 → PCA ──
obj <- NormalizeData(obj) |>
       FindVariableFeatures(selection.method = "vst", nfeatures = 2000) |>
       ScaleData() |>
       RunPCA(npcs = 50)
ElbowPlot(obj, ndims = 50)      # 看拐点决定用多少个 PC

# 也可用一步到位的 SCTransform（v2 为默认）
# obj <- SCTransform(obj, vars.to.regress = "percent.mt", verbose = FALSE)

# ── 3. 聚类与降维可视化 ──
dims <- 1:20
obj <- FindNeighbors(obj, dims = dims) |>
       FindClusters(resolution = 0.5) |>
       RunUMAP(dims = dims)
DimPlot(obj, label = TRUE) + NoLegend()

# ── 4. 找 marker 基因（装 presto 后速度提升数十倍）──
# devtools::install_github("immunogenomics/presto")
markers <- FindAllMarkers(obj, only.pos = TRUE,
                          min.pct = 0.25, logfc.threshold = 0.25)
top10 <- markers |> group_by(cluster) |> slice_max(avg_log2FC, n = 10)
DoHeatmap(obj, features = top10$gene) + NoLegend()

saveRDS(obj, "pbmc3k_processed.rds")`);

h2('9.3 双细胞（doublet）过滤');
code('r', `library(scDblFinder); library(SingleCellExperiment)
sce <- as.SingleCellExperiment(obj)
sce <- scDblFinder(sce, samples = NULL)     # 多样本时 samples = "sample_id"
obj$scDblFinder.class <- sce$scDblFinder.class
table(obj$scDblFinder.class)
obj <- subset(obj, subset = scDblFinder.class == "singlet")`);

h2('9.4 多样本整合与去批次');
p('Seurat v5 把多种整合方法统一到 IntegrateLayers() 接口，切换方法只改一个参数。');
code('r', `# 多个样本读入后合并，并按样本拆分 layer
obj[["RNA"]] <- split(obj[["RNA"]], f = obj$sample_id)
obj <- NormalizeData(obj) |> FindVariableFeatures() |> ScaleData() |> RunPCA()

# 方法一：Harmony（最常用，快且效果稳）
obj <- IntegrateLayers(obj, method = HarmonyIntegration,
                       orig.reduction = "pca", new.reduction = "harmony")

# 方法二：Seurat CCA / RPCA
# obj <- IntegrateLayers(obj, method = CCAIntegration,  new.reduction = "integrated.cca")
# obj <- IntegrateLayers(obj, method = RPCAIntegration, new.reduction = "integrated.rpca")

obj <- FindNeighbors(obj, reduction = "harmony", dims = 1:30) |>
       FindClusters(resolution = 0.5) |>
       RunUMAP(reduction = "harmony", dims = 1:30)

obj[["RNA"]] <- JoinLayers(obj[["RNA"]])    # 差异分析前必须合回来
DimPlot(obj, group.by = c("sample_id", "seurat_clusters"))`);
note('避坑（v5 高频问题）：① Seurat v5 的 counts/data 按样本拆成多个 layer，直接 FindMarkers 会报错，必须先 JoinLayers()；② 整合后不要用整合空间的表达值做差异分析，差异分析仍应基于 RNA assay 的原始/标准化数据；③ 批次效应与生物学差异有时无法区分，整合"过头"会抹掉真实的疾病差异——整合前后都画一次 UMAP 做对比。');

h2('9.5 细胞类型注释：三种策略并用');
code('r', `# ── 策略 A：参考数据集自动注释（SingleR）──
library(SingleR); library(celldex)
ref <- celldex::HumanPrimaryCellAtlasData()
pred <- SingleR(test = GetAssayData(obj, layer = "data"),
                ref = ref, labels = ref$label.main)
obj$SingleR <- pred$pruned.labels
plotScoreHeatmap(pred)

# ── 策略 B：marker 基因集打分（UCell，对测序深度稳健）──
library(UCell)
sigs <- list(
  Tcell     = c("CD3D", "CD3E", "CD2", "IL7R"),
  Bcell     = c("MS4A1", "CD79A", "CD79B"),
  Myeloid   = c("LYZ", "CD68", "CD14", "FCGR3A"),
  NK        = c("GNLY", "NKG7", "KLRD1"),
  Epithelial= c("EPCAM", "KRT18", "KRT19"),
  Fibroblast= c("COL1A1", "DCN", "LUM"),
  Endothel  = c("PECAM1", "VWF", "CLDN5")
)
obj <- AddModuleScore_UCell(obj, features = sigs)
FeaturePlot(obj, features = paste0(names(sigs), "_UCell"), ncol = 4)

# ── 策略 C：人工核对经典 marker（最终以这个为准）──
DotPlot(obj, features = unique(unlist(sigs))) + RotatedAxis()

# 确定后重命名
new_ids <- c("0" = "CD4 T", "1" = "Monocyte", "2" = "B", "3" = "CD8 T")
obj <- RenameIdents(obj, new_ids)
obj$celltype <- Idents(obj)`);
tbl(
  ['注释工具', '链接', '说明'],
  [
    ['SingleR + celldex', 'https://github.com/SingleR-inc/SingleR', '204★，2026-07 更新；配套书《Assigning cell types with SingleR》 https://bioconductor.org/books/release/SingleRBook/ （v1.22.0，基于 Bioc 3.23 编译）'],
    ['UCell', 'https://github.com/carmonalab/UCell', '203★；基于秩的打分，比 AddModuleScore 更稳健'],
    ['Pan-Human Azimuth', 'https://azimuth.hubmapconsortium.org/', 'Satija 实验室参考映射注释；2026 年已升级为覆盖 23 种组织、380 种细胞类型的泛人类模型，R 侧用 CloudAzimuth 接口（原按组织划分的网页应用已停止维护）'],
    ['CellMarker 3.0', 'https://bio-bigdata.hrbmu.edu.cn/CellMarker/', '人工+机器学习整理的 marker 数据库，含 132 万余条 组织-细胞类型-marker 记录'],
    ['CellTypist（Python）', 'https://www.celltypist.org/', '免疫细胞注释效果好，可与 R 流程互通'],
  ],
  [2300, 4200, 2860]
);

h2('9.6 肿瘤特有环节：识别恶性细胞（CNV 推断）');
p('肿瘤单细胞分析绕不开的一步：把上皮/恶性细胞与正常细胞区分开。主流做法是从表达矩阵反推染色体拷贝数变异。');
code('r', `library(infercnv)
# 需要三个输入：counts 矩阵、细胞注释文件、基因位置文件
infercnv_obj <- CreateInfercnvObject(
  raw_counts_matrix = GetAssayData(obj, layer = "counts"),
  annotations_file  = "cell_annotation.txt",   # 两列：cellname \\t celltype
  gene_order_file   = "gencode_v19_gene_pos.txt",
  ref_group_names   = c("T cell", "Myeloid")   # 正常细胞作参考
)
infercnv_obj <- infercnv::run(infercnv_obj,
                              cutoff = 0.1,           # 10x 数据用 0.1
                              out_dir = "infercnv_out",
                              cluster_by_groups = TRUE,
                              denoise = TRUE, HMM = TRUE)`);
b(
  'inferCNV：https://github.com/broadinstitute/infercnv/wiki （678★，Broad 研究所维护，wiki 文档详尽）',
  'copyKAT：https://github.com/navinlabcode/copykat （298★，无需指定正常参考细胞，可作交叉验证）',
  'CytoTRACE 2：https://github.com/digitalcytometry/cytotrace2 （262★，推断细胞分化潜能/干性）'
);

h2('9.7 拟时序与轨迹分析');
code('r', `library(monocle3); library(SeuratWrappers)
cds <- as.cell_data_set(obj)
cds <- cluster_cells(cds)
cds <- learn_graph(cds, use_partition = TRUE)
# 交互式选择起点，或用代码指定根节点
cds <- order_cells(cds)
plot_cells(cds, color_cells_by = "pseudotime",
           label_branch_points = TRUE, label_leaves = FALSE)

# 找随拟时序显著变化的基因
deg_pt <- graph_test(cds, neighbor_graph = "principal_graph", cores = 4)
head(subset(deg_pt, q_value < 0.05)[order(-deg_pt$morans_I), ])`);
b(
  'Monocle3：https://cole-trapnell-lab.github.io/monocle3/ （462★，2026-05 更新）',
  'Slingshot（Bioconductor 生态，与 SCE 对象无缝）：https://bioconductor.org/packages/release/bioc/html/slingshot.html',
  'RNA velocity（scVelo，Python）：https://scvelo.readthedocs.io/ ，R 侧可用 velociraptor 包桥接'
);

h2('9.8 细胞间通讯');
code('r', `library(CellChat)
data.input <- GetAssayData(obj, assay = "RNA", layer = "data")
meta <- data.frame(labels = obj$celltype, row.names = colnames(obj))

cc <- createCellChat(object = data.input, meta = meta, group.by = "labels")
cc@DB <- subsetDB(CellChatDB.human, search = "Secreted Signaling")
cc <- subsetData(cc)
cc <- identifyOverExpressedGenes(cc)
cc <- identifyOverExpressedInteractions(cc)
cc <- computeCommunProb(cc, type = "triMean")
cc <- filterCommunication(cc, min.cells = 10)
cc <- computeCommunProbPathway(cc)
cc <- aggregateNet(cc)

netVisual_circle(cc@net$weight, weight.scale = TRUE,
                 label.edge = FALSE, title.name = "Interaction weights")
netVisual_bubble(cc, sources.use = "Malignant", remote.use = NULL)`);
tbl(
  ['工具', '链接', '说明'],
  [
    ['CellChat（现维护仓库）', 'https://github.com/jinworks/CellChat', '638★，2026-03 更新；注意旧仓库 sqjin/CellChat 已归档，不要再用'],
    ['NicheNet', 'https://github.com/saeyslab/nichenetr', '665★，能推断配体如何影响受体细胞下游基因，机制层面更深'],
    ['CellPhoneDB（Python）', 'https://www.cellphonedb.org/', '文章里最常见的另一半，可与 CellChat 互相验证'],
  ],
  [2000, 3600, 3760]
);

h2('9.9 单细胞层面的共表达网络与免疫组库');
b(
  'hdWGCNA（单细胞/空间 WGCNA）：https://smorabit.github.io/hdWGCNA/ （488★，Cell Reports Methods 2023）',
  'scRepertoire（TCR/BCR 免疫组库 + 转录组联合）：https://github.com/BorchLab/scRepertoire （373★，2026-07 更新；注意作者已迁移到 BorchLab 组织下）',
  'escape（单细胞 GSEA）：https://github.com/BorchLab/escape （228★）',
  'SCENIC / pySCENIC（转录因子调控网络）：https://github.com/aertslab/pySCENIC （627★）'
);

h2('9.10 超大数据集（百万细胞）怎么办');
code('r', `library(BPCells); library(Seurat)
# 把 h5 矩阵转成磁盘存储格式，内存占用大幅下降
mat <- open_matrix_10x_hdf5("1M_cells.h5")
write_matrix_dir(mat = mat, dir = "cell_counts")
mat <- open_matrix_dir("cell_counts")
obj <- CreateSeuratObject(counts = mat)

# Sketch：抽样代表性细胞放内存里做交互式分析，其余留在磁盘
obj <- NormalizeData(obj) |> FindVariableFeatures()
obj <- SketchData(obj, ncells = 50000, method = "LeverageScore",
                  sketched.assay = "sketch")
DefaultAssay(obj) <- "sketch"   # 之后正常跑标准流程
# 分析完再用 ProjectData() 把结果投回全量细胞`);
b('BPCells：https://bnprks.github.io/BPCells/ （297★）', 'Seurat sketch 教程：https://satijalab.org/seurat/articles/seurat5_sketch_analysis');

h2('9.11 系统性课程（有讲义 + 数据 + 答案）');
tbl(
  ['课程', '链接', '更新 / 星标'],
  [
    ['NBIS workshop-scRNAseq【强烈推荐】', 'https://nbisweden.github.io/workshop-scRNAseq/', '2026-04 更新，245★；Seurat / Bioconductor / Scanpy 三套平行实现，对比学习极佳'],
    ['HBC Intro-to-scRNAseq', 'https://hbctraining.github.io/Intro-to-scRNAseq/', '2026-07 更新，661★；哈佛医学院，Seurat 路线，讲义最细'],
    ['SIB single-cell-training', 'https://github.com/sib-swiss/single-cell-training', '2026-01 更新；瑞士生信所'],
    ['Analysis of single cell RNA-seq data (Cambridge)', 'https://www.singlecellcourse.org/', '剑桥课程，提供 Docker 镜像，环境零配置'],
    ['scRNA-seq_online (HBC)', 'https://github.com/hbctraining/scRNA-seq_online', '自学版本，含完整代码与练习数据'],
  ],
  [2600, 3600, 3160]
);
pb();

/* ============================== 第10章 空间与表观 ============================== */
h1('第 10 章 空间转录组与单细胞表观组');

h2('10.1 空间转录组');
tbl(
  ['资源', '链接', '说明'],
  [
    ['OSTA 电子书【强烈推荐】', 'https://bioconductor.org/books/release/OSTA/', 'v1.2.2，2026-07-15 基于 Bioconductor 3.23 / R 4.6.1 编译；测序型与成像型两条主线'],
    ['Seurat 空间分析 vignette', 'https://satijalab.org/seurat/articles/spatial_vignette.html', 'Visium / Slide-seq；Visium HD 见 visiumhd_analysis_vignette'],
    ['SpatialExperiment', 'https://bioconductor.org/packages/release/bioc/html/SpatialExperiment.html', '空间数据的标准 Bioconductor 容器'],
    ['SPOTlight', 'https://github.com/MarcElosua/SPOTlight', '210★，用单细胞参考解卷积 spot 内细胞组成'],
    ['spacexr (RCTD)', 'https://github.com/dmcable/spacexr', '473★，空间解卷积与差异表达'],
    ['HBC Intro-to-spatial-transcriptomics', 'https://github.com/hbctraining/Intro-to-spatial-transcriptomics', '2026-05 新课程，入门友好'],
  ],
  [2200, 4200, 2960]
);

h2('10.2 单细胞 ATAC / 多组学');
tbl(
  ['资源', '链接', '说明'],
  [
    ['Signac', 'https://stuartlab.org/signac/', '424★，2026-07 更新；与 Seurat 无缝衔接，scATAC 首选'],
    ['ArchR', 'https://www.archrproject.com/bookdown/index.html', '462★；百万细胞级 scATAC，完整在线手册'],
    ['MOFA2（多组学因子分析）', 'https://biofam.github.io/MOFA2/', '411★，2026-07 更新；整合转录/甲基化/蛋白等多层数据'],
    ['Seurat WNN 多模态整合', 'https://satijalab.org/seurat/articles/weighted_nearest_neighbor_analysis', 'CITE-seq、RNA+ATAC 联合分析'],
  ],
  [2400, 4000, 2960]
);
pb();

/* ============================== 第11章 可视化 ============================== */
h1('第 11 章 出图：让结果看起来像发表级');
tbl(
  ['包', '用途', '链接'],
  [
    ['ComplexHeatmap【强烈推荐】', '热图天花板，多注释轨道、oncoprint、拼图', 'https://jokergoo.github.io/ComplexHeatmap-reference/book/　1523★'],
    ['EnhancedVolcano', '火山图', 'https://github.com/kevinblighe/EnhancedVolcano'],
    ['ggpubr', '带统计检验标注的箱线图/小提琴图', 'https://rpkgs.datanovia.com/ggpubr/'],
    ['patchwork', '多图拼接排版', 'https://patchwork.data-imaginist.com/'],
    ['scRNAtoolVis', '单细胞常用图（火山、气泡、marker 热图）一键美化', 'https://github.com/junjunlab/scRNAtoolVis　398★，中文作者'],
    ['SCP', '单细胞一站式分析与出图', 'https://github.com/zhanghao-njmu/SCP　665★'],
    ['ggVennDiagram', '韦恩图', 'https://github.com/gaospecial/ggVennDiagram　314★'],
    ['ggsci', 'Nature/Lancet/NPG 等期刊配色', 'https://nanx.me/ggsci/'],
  ],
  [2000, 3400, 3760]
);
code('r', `# 中文字体：Linux/Docker 里画中文图常出现方块，先注册字体
library(showtext); showtext_auto()
font_add("SimHei", "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc")

# 统一期刊风格
library(ggplot2); library(ggsci)
p + theme_classic(base_size = 12) +
    scale_fill_npg() +
    theme(axis.text = element_text(color = "black"),
          legend.position = "top")

# 导出矢量图（投稿基本都要 PDF/TIFF 300dpi）
ggsave("Figure1.pdf", p, width = 6, height = 4.5, useDingbats = FALSE)
ggsave("Figure1.tiff", p, width = 6, height = 4.5, dpi = 300, compression = "lzw")`);
pb();

/* ============================== 第12章 精选链接总表 ============================== */
h1('第 12 章 精选链接总表（速查）');
p('下表为全书链接的汇总，按用途分类。"核查"列为 2026-07-26 的核对结果：★为 GitHub Stars，日期为最近更新。');

h3('12.1 电子书与系统课程');
tbl(
  ['名称', '链接', '核查'],
  [
    ['OSCA（单细胞 Bioconductor 圣经）', 'https://bioconductor.org/books/release/OSCA/', 'Bioc 3.23 / R 4.6 自动编译'],
    ['OSTA（空间转录组）', 'https://bioconductor.org/books/release/OSTA/', 'v1.2.2，2026-07-15'],
    ['clusterProfiler 官方书', 'https://yulab-smu.top/biomedical-knowledge-mining-book/', 'clusterProfiler 4.21.x'],
    ['Single-cell best practices', 'https://www.sc-best-practices.org/', '持续更新'],
    ['R for Data Science (2e)', 'https://r4ds.hadley.nz/', '在线维护'],
    ['ComplexHeatmap Reference', 'https://jokergoo.github.io/ComplexHeatmap-reference/book/', '1523★'],
    ['ArchR 手册', 'https://www.archrproject.com/bookdown/index.html', '462★'],
    ['IOBR 电子书', 'https://iobr.github.io/book/', '292★'],
    ['NBIS scRNAseq workshop', 'https://nbisweden.github.io/workshop-scRNAseq/', '2026-04-27，245★'],
    ['HBC 培训总入口', 'https://hbctraining.github.io/main/', '2026-07 活跃'],
    ['Cambridge 单细胞课程', 'https://www.singlecellcourse.org/', '含 Docker 镜像'],
    ['Carpentries bioc-intro', 'https://carpentries-incubator.github.io/bioc-intro/', '2026-07-22'],
  ],
  [2800, 4400, 2160]
);

h3('12.2 核心 R 包与官方文档');
tbl(
  ['包', '链接', '核查'],
  [
    ['Seurat', 'https://satijalab.org/seurat/', 'CRAN 5.5.1（2026-06-26），2774★'],
    ['Signac', 'https://stuartlab.org/signac/', '2026-07-23，424★'],
    ['Monocle3', 'https://cole-trapnell-lab.github.io/monocle3/', '2026-05-26，462★'],
    ['harmony', 'https://github.com/immunogenomics/harmony', '2026-06-05，666★'],
    ['CellChat', 'https://github.com/jinworks/CellChat', '2026-03-04，638★'],
    ['NicheNet', 'https://github.com/saeyslab/nichenetr', '2026-06-01，665★'],
    ['inferCNV', 'https://github.com/broadinstitute/infercnv/wiki', '2025-11-14，678★'],
    ['copyKAT', 'https://github.com/navinlabcode/copykat', '2026-06-16，298★'],
    ['SingleR', 'https://github.com/SingleR-inc/SingleR', '2026-07-07，204★'],
    ['UCell', 'https://github.com/carmonalab/UCell', '2026-04-29，203★'],
    ['scDblFinder', 'https://github.com/plger/scDblFinder', '2026-07-07，258★'],
    ['hdWGCNA', 'https://smorabit.github.io/hdWGCNA/', '2026-06-16，488★'],
    ['scRepertoire', 'https://github.com/BorchLab/scRepertoire', '2026-07-09，373★'],
    ['BPCells', 'https://bnprks.github.io/BPCells/', '2026-07-13，297★'],
    ['maftools', 'https://github.com/PoisonAlien/maftools', 'Bioc 2.28.0，498★'],
    ['TCGAbiolinks', 'https://github.com/BioinformaticsFMRP/TCGAbiolinks', 'Bioc 3.23 在册，352★'],
    ['clusterProfiler', 'https://github.com/YuLab-SMU/clusterProfiler', '2026-07-09，1217★'],
    ['IOBR', 'https://github.com/IOBR/IOBR', '2026-07-23，292★'],
    ['immunedeconv', 'https://github.com/omnideconv/immunedeconv', '2026-07-06，546★'],
    ['decoupleR', 'https://saezlab.github.io/decoupleR/', '2025-12-16，301★'],
    ['MOFA2', 'https://biofam.github.io/MOFA2/', '2026-07-21，411★'],
    ['spacexr', 'https://github.com/dmcable/spacexr', '2026-01-22，473★'],
    ['SPOTlight', 'https://github.com/MarcElosua/SPOTlight', '2025-10-20，210★'],
    ['pySCENIC', 'https://github.com/aertslab/pySCENIC', '2025-06-26，627★'],
  ],
  [2300, 4400, 2660]
);

h3('12.3 数据库与在线工具');
tbl(
  ['名称', '链接', '用途'],
  [
    ['GDC Data Portal', 'https://portal.gdc.cancer.gov/', 'TCGA 官方门户'],
    ['UCSC Xena', 'https://xenabrowser.net/', '整理好的 pan-cancer 矩阵'],
    ['cBioPortal', 'https://www.cbioportal.org/', '538 研究 / 39.9 万样本'],
    ['NCBI GEO', 'https://www.ncbi.nlm.nih.gov/geo/', '数据集检索与下载'],
    ['TISCH2', 'https://tisch.compbio.cn/', '肿瘤单细胞图谱，190 数据集 / 630 万细胞'],
    ['CELLxGENE Discover', 'https://cellxgene.cziscience.com/', '标准化单细胞图谱'],
    ['GEPIA2', 'http://gepia2.cancer-pku.cn/', 'TCGA+GTEx 在线差异与生存'],
    ['TIMER2.0', 'http://timer.cistrome.org/', '在线免疫浸润'],
    ['TIDE', 'https://tide.comp-genomics.org/', '免疫治疗响应预测'],
    ['MSigDB', 'https://www.gsea-msigdb.org/gsea/msigdb', '基因集'],
    ['Human Protein Atlas', 'https://www.proteinatlas.org/', '蛋白表达与预后'],
    ['STRING', 'https://string-db.org/', 'PPI 网络'],
  ],
  [2200, 4200, 2960]
);

h3('12.4 中文社区资源');
p('中文资源在"上手速度"上有优势，但更新与规范性参差，建议作为英文官方文档的补充，遇到冲突时以官方 vignette 为准。');
tbl(
  ['名称', '链接', '说明'],
  [
    ['生信技能树（生信菜鸟团/Jimmy）', 'http://www.bio-info-trainee.com/', '中文生信入门流量最大的社区，教程数量多；注意部分老帖代码基于 Seurat v4，需按 v5 调整'],
    ['easyTCGA', 'https://github.com/ayueme/easyTCGA', 'TCGA 下载整理的中文封装，含 wiki 教程'],
    ['tinyarray', 'https://github.com/xjsun1221/tinyarray', '芯片/TCGA 快捷函数，中文文档'],
    ['scRNAtoolVis', 'https://github.com/junjunlab/scRNAtoolVis', '单细胞出图美化，中文说明'],
    ['SCP', 'https://github.com/zhanghao-njmu/SCP', '国内团队开发的单细胞一站式框架'],
  ],
  [2200, 4200, 2960]
);
pb();

/* ============================== 第13章 报错速查 ============================== */
h1('第 13 章 常见报错速查表');
tbl(
  ['报错信息 / 现象', '原因', '解决'],
  [
    ['there is no package called "xxx"', '包没装，或装到了别的库路径', '用 BiocManager::install("xxx")；.libPaths() 检查库路径'],
    ['installation of package had non-zero exit status', '缺系统依赖或编译器', 'Windows 装 Rtools；Linux 补 libcurl4-openssl-dev、libxml2-dev、libhdf5-dev'],
    ['Bioconductor version 3.xx is out-of-date', 'R 与 Bioconductor 版本不匹配', '升级 R 到 4.6，再 BiocManager::install(version = "3.23")'],
    ['unable to find an inherited method for function ...', 'S4 方法不匹配，通常是包版本混乱', 'BiocManager::valid() 体检并按提示更新'],
    ['Layer "counts" is not found（Seurat）', 'v5 的 layer 被拆分或名称变了', 'JoinLayers(obj[["RNA"]])；用 Layers(obj) 查看现有 layer'],
    ['FindMarkers 报错 / 结果为空（Seurat v5）', '多样本 layer 未合并', '先 obj[["RNA"]] <- JoinLayers(obj[["RNA"]])'],
    ['cannot allocate vector of size ... Gb', '内存不足', '用 BPCells 磁盘存储 + SketchData；或增大 options(future.globals.maxSize)'],
    ['UMAP 每次跑结果都不一样', '随机数种子没固定', '脚本开头 set.seed()，RunUMAP 里也可传 seed.use'],
    ['富集结果一片空白', 'ID 类型不对（SYMBOL vs ENTREZID）或物种参数错', 'bitr() 转换；确认 OrgDb 与 organism 参数'],
    ['KM 曲线 p 值极显著但样本极少', '按最优切点分组导致过拟合', '报告中位切点结果，并在独立队列验证'],
    ['画图中文变方块', '缺中文字体', 'showtext + font_add 注册字体；本仓库 cjk-viz 技能可自动处理'],
    ['GDCdownload 中途失败', '网络中断', '重跑同一段代码即可续传；或改 method = "client" 用 gdc-client'],
  ],
  [2900, 2600, 3860]
);
pb();

/* ============================== 第14章 30天计划 ============================== */
h1('第 14 章 30 天上手计划（可打印对照）');
tbl(
  ['时间', '任务', '产出物'],
  [
    ['第 1-3 天', '装好 R 4.6 + RStudio + BiocManager；跑通 R4DS 前 4 章', '能用 dplyr 处理一张 csv 并画出 ggplot'],
    ['第 4-6 天', 'Carpentries bioc-intro；理解 SummarizedExperiment', '能从 se 对象里取出矩阵、分组、基因注释'],
    ['第 7-9 天', 'DESeq2 官方 airway 示例完整跑一遍', 'DEG 表 + PCA 图 + 火山图'],
    ['第 10-12 天', 'clusterProfiler 做 GO/KEGG/GSEA', 'dotplot + GSEA 富集曲线'],
    ['第 13-15 天', 'TCGAbiolinks 下载一个癌种，做 KM 与 Cox', '目标基因的生存曲线 + 森林图'],
    ['第 16-18 天', 'maftools 瀑布图；IOBR 免疫浸润', 'oncoplot + 免疫细胞比例热图'],
    ['第 19-23 天', 'Seurat pbmc3k 全流程 + 细胞注释', '带细胞类型标签的 UMAP + marker 热图'],
    ['第 24-26 天', '多样本整合（Harmony）+ 双细胞过滤', '整合前后 UMAP 对比图'],
    ['第 27-30 天', '选一个方向深挖：inferCNV / 拟时序 / CellChat；整理成 Quarto 报告', '一份可复现的 HTML 报告 + GitHub 仓库'],
  ],
  [1500, 4600, 3260]
);
note('学习方法建议：每跑通一段官方示例，立刻换成自己的数据再跑一遍——只有在自己数据上踩过坑，才算真正学会。遇到报错先完整读英文错误信息，再去对应 GitHub 仓库的 Issues 里搜关键词，90% 的问题别人已经问过。');
pb();

/* ============================== 附录 ============================== */
h1('附录 A　本手册的内容核查说明');
p('这份手册的所有事实性内容都经过独立核查，方法记录如下，便于读者自行复核或在半年后更新。');
h3('A.1 核查项目与方法');
tbl(
  ['核查对象', '方法', '结果'],
  [
    ['软件版本基线', '查询 Bioconductor 官方发布信息与 CRAN 包页面', 'Bioconductor 3.23（2026-04-29，2418 个包）配 R 4.6.0；Seurat CRAN 5.5.1（2026-06-26）；maftools 2.28.0；均已写入正文'],
    ['GitHub 仓库有效性', '通过 GitHub REST API 批量拉取 stars / pushed_at / archived 字段', '全部 40 余个推荐仓库均非归档状态，除个别（如 dviraran/SingleR、sqjin/CellChat）已在正文注明迁移或弃用'],
    ['在线书籍与教程可达性', '逐一抓取页面正文，确认编译时间与内容', 'OSTA v1.2.2（2026-07-15，Bioc 3.23/R 4.6.1）、OSCA（Bioc 3.23 编译）、NBIS（2026-04-27）、HBC Intro-to-scRNAseq（2026-07-24）均为现行版本'],
    ['数据库门户可用性', '抓取首页并读取统计数字', 'cBioPortal 538 研究 / 399868 样本；UCSC Xena 237 队列 / 2256 数据集；TISCH2 190 数据集 / 6297320 细胞——数字直接取自站点实时页面'],
    ['代码正确性', '对照各包官方 vignette 逐段核对函数名与参数', 'Seurat v5 的 IntegrateLayers/JoinLayers/SketchData、GSVA 新版 gsvaParam 接口、edgeR 的 normLibSizes 等均已按当前 API 书写'],
  ],
  [2000, 2800, 5560]
);
h3('A.2 已知局限与使用提醒');
b(
  '链接会腐坏：学术站点（尤其是 TIMER2.0、TISCH2 等课题组自建服务）存在临时不可访问的情况，本手册核查时 TIMER2.0 曾出现连接中断；遇到打不开时可稍后重试或用 Wayback Machine。',
  '中文社区资源未做逐篇技术审核：这类资源更新节奏与规范性差异较大，正文已标注"以官方 vignette 为准"。',
  '代码示例以演示流程为目的：参数（如 QC 阈值 nFeature_RNA、percent.mt、聚类 resolution）必须按自己的数据分布调整，不存在放之四海皆准的数值。',
  '本手册不替代统计学训练：差异分析的多重检验、生存分析的比例风险假设、解卷积结果的解释边界，都需要具体问题具体判断。',
  '版本会前进：Bioconductor 每年 4 月与 10 月各发布一次，建议每半年回看一次正文第 1 章的版本基线表。'
);
h3('A.3 生成与校验工具链');
p('本文档由 MedgeClaw 使用 docx 文档技能（docx-js）生成；内容组织参考了仓库集成的 K-Dense 科学技能库，其中 geo-database 技能用于核对 GEO 数据组织方式与访问编号规范，scanpy / anndata 技能用于交叉验证单细胞流程各步骤的方法学表述，scientific-critical-thinking 技能用于对推荐资源做证据质量与时效性评估（判据：官方维护主体、最近更新时间、社区采纳度、是否有同行评议方法学论文支撑）。插图由图像生成技能绘制。');
p('');
p('—— 全文完 ——');

module.exports = C;
