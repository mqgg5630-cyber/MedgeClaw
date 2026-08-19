# 深度学习肽预测入门 → 前沿：ESM-C / ESM3 / AI Agent

> 面向你本机环境（WSL + conda `amp-esm` / `amppre` 等）的**可直接跟跑**端到端教程。  
> 路径（mqgg 仓库）：`tutorials/amp-dl-esmc/`  
> 默认特征：**ESM-C**（EvolutionaryScale Cambrian，当前推荐的序列表征模型）；装不上时自动回退 **ESM-2 → 手工特征**。

---

## 0. 先读这 30 秒

| 问题 | 答案 |
|------|------|
| 现在提特征用啥？ | **优先 ESM-C**（`esmc_300m` / `esmc_600m`）。AMP 文献里仍大量用 **ESM-2** 作基线。 |
| ESM3 呢？ | **生成 / 多模态设计**（序列+结构+功能），不是第一选择的「分类 embedding 工具」。 |
| 我该用哪个 conda？ | 优先 **`amp-esm`**；没有就 `amppre` / 新建 `amp-esmc`。 |
| 没 GPU 能跑吗？ | 能。demo 默认可走 `handcrafted`；ESM-C 300M 在 CPU 上也能跑小数据，只是慢。 |
| 数据和权重会进 Git 吗？ | 不会。`outputs/`、`.cache/` 已忽略；仓库只带 demo CSV + 代码。 |

---

## 1. 背景地图（入门 → 前沿）

```
肽序列
  ├─ 传统特征: AAC / DPC / PseAAC / CTD / iFeature
  ├─ 深度学习: CNN / BiLSTM / Attention（端到端 one-hot 或 embedding）
  ├─ 蛋白语言模型 PLM（推荐主线）
  │    ├─ ESM-2          ← 2022，AMP 论文最常见
  │    ├─ ESM-C (Cambrian) ← 2024-12，表征更强、同尺寸更省
  │    ├─ ProtT5 / ProtBERT / ESM-1v ...
  │    └─ ESM3           ← 生成式多模态，偏设计与条件生成
  ├─ 结构增强: ESMFold / AlphaFold2 + GNN（接触图/表面）
  └─ Agent 工作流: 数据→特征→训练→文献→实验设计（MedgeClaw / Claude Code）
```

### 1.1 模型怎么选（2025–2026 实用建议）

| 目标 | 推荐 | 说明 |
|------|------|------|
| AMP vs non-AMP 分类，提冻结特征 + ML/MLP | **ESM-C 300M/600M** | 官方定位：ESM-2 的强化表征替代；300M ≈ 旧 650M 量级能力、更省显存 |
| 复现/对比论文基线 | **ESM-2**（`t33_650M` 或更小 `t12_35M`） | 方便和 UniDL4Biopep、FusPB-ESM2、esm-AxP-GDL 等对比 |
| 设计新肽 / 条件生成 | **ESM3**（open 或 Forge API） | 序列/结构/功能轨道迭代 unmask |
| 无 GPU、先跑通 pipeline | **handcrafted** | 本教程内置，保证教学链路不断 |
| 可解释 / 残基重要性 | 冻结 embedding + SHAP；或 attention / 梯度 | demo 提供经典模型 SHAP |
| 结构化 SOTA 路线 | PLM embedding + 结构图（GNN） | 进阶，本 demo 不强制依赖 AF2 |

**一句话**：  
- **提特征做预测 → ESM-C（不行就 ESM-2）**  
- **做生成设计 → ESM3**  
- **做科研助手串联实验 → AI Agent（MedgeClaw）**

### 1.2 典型现代 AMP 架构（你论文里可以这样写）

1. **PLM embedding + 浅层分类头**（本教程主路径）  
   `序列 → ESM-C mean pool → StandardScaler → Logistic/RF/HGBM/MLP`
2. **PLM + CNN/BiLSTM/Attention**  
   用 per-residue embedding 作输入（需改 `pooling` 与模型，进阶）
3. **双塔 / 融合**  
   ProtBERT ∥ ESM-2 拼接（如 FusPB-ESM2 一类）
