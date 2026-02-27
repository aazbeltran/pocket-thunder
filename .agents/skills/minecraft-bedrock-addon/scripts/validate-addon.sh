#!/bin/bash
# Validates all JSON files in a Minecraft Bedrock addon directory.
# Usage: bash validate-addon.sh <addon-directory>
# Example: bash validate-addon.sh blue-war-axolotl

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <addon-directory>" >&2
  exit 1
fi

ADDON_DIR="$1"
ERRORS=0
CHECKED=0

if [ ! -d "$ADDON_DIR" ]; then
  echo "Error: Directory '$ADDON_DIR' does not exist." >&2
  exit 1
fi

echo "Validating JSON files in: ${ADDON_DIR}"
echo "---"

while IFS= read -r -d '' file; do
  CHECKED=$((CHECKED + 1))
  if python3 -m json.tool "$file" > /dev/null 2>&1; then
    echo "  OK: ${file#${ADDON_DIR}/}"
  else
    echo "  FAIL: ${file#${ADDON_DIR}/}"
    python3 -m json.tool "$file" 2>&1 | head -3 | sed 's/^/        /'
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "$ADDON_DIR" -name '*.json' -print0 | sort -z)

echo "---"
echo "Checked: ${CHECKED} files"

if [ $ERRORS -gt 0 ]; then
  echo "FAILED: ${ERRORS} file(s) have invalid JSON."
  exit 1
else
  echo "All JSON files are valid."
fi

# Check for required files
echo ""
echo "Checking required files..."

BP_DIR=$(find "$ADDON_DIR" -maxdepth 1 -name '*_BP' -type d | head -1)
RP_DIR=$(find "$ADDON_DIR" -maxdepth 1 -name '*_RP' -type d | head -1)

MISSING=0
for required in "${BP_DIR}/manifest.json" "${RP_DIR}/manifest.json"; do
  if [ -f "$required" ]; then
    echo "  OK: ${required#${ADDON_DIR}/}"
  else
    echo "  MISSING: ${required#${ADDON_DIR}/}"
    MISSING=$((MISSING + 1))
  fi
done

for icon in "${BP_DIR}/pack_icon.png" "${RP_DIR}/pack_icon.png"; do
  if [ -f "$icon" ]; then
    echo "  OK: ${icon#${ADDON_DIR}/}"
  else
    echo "  WARNING: ${icon#${ADDON_DIR}/} (optional but recommended)"
  fi
done

if [ $MISSING -gt 0 ]; then
  echo "FAILED: ${MISSING} required file(s) missing."
  exit 1
fi

# UUID cross-validation: BP dependency UUID must match RP header UUID
if [ -n "$BP_DIR" ] && [ -n "$RP_DIR" ] && [ -f "${BP_DIR}/manifest.json" ] && [ -f "${RP_DIR}/manifest.json" ]; then
  echo ""
  echo "Checking UUID cross-references..."
  RP_HEADER_UUID=$(python3 -c "import json; print(json.load(open('${RP_DIR}/manifest.json'))['header']['uuid'])" 2>/dev/null || echo "")
  if [ -n "$RP_HEADER_UUID" ]; then
    BP_HAS_RP_DEP=$(python3 -c "
import json
bp = json.load(open('${BP_DIR}/manifest.json'))
deps = bp.get('dependencies', [])
found = any(d.get('uuid') == '${RP_HEADER_UUID}' for d in deps)
print('yes' if found else 'no')
" 2>/dev/null || echo "skip")
    if [ "$BP_HAS_RP_DEP" = "yes" ]; then
      echo "  OK: BP manifest depends on RP header UUID (${RP_HEADER_UUID})"
    elif [ "$BP_HAS_RP_DEP" = "no" ]; then
      echo "  WARNING: BP manifest does not reference RP header UUID (${RP_HEADER_UUID})"
      echo "           Add to BP dependencies: {\"uuid\": \"${RP_HEADER_UUID}\", \"version\": [1, 0, 0]}"
    fi
  fi

  # Check for duplicate UUIDs across both manifests
  DUPES=$(python3 -c "
import json, collections
uuids = []
for path in ['${BP_DIR}/manifest.json', '${RP_DIR}/manifest.json']:
    m = json.load(open(path))
    uuids.append(m['header']['uuid'])
    for mod in m.get('modules', []):
        uuids.append(mod['uuid'])
dupes = [u for u, c in collections.Counter(uuids).items() if c > 1]
print(','.join(dupes) if dupes else '')
" 2>/dev/null || echo "")
  if [ -n "$DUPES" ]; then
    echo "  FAIL: Duplicate UUIDs found: ${DUPES}"
    ERRORS=$((ERRORS + 1))
  else
    echo "  OK: All UUIDs are unique across both manifests"
  fi
fi

echo ""
echo "Validation complete."
