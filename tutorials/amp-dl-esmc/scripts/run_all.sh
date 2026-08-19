#!/usr/bin/env bash
# 一键跑通。自动容忍缺 torch / 缺 esm。
set -euo pipefail
cd "$(dirname "$0")/.."

PY="${PYTHON:-python}"
echo "Using: $($PY -c 'import sys; print(sys.executable, sys.version.split()[0])')"

echo "========== 00 check env =========="
$PY scripts/00_check_env.py || true

echo "========== 01 prepare data =========="
$PY scripts/01_prepare_data.py

echo "========== 02 extract features =========="
BACKEND="${BACKEND:-auto}"
$PY scripts/02_extract_features.py --backend "$BACKEND"

echo "========== 03 train =========="
$PY scripts/03_train.py

echo "========== 04 predict =========="
$PY scripts/04_predict.py

echo "========== 05 shap (optional) =========="
$PY scripts/05_shap_report.py || true

echo ""
echo "All done. See outputs/"
ls -la outputs/models outputs/predict 2>/dev/null || true
