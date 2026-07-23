# 零基础读懂 RNA-seq 差异表达分析

这份文档不假设你学过生物信息学、统计学或 R/Python。它解释我们刚才运行的 airway 示例到底做了什么，以及应该怎样读懂结果。

如果你还没有运行示例，请先看：

- [从克隆到跑通](README_ZH.md)
- [完整分析脚本](run_airway_demo.py)

---

## 1. 先用一句话理解这件事

我们有两组细胞：

- **control**：没有加药
- **treated**：加了地塞米松（dexamethasone, Dex）

RNA-seq 可以把细胞里很多基因的“表达量”测出来。我们想回答：

> 加药以后，哪些基因的表达量发生了可靠变化？变化方向是什么？变化有多大？

这就是 **RNA-seq 差异表达分析**。

可以把它想成一次非常大的“成千上万个指标的对照实验”：

```text
control 细胞  ─────────┐
                       ├── 比较每个基因的表达量
 treated 细胞 ─────────┘
```

这里不是只比较一个基因，而是一次比较两万多个基因。

---

## 2. 这次用的是什么实验？

本次示例是公开的 **airway** 数据集，研究人类气道平滑肌细胞对地塞米松的反应。

实验有 4 条不同的细胞系，每条细胞系各有一对样本：

| 细胞系 | control | treated |
|---|---|---|
| N61311 | SRR1039508 | SRR1039509 |
| N052611 | SRR1039512 | SRR1039513 |
| N080611 | SRR1039516 | SRR1039517 |
| N061011 | SRR1039520 | SRR1039521 |

所以总共是：

```text
4 条细胞系 × 每条 2 个条件 = 8 个样本
```

这里的“细胞系”很重要。不同细胞系本身可能就不一样，即使不加药，基因表达也可能有差异。

因此，我们不能简单地把所有 control 和所有 treated 粗暴地比较，而是要在统计模型里告诉程序：

> 请先考虑不同细胞系的基线差异，再判断 Dex 是否造成了额外变化。

这就是下面这个设计公式的意义：

```text
~ celltype + dex
```

---

## 3. 输入文件到底是什么？

### 3.1 `airway_rawcounts.csv`：基因计数矩阵

这个文件大致长这样：

| gene | sample_1 | sample_2 | sample_3 |
|---|---:|---:|---:|
| GeneA | 100 | 120 | 80 |
| GeneB | 0 | 3 | 1 |
| GeneC | 2500 | 2700 | 2100 |

实际数据中：

```text
64,102 个基因 × 8 个样本
```

每个数字是一个基因在一个样本中被测到的 **raw count**，也就是测序 reads 计数。

重要的是：

- 数字越大，通常表示这个基因的 RNA 越多
- 这是 count，不是百分比
- 不同样本测序深度不同，不能直接拿原始数字比较
- 原始 count 矩阵已经经过上游比对/定量；本示例没有从 FASTQ 重新比对

### 3.2 `airway_metadata.csv`：样本说明表

这个文件告诉程序每个样本属于哪个条件和哪条细胞系：

| id | dex | celltype |
|---|---|---|
| SRR1039508 | control | N61311 |
| SRR1039509 | treated | N61311 |

它相当于实验记录本。没有 metadata，程序不知道哪个样本是 control，哪个是 treated，也不知道哪些样本属于同一条细胞系。

### 3.3 `annotables_grch38.csv`：基因注释表

差异表达结果内部主要用 Ensembl gene ID，例如：

```text
ENSG00000120129
```

人类通常更容易读基因符号，例如：

```text
DUSP1
```

注释表负责把 Ensembl ID 对应到基因符号、染色体、基因描述等信息。

---

## 4. 整个分析流程像什么？

程序实际执行的是下面这条流水线：

```text
读取 count 矩阵和样本信息
        ↓
检查样本名是否匹配
        ↓
过滤几乎没有信号的基因
        ↓
校正不同样本的测序深度
        ↓
检查样本质量和样本之间的关系
        ↓
拟合差异表达统计模型
        ↓
计算每个基因的变化大小和显著性
        ↓
校正多重比较
        ↓
画图、导出结果、写报告
```

下面逐步解释。

---

## 5. 第一步：过滤低表达基因

原始矩阵里有很多基因几乎没有 reads。例如一个基因在 8 个样本中的总 count 可能只有 0、1、0、2、0、0、1、0。