4. **结构多模态**  
   ESMFold/AF2 接触图 + GNN + PLM 节点特征
5. **Agent 闭环**  
   自动拉 DBAASP/APD → 去冗余 → 训练 → 报告 → 建议湿实验

---

## 2. 目录结构

```text
tutorials/amp-dl-esmc/
├── README.md                 ← 本教程
├── config.yaml               ← 所有超参
├── requirements.txt
├── data/demo/                ← 可跑通的玩具数据（非基准集）
│   ├── train.csv
│   ├── test.csv
│   └── to_predict.fasta
├── scripts/
│   ├── 00_check_env.py       ← 看环境缺什么
│   ├── 01_prepare_data.py
│   ├── 02_extract_features.py
│   ├── 03_train.py
│   ├── 04_predict.py
│   ├── 05_shap_report.py
│   └── run_all.sh            ← 一键
├── src/
│   ├── data.py
│   ├── features.py           ← ESM-C / ESM-2 / handcrafted
│   ├── models.py
│   └── utils.py
└── outputs/                  ← 运行后生成（不进 Git）
```

---

## 3. 环境（对着你的机器）

你已有：

```text
amp-esm      ← 优先用这个跑本教程
amppre
AMPidentifier
NTxPred2
bitoxnet
...
```

### 3.1 激活并自检

```bash
cd /home/w24e/projects/MedgeClaw-mqgg   # 若 Arena 已 push，先 git pull
# git checkout arena/01a0193d-medgeclaw
# git pull origin arena/01a0193d-medgeclaw

cd tutorials/amp-dl-esmc
conda activate amp-esm

python scripts/00_check_env.py
```

脚本会打印：

- numpy / pandas / sklearn / torch / cuda 是否可用  
- **ESM-C API 是否可 import**  
- **ESM-2（fair-esm）是否可 import**  
- 最终 `SELECTED_BACKEND=esmc|esm2|handcrafted`

### 3.2 缺什么装什么

```bash
conda activate amp-esm
pip install -r requirements.txt
```

**ESM-C（推荐）**

```bash
pip install esm
# 首次本地权重会从 HuggingFace 拉 esmc_300m
# 若需登录：huggingface-cli login
```

**注意 `esm` 包名冲突**

| 包 | import | 用途 |
|----|--------|------|
| `esm`（EvolutionaryScale，PyPI） | `from esm.models.esmc import ESMC` | **ESM-C / ESM3** |
| `fair-esm`（Meta） | `import esm; esm.pretrained...` | **ESM-2** |

两者都叫 `esm`，**不要装在同一环境硬刚**。策略：

- `amp-esm` 专供 EvolutionaryScale（ESM-C）  
- 另建 `amp-esm2` 装 `fair-esm` 做文献基线  
- 或本教程 `backend: handcrafted` / `esm2` 按自检结果自动选

**只有 CPU / 先跑通**

```bash
BACKEND=handcrafted bash scripts/run_all.sh
# 或
python scripts/02_extract_features.py --backend handcrafted
```

**可选 API（无本地 GPU 时）**

```bash
export ESM_API_KEY=你的_forge_或_biohub_token
# 然后改 config.yaml:
# features.esmc.use_api: true
```

### 3.3 环境对照表（跑完 00 对照）

| 组件 | 必须？ | 没有时 |
|------|--------|--------|
| Python 3.10+ | 是 | 换环境 |
| numpy/pandas/scikit-learn | 是 | `pip install ...` |
| torch | 建议 | MLP 与 ESM 都需要；纯 sklearn+handcrafted 可改代码去掉 |
| `esm` (ESM-C) | 推荐 | 回退 ESM-2 / handcrafted |
| fair-esm | 可选 | 仅 ESM-2 基线 |
| CUDA GPU | 可选 | CPU 跑 demo；正式训练建议 GPU |
| shap | 可选 | 跳过 05 |
| biopython | 可选 | demo 未强依赖 |

---

## 4. 一键跑通（demo）

