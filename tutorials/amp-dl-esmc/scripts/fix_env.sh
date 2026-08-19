#!/usr/bin/env bash
# 纠正「amp-esm + medgeclaw-rnaseq venv 混用」并打印正确 Python
set -euo pipefail

echo "== 当前 shell 状态 =="
echo "VIRTUAL_ENV=${VIRTUAL_ENV:-}"
echo "CONDA_DEFAULT_ENV=${CONDA_DEFAULT_ENV:-}"
echo "which python: $(command -v python || true)"
python -V 2>/dev/null || true
echo "sys.executable:" 
python -c 'import sys; print(sys.executable)' 2>/dev/null || true

echo ""
echo "== 建议：彻底退出再进 amp-esm =="
cat <<'EOF'
# 复制执行：
deactivate 2>/dev/null || true
conda deactivate 2>/dev/null || true
conda deactivate 2>/dev/null || true

conda activate amp-esm
hash -r
which python
python -V
python -c 'import sys; print(sys.executable)'

# 期望类似：
#   /home/w24e/miniconda3/envs/amp-esm/bin/python
#   Python 3.10.x 或 3.11.x
# 若仍是 3.14 或路径含 medgeclaw-rnaseq → amp-esm 环境异常，请新建：

conda create -n amp-esmc python=3.11 -y
conda activate amp-esmc
cd /home/w24e/projects/MedgeClaw-mqgg/tutorials/amp-dl-esmc
python -m pip install -U pip
python -m pip install -r requirements-minimal.txt
BACKEND=handcrafted bash scripts/run_all.sh

# 上 ESM-C（需要 torch，Python 3.11 友好）：
# pip install torch   # 按 pytorch.org 选 CUDA
# pip install esm tqdm biopython shap matplotlib seaborn
# bash scripts/run_all.sh
EOF

echo ""
echo "== 探测本机 amp-esm python =="
for p in \
  "$HOME/miniconda3/envs/amp-esm/bin/python" \
  "$HOME/anaconda3/envs/amp-esm/bin/python" \
  "$HOME/miniforge3/envs/amp-esm/bin/python" \
  "/home/w24e/miniconda3/envs/amp-esm/bin/python"
do
  if [[ -x "$p" ]]; then
    echo "FOUND $p  →  $($p -V 2>&1)"
    echo "  直接用它跑自检:"
    echo "  $p $(dirname "$0")/00_check_env.py"
  fi
done