这种基因即使算出一个很大的倍数变化，也没有足够信息支持结论。

本示例使用的规则是：

```text
8 个样本的总 raw count >= 10
```

结果：

| 阶段 | 基因数 |
|---|---:|
| 过滤前 | 64,102 |
| 过滤后 | 22,369 |

这不是说其余 41,733 个基因“没有生物学意义”，而是说：

> 在当前 8 个样本和当前测序数据里，它们的计数太低，不适合做可靠的差异检验。

过滤的目的主要是减少噪声、提高统计效率。

---

## 6. 第二步：为什么需要归一化？

假设两个样本真实表达完全一样，但测序深度不同：

| 样本 | 测序 reads 总数 | GeneA count |
|---|---:|---:|
| Sample A | 1,000 万 | 1,000 |
| Sample B | 2,000 万 | 2,000 |

如果只看 raw count，会误以为 Sample B 的 GeneA 表达量是 A 的 2 倍。

实际上，B 只是测得更深。

所以程序会估计每个样本的 **size factor**，用来调整测序深度和整体表达规模。

本次 size factor 范围：

```text
0.670 – 1.399
```

归一化后，样本之间才可以更公平地比较。

注意：

- size factor 不是某个基因的变化倍数
- 它是样本级别的校正系数
- 归一化不会“制造”生物学差异，只是尽量消除测序深度差异

---

## 7. 第三步：样本 QC 看什么？

### 7.1 Library size

Library size 可以粗略理解为每个样本的总计数规模。

本次范围：

```text
15,163,415 – 30,818,215
```

这说明不同样本测序深度确实不同，所以归一化是必要的。

### 7.2 Detected genes

这是每个样本中 count > 0 的基因数量。

本次范围：

```text
23,124 – 25,998
```

如果某个样本的检测基因数远低于其他样本，可能需要进一步调查测序质量、RNA 质量或文库制备问题。

本次没有出现完全脱离整体的样本。

### 7.3 样本相关性

本次样本之间的 Spearman 相关系数大约为：

```text
0.959 – 0.978
```

相关系数越接近 1，表示整体表达模式越相似。这里整体相关性较高，说明样本没有明显“完全坏掉”的迹象。

但这只是基因表达矩阵层面的检查，不能替代 FASTQ 级别的 FastQC、比对率、重复率等 QC。

---

## 8. PCA 图到底在看什么？

PCA 是一种把“几万个基因的复杂差异”压缩到二维图上的方法。

可以把它想象成：

> 每个样本原本是一个包含两万多个数字的点。PCA 尝试找出最能解释样本差异的几个方向，然后画出前两个方向。

图中的：

- 每个点 = 一个样本
- 点离得近 = 整体表达模式相似
- 点离得远 = 整体表达模式差异较大
- 颜色 = control 或 treated
- 形状 = 不同 cell line

本次 PCA 中：

- PC1 主要反映不同细胞系之间的基线差异
- PC2 主要区分 control 和 treated

这正是为什么模型不能只写：

```text
~ dex
```

而要写：

```text
~ celltype + dex
```

`celltype` 是需要控制的背景差异，`dex` 是我们真正关心的处理因素。

### PCA 不等于差异表达结果

PCA 只回答：

> 样本整体表达模式如何分组？

它不能直接告诉你哪个具体基因显著，需要后面的基因级统计检验。

---

## 9. 差异表达模型做了什么？

对每一个基因，程序都会问：

> 在考虑 cell line 差异后，treated 和 control 的表达是否还存在系统性差别？

模型大致可以写成：

```text
gene expression = cell line effect + Dex treatment effect + random variation
```

实际使用的是适合 RNA-seq count 数据的 **负二项模型**，不是普通的 t-test。

本次使用 PyDESeq2，它是 Python 中与 DESeq2 思路兼容的实现。

### 为什么不用普通 t-test？

RNA-seq count 有几个特点：

- 是非负整数
- 不同基因的波动程度不同
- 平均表达越高，计数波动通常也越大
- 很多基因有 0 count
- 测序深度需要纳入模型

负二项模型更适合描述这类 count 数据。

---

## 10. `log2FC` 是什么？

`FC` 是 Fold Change，表示倍数变化：

```text
Fold Change = treated 表达量 / control 表达量
```

RNA-seq 通常使用以 2 为底的对数：

```text
log2FC = log2(treated / control)
```

### 常见数值怎么理解？

