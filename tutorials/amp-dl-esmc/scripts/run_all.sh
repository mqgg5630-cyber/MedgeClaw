#!/usr/bin/env bash
# 一键跑通 demo（在 amp-esm 或任意装好依赖的环境）
set -euo pipefail
cd "$(dirname "$0")/.."

echo "========== 00 check env =========="
python scripts/00_check_env.py

echo "========== 01 prepare data =========="
python scripts/01_prepare_data.py

echo "========== 02 extract features =========="
# 强制手搓特征可： BACKEND=handcrafted bash scripts/run_all.sh
BACKEND="${BACKEND:-auto}"
python scripts/02_extract_features.py --backend "$BACKEND"

echo "========== 03 train =========="
python scripts/03_train.py

echo "========== 04 predict =========="
python scripts/04_predict.py

echo "========== 05 shap (optional) =========="
python scripts/05_shap_report.py || true

echo ""
echo "All done. See outputs/"
ls -la outputs/models outputs/predict 2>/dev/null || true
