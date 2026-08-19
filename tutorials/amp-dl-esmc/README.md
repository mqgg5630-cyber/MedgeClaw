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
| 我该用哪个 conda？ | **纯** `conda activate amp-esm`（Python 3.10–3.12）。不要和 `medgeclaw-rnaseq` venv 叠在一起。 |
| 没 GPU / 没 torch 能跑吗？ | **能。** 路径 C：`BACKEND=handcrafted` + 经典 ML（不需要 torch/esm）。 |
| 数据和权重会进 Git 吗？ | 不会。`outputs/`、`.cache/` 已忽略；仓库只带 demo CSV + 代码。 |

### 0.1 你上次自检的结论（对号入座）

```
Python : 3.14.6  (/home/w24e/.venvs/medgeclaw-rnaseq/bin/python)
提示符 : (amp-esm) (medgeclaw-rnaseq)   ← 两个环境叠了，venv 抢了 PATH
缺     : tqdm, torch, esm, Bio, shap
有     : numpy, pandas, sklearn, matplotlib, seaborn
```

**问题不是教程坏了，是 Python 指错了。**  
Python 3.14 + medgeclaw-rnaseq 上装 `torch`/`esm` 很容易失败；先纠正环境，再谈 ESM-C。

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

### 3.1 先纠正环境（必做）

```bash
cd /home/w24e/projects/MedgeClaw-mqgg
git fetch origin && git checkout arena/01a0193d-medgeclaw
git pull origin arena/01a0193d-medgeclaw
cd tutorials/amp-dl-esmc

# 诊断混用
bash scripts/fix_env.sh

# 退出所有栈，只留 amp-esm
deactivate 2>/dev/null || true
conda deactivate 2>/dev/null || true
conda deactivate 2>/dev/null || true
conda activate amp-esm
hash -r
which python && python -V
# 期望: .../miniconda3/envs/amp-esm/bin/python 且 3.10–3.12
# 若仍是 3.14 或路径含 medgeclaw-rnaseq → 新建 amp-esmc（见下）
```

**新建干净环境（推荐，一次到位）：**

```bash
conda create -n amp-esmc python=3.11 -y
conda activate amp-esmc
cd /home/w24e/projects/MedgeClaw-mqgg/tutorials/amp-dl-esmc
python -m pip install -U pip
python -m pip install -r requirements-minimal.txt
python scripts/00_check_env.py
```

### 3.2 三条可跑路径

| 路径 | 条件 | 命令 |
|------|------|------|
| **C 冒烟** | 仅有 numpy/pandas/sklearn | `BACKEND=handcrafted bash scripts/run_all.sh` |
| **B ESM-2** | fair-esm + torch，Py≤3.12 | `pip install torch fair-esm` → `BACKEND=esm2 bash scripts/run_all.sh` |
| **A ESM-C** | `esm` + torch，Py≤3.12 | `pip install torch esm` → `bash scripts/run_all.sh` |

现在（你这台机子混用 3.14 时）请先走 **路径 C**，确认流水线；再换干净 conda 上 **路径 A**。

```bash
# --- 路径 C：当前最小依赖也能跑（不装 torch）---
python -m pip install -r requirements-minimal.txt
# 若还在错误的 3.14 上，至少 tqdm 已不再是硬依赖
BACKEND=handcrafted bash scripts/run_all.sh

# --- 路径 A：在 amp-esmc (3.11) ---
conda activate amp-esmc
python -m pip install -r requirements.txt
# GPU 请按 pytorch.org 换 cu 版本；CPU 可用:
# pip install torch --index-url https://download.pytorch.org/whl/cpu
bash scripts/run_all.sh
```

### 3.3 `esm` 包名冲突

| 包 | import | 用途 |
|----|--------|------|
| `esm`（EvolutionaryScale） | `from esm.models.esmc import ESMC` | **ESM-C / ESM3** |
| `fair-esm`（Meta） | `import esm; esm.pretrained` | **ESM-2** |

不要同环境混装。`amp-esmc` 专 ESM-C；另建 `amp-esm2` 做文献基线。

### 3.4 依赖表

| 组件 | 路径 C | 路径 A (ESM-C) | 没有时 |
|------|--------|----------------|--------|
| Python 3.10–3.12 | 建议 | **必须** | 3.14 勿硬装 torch/esm |
| numpy/pandas/sklearn/pyyaml/joblib | 必须 | 必须 | `pip install -r requirements-minimal.txt` |
| tqdm | 可选 | 可选 | 内置简易进度条 |
| torch | 否 | 必须 | 自动 skip MLP |
| esm (ESM-C) | 否 | 必须 | 回退 esm2/handcrafted |
| shap/matplotlib | 否 | 可选 | skip 05 |

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

## 11. 命令速查（复制即用）

```bash
cd /home/w24e/projects/MedgeClaw-mqgg
git pull origin arena/01a0193d-medgeclaw
cd tutorials/amp-dl-esmc

# 纠正环境
bash scripts/fix_env.sh
deactivate 2>/dev/null; conda deactivate 2>/dev/null; conda deactivate 2>/dev/null
conda activate amp-esm   # 或 amp-esmc
which python && python -V

python scripts/00_check_env.py
python -m pip install -r requirements-minimal.txt
BACKEND=handcrafted bash scripts/run_all.sh

# 干净 3.11 上 ESM-C：
# conda activate amp-esmc && pip install -r requirements.txt && bash scripts/run_all.sh
```

把下面贴回来：

```bash
which python; python -V
python scripts/00_check_env.py
cat outputs/features/feature_meta.json 2>/dev/null
cat outputs/models/metrics.csv 2>/dev/null
cat outputs/predict/predictions.csv 2>/dev/null
```