| log2FC | 近似含义 |
|---:|---|
| +1 | treated 约为 control 的 2 倍 |
| +2 | treated 约为 control 的 4 倍 |
| +3 | treated 约为 control 的 8 倍 |
| 0 | 两组没有变化 |
| -1 | treated 约为 control 的 1/2 |
| -2 | treated 约为 control 的 1/4 |
| -3 | treated 约为 control 的 1/8 |

本报告中：

- 正值 = Dex 后上调
- 负值 = Dex 后下调

例如：

```text
CRISPLD2 log2FC = +2.631
```

说明它在 treated 中比 control 高，粗略倍数为：

```text
2^2.631 ≈ 6.2 倍
```

再比如：

```text
VCAM1 log2FC = -3.685
```

说明 treated 中的表达大约是 control 的：

```text
2^-3.685 ≈ 0.077
```

也就是大约下降到原来的 7.7%。

### log2FC 大不等于一定可靠

一个基因可能因为 count 很低而出现很大的倍数变化，但不稳定。所以必须结合 p-value、FDR 和原始表达量一起看。

---

## 11. p-value 是什么？

p-value 可以粗略理解为：

> 如果实际上没有处理效应，像现在这么大的差异有多难随机出现？

例如：

```text
p-value = 0.001
```

表示在“没有真实差异”的假设下，观察到这样强的证据并不常见。

但 RNA-seq 一次会检验成千上万个基因。即使所有基因都没有真实差异，单纯因为检验次数很多，也可能偶然出现大量小 p-value。

---

## 12. FDR / adjusted p-value 为什么更重要？

本次检验了 22,369 个基因。

如果只使用原始 p-value < 0.05，那么理论上即使完全没有真实差异，也可能出现：

```text
22,369 × 0.05 ≈ 1,118 个“看起来显著”的基因
```

因此程序会对 p-value 做多重比较校正。本次使用的是 Benjamini–Hochberg 方法，得到 `padj`，也常叫 FDR。

我们主要使用：

```text
FDR / padj < 0.05
```

它控制的是显著结果集合中的预期错误发现比例，而不是保证每一个基因都百分之百正确。

### 这三个数不要混淆

| 名称 | 含义 |
|---|---|
| `log2FoldChange` | 变化方向和变化大小 |
| `pvalue` | 未校正的单基因统计显著性 |
| `padj` / `FDR` | 考虑多重比较后的显著性 |

实际读结果时，优先看：

```text
padj < 0.05
```

而不是只看 raw p-value。

---

## 13. 本次到底发现了多少差异基因？

| 筛选条件 | 基因数 |
|---|---:|
| 过滤后进入检验 | 22,369 |
| FDR < 0.05 | 3,924 |
| FDR < 0.05 且 log2FC > 0 | 2,158 |
| FDR < 0.05 且 log2FC < 0 | 1,766 |
| FDR < 0.05 且 |log2FC| >= 1 | 1,043 |

这里的 1,043 个是比较严格、也更容易解释的一组：

```text
既要统计显著，又要至少约 2 倍变化
```

但是“显著”不等于“重要”，也不等于“已经证明了机制”。后续还需要文献、通路分析和独立实验验证。

---

## 14. 怎么看 Volcano plot？

Volcano plot 的两个轴：

- 横轴：`log2FC`
- 纵轴：`-log10(FDR)`

因此：

- 越往右 = 上调越强
- 越往左 = 下调越强
- 越往上 = FDR 越小，统计证据越强

图上的两条竖线通常是：

```text
log2FC = -1 和 +1
```

横向虚线通常是：

```text
FDR = 0.05
```

右上角：强烈且显著上调。  
左上角：强烈且显著下调。  
中间靠下：变化小或证据不足。

### Volcano plot 不能单独证明生物学意义

一个点越靠上，主要说明统计证据强；它不一定是最重要的药物靶点，也不一定有功能验证。

---

## 15. 怎么看 MA plot？

MA plot 的两个轴：

- 横轴：平均表达量 `baseMean`
- 纵轴：`log2FC`

它可以帮助判断：

- 低表达基因是否出现特别夸张但不稳定的变化
- 高表达基因的变化是否整体偏向一侧
- 差异是否主要集中在高表达或低表达区域

常见现象是低表达区域波动较大，因此不能只按 log2FC 排名。

---

## 16. 怎么看 Heatmap？

Heatmap 通常选择一批差异最显著的基因：