```bash
cd /home/w24e/projects/MedgeClaw-mqgg/tutorials/amp-dl-esmc
conda activate amp-esm

# 全部步骤
bash scripts/run_all.sh

# 或强制手搓特征（最稳、不下载模型）
BACKEND=handcrafted bash scripts/run_all.sh
```

分步：

```bash
python scripts/00_check_env.py
python scripts/01_prepare_data.py
python scripts/02_extract_features.py          # --backend esmc|esm2|handcrafted
python scripts/03_train.py
python scripts/04_predict.py
python scripts/05_shap_report.py              # 可选
```

成功后看：

```text
outputs/data/prepare_meta.json
outputs/features/feature_meta.json      # 记录真实用的 backend 与维度
outputs/models/metrics.csv              # CV + test
outputs/models/BEST_MODEL.txt
outputs/predict/predictions.csv
outputs/explain/shap_top_dims_*.png     # 若 shap 可用
```

### 4.1 预期现象（demo 玩具数据）

- 样本量很小（~60 train / 16 test），**指标会虚高或波动大**，只证明 pipeline 通。  
- `handcrafted` 维度约 **426**；ESM-C 300M mean pool 约 **960** 量级（以实际 `feature_meta.json` 为准）。  
- 预测 FASTA 里 polyG / 酸性肽应倾向 non-AMP，magainin/indolicidin 样序列倾向 AMP。

---

## 5. 代码在干什么（端到端）

### Step A — 数据

- 大写、去空格、长度过滤、字母表校验、去重  
- 分层划出 train 内 val（给 MLP early stop）  
- **正式研究**请换：DBAASP / APD3 / DRAMP 等，并做 CD-HIT 去冗余与独立测试集

### Step B — 特征（核心）

```text
backend=auto
  try ESM-C local (esmc_300m)
  else ESM-2 (fair-esm)
  else handcrafted AAC+DPC+props
```

ESM-C 本地核心逻辑（与官方一致）：

```python
from esm.models.esmc import ESMC
from esm.sdk.api import ESMProtein, LogitsConfig

client = ESMC.from_pretrained("esmc_300m").to("cuda")  # or cpu
protein = ESMProtein(sequence="GIGKFLHSAKKFGKAFVGEIMNS")
tensor = client.encode(protein)
out = client.logits(tensor, LogitsConfig(sequence=True, return_embeddings=True))
# out.embeddings → mean pool over residues
```

### Step C — 模型

- **Logistic / RandomForest / HistGBM**（带 `StandardScaler` 的 Pipeline）  
- **MLP** 接在冻结向量上（不是全参微调 PLM，demo 友好）  
- 5-fold CV + hold-out test；选出 `BEST_MODEL`

### Step D — 预测

- 读 FASTA → 同一 backend 提特征 → `prob_amp` + `pred_label`

### Step E — 解释

- 对 sklearn 模型做 SHAP（embedding 维度重要性；不是氨基酸位点图）

---

## 6. 换成你自己的数据

1. 准备 CSV：

```csv
sequence,label
GIGKFLHSAKKFGKAFVGEIMNS,1
MSTEQQASEVKQLTEEQK,0
```

2. 改 `config.yaml`：

```yaml
data:
  train_csv: /path/to/your_train.csv
  test_csv: /path/to/your_test.csv
```

3. 有 GPU 时建议：

```yaml
features:
  backend: esmc
  esmc:
    model_name: esmc_300m   # 显存够再上 esmc_600m
  batch_size: 4
```

4. 重新跑 `01 → 04`。

**数据质量清单（写论文前）**

- [ ] 正负样本来源与时间切割说清楚  
- [ ] 序列同一性去冗余（如 40%–90% CD-HIT，按任务定）  
- [ ] 长度分布、单体/修饰肽是否剔除  
- [ ] 独立外部测试集（别只报 CV）  
- [ ] 与公开 AMP predictor 对比（AMPscanner, Macrel, ...）

---

## 7. 进阶路线（教程之后）

### 7.1 全参数 / 高效微调 PLM

- LoRA / 分类头微调 ESM-C 或 ESM-2  
- 注意肽短序列与蛋白质预训练分布偏移

