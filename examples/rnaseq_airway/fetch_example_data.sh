#!/usr/bin/env bash
set -euo pipefail

# Download only the three files needed for the public airway demo.
# We use a sparse Git clone because it is more reliable than downloading
# raw.githubusercontent.com directly in some corporate/WSL networks.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TASK_DIR="$PROJECT_ROOT/data/rnaseq_airway_example"
INPUT_DIR="$TASK_DIR/input"
TMP_DIR="$(mktemp -d -t medgeclaw-airway-XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$INPUT_DIR"

echo "[1/3] Cloning the small data paths from bioconnector/workshops..."
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/bioconnector/workshops.git "$TMP_DIR/workshops"

git -C "$TMP_DIR/workshops" sparse-checkout set --skip-checks \
  data/airway_rawcounts.csv \
  data/airway_metadata.csv \
  data/annotables_grch38.csv

echo "[2/3] Copying input files to $INPUT_DIR"
cp "$TMP_DIR/workshops/data/airway_rawcounts.csv" "$INPUT_DIR/"
cp "$TMP_DIR/workshops/data/airway_metadata.csv" "$INPUT_DIR/"
cp "$TMP_DIR/workshops/data/annotables_grch38.csv" "$INPUT_DIR/"

cat > "$INPUT_DIR/README.md" <<'EOF'
# airway demo input

Source repository: https://github.com/bioconnector/workshops

- airway_rawcounts.csv: gene-level raw counts
- airway_metadata.csv: sample metadata
- annotables_grch38.csv: Ensembl-to-symbol annotation used for reporting

Biological experiment: Himes et al. 2014, GEO GSE52778.
EOF

echo "[3/3] Download complete"
ls -lh "$INPUT_DIR"