- 每一行 = 一个基因
- 每一列 = 一个样本
- 红色/蓝色 = 相对高/低表达
- 这里使用的是每个基因内部做 z-score 后的相对值

因此 heatmap 颜色不代表绝对 count，而是帮助观察：

- treated 和 control 是否形成不同模式
- 同一条 cell line 的配对是否仍然相似
- 某个基因的方向是否在多个细胞系中一致

本次 top genes 中可以看到多个基因在 treated 样本中整体偏高或偏低。

---

## 17. 本次代表性基因怎么理解？

### 17.1 上调基因

代表性上调基因包括：

```text
SPARCL1
SAMHD1
MAOA
GPX3
DUSP1
KLF15
PER1
CRISPLD2
FKBP5
TSC22D3
```

其中：

- `CRISPLD2`：本来就是该 airway 原始研究重点关注的糖皮质激素响应基因；本次 log2FC = 2.631，FDR = 7.41e-60。
- `FKBP5`：log2FC = 4.047，提示强烈上调。
- `DUSP1`：常与应激和 MAPK 调控相关，本次显著上调。
- `TSC22D3`：也常被称为 GILZ，是经典糖皮质激素响应相关基因。
- `KLF15`、`PER1`：也显示出明显的处理响应。

### 17.2 下调基因

代表性下调基因包括：

```text
VCAM1
KCTD12
SOX4
CXCL12
COL1A1
WNT2
IFIT1
PTGS2
CCL2
IL6
```

其中：

- `VCAM1`：log2FC = -3.685，FDR = 1.13e-95。
- `COL1A1`：与细胞外基质相关，本次下调。
- `PTGS2`：log2FC = -1.360，方向上与炎症反应减弱一致。
- `CCL2`、`IL6`：也呈下调，但具体效应大小应结合 count 和实验验证解释。

这些结果可以作为后续研究线索，但不能只凭 RNA-seq 结果就断言药物机制。

---

## 18. Targeted signature 是什么？

本示例还做了一个补充检查：把显著上调或下调的基因，与一些预先整理的小型基因集合进行重叠比较。

例如：

- glucocorticoid response core
- inflammatory response
- interferon response
- TGF-beta / fibrotic response
- cell cycle
- apoptosis

本次结果中：

| 方向 | Signature | Overlap | FDR |
|---|---|---:|---:|
| Up | Glucocorticoid response core | 11 / 15 | 4.58e-08 |
| Down | Interferon response | 10 / 17 | 7.86e-07 |
| Down | TGF-beta / fibrotic response | 5 / 16 | 2.10e-02 |
| Down | Inflammatory response | 5 / 18 | 2.39e-02 |

这说明显著基因的方向与这些已知反应签名有一定一致性。

但是必须强调：

> 这不是完整的 GO、KEGG 或 Reactome 富集分析，只是一个透明的、有限的方向性检查。

真正的通路分析需要固定数据库版本、完整基因注释和完整背景基因集合。

---

## 19. 这些结果能不能直接说“药物有效”？

不能直接这么说。

这次分析能支持的表述是：

> 在这 4 条人类气道平滑肌细胞系中，18 小时地塞米松处理与多个基因的表达变化相关；这些变化包括糖皮质激素响应相关基因上调，以及部分炎症、细胞黏附和细胞外基因相关表达下降。

不能直接从这次分析推出：

- 对所有人都有效
- 对患者临床有效
- 没有副作用
- 已经证明了完整分子机制
- 某个基因一定是直接靶点

因为实验样本量很小，而且这是体外细胞实验。

---

## 20. 这次分析没有做什么？

### 没有从 FASTQ 开始

本次输入已经是 gene-level count matrix，所以没有重新执行：

- FastQC
- 接头去除
- reads 比对
- 比对率统计
- PCR duplication 检查
- rRNA 比例检查
- featureCounts / Salmon 定量

如果你有自己的 FASTQ 文件，需要增加这些上游步骤。

### 没有使用 R/DESeq2

当前测试环境没有 Docker 和 R，因此使用了 PyDESeq2 0.5.4。

它遵循 DESeq2 的核心思路，但如果发表或提交正式结果，建议在 Docker/R 环境中用：

```text
DESeq2
```

按照相同设计：

```text
~ celltype + dex
```

再复核一次。

### 没有做完整通路富集

本示例只做了 targeted signature check。正式分析还应考虑：

- GO Biological Process
- KEGG
- Reactome
- MSigDB Hallmark
- GSEA / ORA

