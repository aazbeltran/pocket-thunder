#!/bin/bash
# Creates a Minecraft Bedrock addon scaffold with manifests, directories, and build script.
#
# Usage: bash setup-addon.sh <addon_name> <namespace> "<description>" [features]
#
# Features (comma-separated, optional):
#   entity    - Entity definitions with loot tables (default if no features specified)
#   item      - Custom items with textures and attachables
#   block     - Custom blocks with textures
#   recipe    - Crafting/smelting recipes
#   spawn     - Spawn rules
#   script    - Script API with @minecraft/server dependency
#   sound     - Sound definitions
#   particle  - Particle effects
#   trading   - Trading tables
#   all       - Everything
#
# Examples:
#   bash setup-addon.sh my_pet_dragon mp "A tameable dragon"
#   bash setup-addon.sh my_pet_dragon mp "A tameable dragon" entity
#   bash setup-addon.sh my_pet_dragon mp "A tameable dragon" entity,item,recipe
#   bash setup-addon.sh my_weapons mw "Custom weapons pack" item,recipe
#   bash setup-addon.sh full_mod fm "Full mod" all

set -euo pipefail

if [ $# -lt 3 ]; then
  echo "Usage: $0 <addon_name> <namespace> \"<description>\" [features]" >&2
  echo "" >&2
  echo "  addon_name:  snake_case name (e.g., my_pet_dragon)" >&2
  echo "  namespace:   2-3 char prefix (e.g., mp)" >&2
  echo "  description: pack description in quotes" >&2
  echo "  features:    comma-separated list (default: entity)" >&2
  echo "               entity,item,block,recipe,spawn,script,sound,particle,trading,all" >&2
  exit 1
fi

ADDON_NAME="$1"
NAMESPACE="$2"
DESCRIPTION="$3"
FEATURES="${4:-entity}"

# Parse features into flags
HAS_ENTITY=false; HAS_ITEM=false; HAS_BLOCK=false; HAS_RECIPE=false
HAS_SPAWN=false; HAS_SCRIPT=false; HAS_SOUND=false; HAS_PARTICLE=false; HAS_TRADING=false

IFS=',' read -ra FEAT_ARRAY <<< "$FEATURES"
for feat in "${FEAT_ARRAY[@]}"; do
  case "$(echo "$feat" | tr '[:upper:]' '[:lower:]' | xargs)" in
    entity)   HAS_ENTITY=true ;;
    item)     HAS_ITEM=true ;;
    block)    HAS_BLOCK=true ;;
    recipe)   HAS_RECIPE=true ;;
    spawn)    HAS_SPAWN=true ;;
    script)   HAS_SCRIPT=true ;;
    sound)    HAS_SOUND=true ;;
    particle) HAS_PARTICLE=true ;;
    trading)  HAS_TRADING=true ;;
    all)      HAS_ENTITY=true; HAS_ITEM=true; HAS_BLOCK=true; HAS_RECIPE=true
              HAS_SPAWN=true; HAS_SCRIPT=true; HAS_SOUND=true; HAS_PARTICLE=true
              HAS_TRADING=true ;;
    *)        echo "Unknown feature: $feat" >&2; exit 1 ;;
  esac
done

# Generate UUIDs
UUID_BP_HEADER=$(uuidgen | tr '[:upper:]' '[:lower:]')
UUID_BP_MODULE=$(uuidgen | tr '[:upper:]' '[:lower:]')
UUID_RP_HEADER=$(uuidgen | tr '[:upper:]' '[:lower:]')
UUID_RP_MODULE=$(uuidgen | tr '[:upper:]' '[:lower:]')

BP="${ADDON_NAME}_BP"
RP="${ADDON_NAME}_RP"

echo "Creating addon: ${ADDON_NAME}"
echo "  Namespace: ${NAMESPACE}"
echo "  Features:  ${FEATURES}"
echo "  BP UUID:   ${UUID_BP_HEADER}"
echo "  RP UUID:   ${UUID_RP_HEADER}"

# Always create base directories
mkdir -p "${BP}" "${RP}/texts"