### 7.2 Per-residue + CNN-BiLSTM-Attention

- `features.pooling` 改为保存 `per_tok`（需改 `features.py` 返回 3D 张量）  
- 结构类似 iAMP-Attenpred

### 7.3 ESM3 设计新 AMP

```python
# 概念示例：需要 esm3 权重与协议许可
from esm.models.esm3 import ESM3
from esm.sdk.api import ESMProtein, GenerationConfig
model = ESM3.from_pretrained("esm3-open").to("cuda")
protein = ESMProtein(sequence="____KFLHSAKKFGKAFVGEIMNS____")
protein = model.generate(protein, GenerationConfig(track="sequence", num_steps=8, temperature=0.7))
```

然后把生成序列丢回本教程的 **分类器过滤**（活性/溶血/毒性多任务更佳）。

### 7.4 AI Agent（MedgeClaw）怎么接

在 MedgeClaw 对话里可以固定技能流：

1. 查文献 / 下 DBAASP  
2. `cd tutorials/amp-dl-esmc && bash scripts/run_all.sh`  
3. 读 `metrics.csv` + 画图  
4. 生成实验优先级列表（电荷、疏水矩、溶血风险）

本仓库的 `skills/biomed-dispatch` 即是「对话 → 执行」桥。

### 7.5 多任务与 MIC

- 二分类只是第一步  
- 物种特异 MIC 回归（如 LLAMP 类：肽 PLM + 细菌基因组编码）是前沿方向

---

## 8. 常见问题

**Q: `writing_outputs` 提交不进去？**  
A: 根目录 `.gitignore` 忽略了 `writing_outputs/`。本教程放在 **`tutorials/amp-dl-esmc/`**，可正常提交。

**Q: `pip install esm` 后原来的 `import esm`（fair-esm）挂了？**  
A: 包名冲突。用独立 conda env，或只在一个环境保留一种。

**Q: HuggingFace 下载慢？**  
A: `export HF_ENDPOINT=https://hf-mirror.com`（若你使用镜像），或 `use_api: true` 走 Forge。

**Q: 指标完美 1.0？**  
A: demo 数据泄漏式小样本，正常。换真实去冗余数据会掉下来。

**Q: 只想检查环境把结果发回 Arena？**  
A: 把 `python scripts/00_check_env.py` 完整终端输出贴回来即可。

---

## 9. 引用（写论文时）

- ESM-2: Lin et al., Science 2023  
- ESM3: Hayes et al., Science 2025  
- ESM C / Cambrian: EvolutionaryScale technical blog & model card（`esmc-300m-2024-12` 等）  
- AMP+PLM 综述：关注 UniDL4Biopep、FusPB-ESM2、结构+GNN 类工作  

---

## 10. 和本仓库其它目录的关系

| 路径 | 用途 |
|------|------|
| `tutorials/amp-dl-esmc/` | **本可运行教程（请用这个）** |
| `writing_outputs/` | 被 gitignore 的写作草稿；不要往这里 `git add` |
| 你本地的 `E:\0docx\AMP预测代码框架` | 可把 `peptide_amp_project` 对照合并到本教程 |

把旧框架拷进本目录（可选）：

```bash
cp -a /mnt/e/0docx/AMP预测代码框架/peptide_amp_project \
  /home/w24e/projects/MedgeClaw-mqgg/tutorials/amp-dl-esmc/legacy_framework
```

---

## 11. 命令速查

```bash
conda activate amp-esm
cd tutorials/amp-dl-esmc

python scripts/00_check_env.py
BACKEND=handcrafted bash scripts/run_all.sh   # 最稳冒烟
bash scripts/run_all.sh                       # 自动选 ESM-C/2
python scripts/04_predict.py --fasta data/demo/to_predict.fasta
```

跑完把下面贴回来，我帮你看环境与指标是否正常：

```bash
python scripts/00_check_env.py
cat outputs/features/feature_meta.json
cat outputs/models/metrics.csv
cat outputs/predict/predictions.csv
```