并记录数据库和版本。

---

## 21. 输出文件应该怎么看？

结果目录：

```text
data/rnaseq_airway_example/output/
```

### 最重要的几个文件

#### `report.html`

浏览器打开的完整报告。

#### `differential_expression_all_genes.csv`

全部进入统计检验的基因。重点列：

| 列名 | 含义 |
|---|---|
| `ensembl_gene_id` | Ensembl 基因 ID |
| `symbol` | 基因符号 |
| `baseMean` | 归一化后的平均表达量 |
| `log2FoldChange` | treated 相对 control 的变化大小 |
| `lfcSE` | log2FC 的标准误 |
| `stat` | Wald test 统计量 |
| `pvalue` | 原始 p-value |
| `padj` | BH 校正后的 p-value / FDR |

#### `differential_expression_significant_padj_0.05.csv`

只保留：

```text
padj < 0.05
```

#### `differential_expression_significant_padj_0.05_abs_log2fc_1.csv`

只保留：

```text
padj < 0.05 且 |log2FC| >= 1
```

这是比较适合人工优先查看的严格结果集。

#### `normalized_counts_filtered.csv`

归一化后的表达矩阵，适合画图和探索，不应直接当作差异检验的输入替代品。

#### `sample_qc_with_size_factors.csv`

每个样本的文库大小、检测基因数和 size factor。

### 图件

| 文件 | 回答的问题 |
|---|---|
| `fig1_library_size_and_detection` | 每个样本的测序规模和检测基因数是否异常？ |
| `fig2_pca_samples` | 样本整体表达模式如何分组？ |
| `fig3_sample_correlation` | 样本之间整体相似程度如何？ |
| `fig4_volcano` | 哪些基因同时具有较大变化和强统计证据？ |
| `fig5_MA_plot` | 差异是否依赖平均表达量？ |
| `fig6_top_genes_heatmap` | top genes 在各样本中的表达模式是否一致？ |
| `fig7_pvalue_distribution` | p-value 整体分布是否合理？ |
| `fig8_targeted_signature_enrichment` | 预定义反应签名是否与结果方向重叠？ |

---

## 22. 如果换成自己的数据，需要准备什么？

至少需要两个文件。

### Count matrix

要求：

- 行是 gene
- 列是 sample
- 第一列是 gene ID
- 其他列是非负整数 count
- 列名必须和 metadata 中的样本 ID 对得上

示意：

```csv
gene_id,ctrl_1,ctrl_2,treat_1,treat_2
ENSG000001,100,120,250,270
ENSG000002,0,3,10,12
```

### Metadata

至少包含：

```csv
id,condition
ctrl_1,control
ctrl_2,control
treat_1,treated
treat_2,treated
```

如果有批次或配对信息，最好也提供：

```csv
id,condition,batch,patient
ctrl_1,control,batch1,P01
treat_1,treated,batch1,P01
```

对应设计可能是：

```text
~ patient + batch + condition
```

具体设计取决于实验方案，不能机械照抄。

---

## 23. 零基础最应该记住的 8 件事

1. **count matrix 是基因 × 样本的数字表。**
2. **metadata 告诉程序每个样本属于哪个实验条件。**
3. **低表达过滤是去掉信息太少的基因，不是删除有价值的生物学。**
4. **归一化是为了消除不同样本测序深度差异。**
5. **`log2FC` 看变化方向和大小。**
6. **`padj/FDR` 比原始 p-value 更适合在成千上万个基因中判断显著性。**
7. **PCA、相关性和 heatmap 看整体模式；Volcano 和 CSV 看具体基因。**
8. **差异表达是线索，不是单独完成的机制证明；关键结果还需要独立实验验证。**

---

## 24. 最后用一张图总结

```text
原始 count matrix
        │
        ├── 样本信息 metadata
        │
        ▼
低表达过滤 + 样本深度归一化
        │
        ▼
QC：library size / PCA / correlation
        │
        ▼
统计模型：~ celltype + dex
        │
        ▼
每个基因得到：log2FC、p-value、FDR
        │
        ▼
火山图 / MA 图 / 热图 / 结果 CSV
        │
        ▼
结合生物学背景、通路和实验验证解释
```

这条流程的核心不是“跑出一个数字”，而是：

> 用合适的实验设计和统计模型，把大量测序计数转换成一组可以进一步验证的生物学线索。