# Feature-specific BP directories
$HAS_ENTITY   && mkdir -p "${BP}/entities" "${BP}/loot_tables/entities"
$HAS_ITEM     && mkdir -p "${BP}/items"
$HAS_BLOCK    && mkdir -p "${BP}/blocks"
$HAS_RECIPE   && mkdir -p "${BP}/recipes"
$HAS_SPAWN    && mkdir -p "${BP}/spawn_rules"
$HAS_SCRIPT   && mkdir -p "${BP}/scripts"
$HAS_TRADING  && mkdir -p "${BP}/trading"

# Feature-specific RP directories
$HAS_ENTITY   && mkdir -p "${RP}/entity" "${RP}/models/entity" "${RP}/textures/entity" \
                           "${RP}/animations" "${RP}/animation_controllers" "${RP}/render_controllers"
$HAS_ITEM     && mkdir -p "${RP}/textures/items" "${RP}/attachables"
$HAS_BLOCK    && mkdir -p "${RP}/textures/blocks" "${RP}/models/blocks"
$HAS_SOUND    && mkdir -p "${RP}/sounds"
$HAS_PARTICLE && mkdir -p "${RP}/particles"

# BP manifest
SCRIPT_MODULE=""
SCRIPT_DEP=""
if $HAS_SCRIPT; then
  UUID_SCRIPT=$(uuidgen | tr '[:upper:]' '[:lower:]')
  SCRIPT_MODULE=',
    {
      "type": "script",
      "uuid": "'"${UUID_SCRIPT}"'",
      "version": [1, 0, 0],
      "entry": "scripts/main.js",
      "language": "javascript"
    }'
  SCRIPT_DEP=',
    {
      "module_name": "@minecraft/server",
      "version": "1.17.0-beta"
    }' # Update version to match target Minecraft version; check learn.microsoft.com/en-us/minecraft/creator/scriptapi/
fi

cat > "${BP}/manifest.json" << EOF
{
  "format_version": 2,
  "header": {
    "name": "${ADDON_NAME} BP",
    "description": "${DESCRIPTION}",
    "uuid": "${UUID_BP_HEADER}",
    "version": [1, 0, 0],
    "min_engine_version": [1, 21, 0]
  },
  "modules": [
    {
      "type": "data",
      "uuid": "${UUID_BP_MODULE}",
      "version": [1, 0, 0]
    }${SCRIPT_MODULE}
  ],
  "dependencies": [
    {
      "uuid": "${UUID_RP_HEADER}",
      "version": [1, 0, 0]
    }${SCRIPT_DEP}
  ]
}
EOF

# RP manifest
cat > "${RP}/manifest.json" << EOF
{
  "format_version": 2,
  "header": {
    "name": "${ADDON_NAME} RP",
    "description": "${DESCRIPTION}",
    "uuid": "${UUID_RP_HEADER}",
    "version": [1, 0, 0],
    "min_engine_version": [1, 21, 0]
  },
  "modules": [
    {
      "type": "resources",
      "uuid": "${UUID_RP_MODULE}",
      "version": [1, 0, 0]
    }
  ]
}
EOF

# Localization
cat > "${RP}/texts/en_US.lang" << EOF
## Localization for ${ADDON_NAME}
EOF

cat > "${RP}/texts/languages.json" << 'EOF'
["en_US"]
EOF

# Script API entry point
if $HAS_SCRIPT; then
  cat > "${BP}/scripts/main.js" << 'EOF'
import { world, system } from "@minecraft/server";

// Add your script logic here
EOF
fi

# Item texture atlas stub
if $HAS_ITEM; then
  cat > "${RP}/textures/item_texture.json" << EOF
{
  "resource_pack_name": "${ADDON_NAME} RP",
  "texture_name": "atlas.items",
  "texture_data": {}
}
EOF
fi

# Block texture atlas stub
if $HAS_BLOCK; then
  cat > "${RP}/textures/terrain_texture.json" << EOF
{
  "resource_pack_name": "${ADDON_NAME} RP",
  "texture_name": "atlas.terrain",
  "texture_data": {}
}
EOF
fi

