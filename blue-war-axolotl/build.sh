#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_NAME="blue_war_axolotl.mcaddon"
OUTPUT_PATH="${SCRIPT_DIR}/${OUTPUT_NAME}"

echo "Building Blue War Axolotl addon..."

# Clean previous build
rm -f "$OUTPUT_PATH"

# Create a temporary directory for the zip
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Copy packs to temp dir
cp -r "${SCRIPT_DIR}/blue_war_axolotl_BP" "$TEMP_DIR/"
cp -r "${SCRIPT_DIR}/blue_war_axolotl_RP" "$TEMP_DIR/"

# Remove .DS_Store files
find "$TEMP_DIR" -name '.DS_Store' -delete

# Create .mcaddon (ZIP containing both packs)
cd "$TEMP_DIR"
zip -r "$OUTPUT_PATH" blue_war_axolotl_BP blue_war_axolotl_RP -x '*.DS_Store'

echo ""
echo "Build complete: ${OUTPUT_PATH}"
echo "File size: $(du -h "$OUTPUT_PATH" | cut -f1)"
echo ""
echo "To install on iOS:"
echo "  1. AirDrop or transfer ${OUTPUT_NAME} to your device"
echo "  2. Tap the file to open it in Minecraft"
echo "  3. Both packs will be imported automatically"