# Sound definitions stub
if $HAS_SOUND; then
  cat > "${RP}/sounds/sound_definitions.json" << 'EOF'
{
  "format_version": "1.14.0",
  "sound_definitions": {}
}
EOF
fi

# Placeholder pack icons (try magick first for ImageMagick 7+, then convert for 6.x)
if command -v magick &> /dev/null; then
  magick -size 128x128 xc:'#1B3B8C' "${BP}/pack_icon.png" 2>/dev/null || true
  magick -size 128x128 xc:'#1B3B8C' "${RP}/pack_icon.png" 2>/dev/null || true
elif command -v convert &> /dev/null; then
  convert -size 128x128 xc:'#1B3B8C' "${BP}/pack_icon.png" 2>/dev/null || true
  convert -size 128x128 xc:'#1B3B8C' "${RP}/pack_icon.png" 2>/dev/null || true
elif command -v python3 &> /dev/null; then
  python3 -c "
import struct, zlib
def png(path, w, h, r, g, b):
    raw = b''
    for _ in range(h):
        raw += b'\x00' + bytes([r, g, b]) * w
    def chunk(ct, data):
        c = ct + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)))
        f.write(chunk(b'IDAT', zlib.compress(raw)))
        f.write(chunk(b'IEND', b''))
png('${BP}/pack_icon.png', 128, 128, 27, 59, 140)
png('${RP}/pack_icon.png', 128, 128, 27, 59, 140)
" 2>/dev/null || echo "Warning: Could not generate pack icons."
else
  echo "Warning: No image tool found. Create pack_icon.png manually (128x128 PNG)."
fi

# Build script
cat > "build.sh" << BUILDEOF
#!/bin/bash
set -euo pipefail
SCRIPT_DIR="\$(cd "\$(dirname "\$0")" && pwd)"
OUTPUT="\${SCRIPT_DIR}/${ADDON_NAME}.mcaddon"

rm -f "\$OUTPUT"
TEMP_DIR=\$(mktemp -d)
trap 'rm -rf "\$TEMP_DIR"' EXIT

cp -r "\${SCRIPT_DIR}/${BP}" "\$TEMP_DIR/"
cp -r "\${SCRIPT_DIR}/${RP}" "\$TEMP_DIR/"
find "\$TEMP_DIR" -name '.DS_Store' -delete

cd "\$TEMP_DIR"
zip -r "\$OUTPUT" ${BP} ${RP} -x '*.DS_Store'
echo "Built: \$OUTPUT"
BUILDEOF
chmod +x "build.sh"

# Summary
echo ""
echo "Scaffold created:"
find "${BP}" "${RP}" -type f | sort | sed 's/^/  /'
echo "  build.sh"
echo ""

# Context-aware next steps
echo "Next steps:"
STEP=1
if $HAS_ENTITY; then
  echo "  ${STEP}. Create entity behavior: ${BP}/entities/<entity>.json"
  STEP=$((STEP + 1))
  echo "  ${STEP}. Create client entity:   ${RP}/entity/<entity>.entity.json"
  STEP=$((STEP + 1))
  echo "  ${STEP}. Create model:           ${RP}/models/entity/<entity>.geo.json"
  STEP=$((STEP + 1))
  echo "  ${STEP}. Create texture:         ${RP}/textures/entity/<entity>.png"
  STEP=$((STEP + 1))
fi
if $HAS_ITEM; then
  echo "  ${STEP}. Define items in:        ${BP}/items/<item>.json"
  STEP=$((STEP + 1))
fi
if $HAS_BLOCK; then
  echo "  ${STEP}. Define blocks in:       ${BP}/blocks/<block>.json"
  STEP=$((STEP + 1))
fi
if $HAS_RECIPE; then
  echo "  ${STEP}. Define recipes in:      ${BP}/recipes/<recipe>.json"
  STEP=$((STEP + 1))
fi
echo "  ${STEP}. Build: bash build.sh"
