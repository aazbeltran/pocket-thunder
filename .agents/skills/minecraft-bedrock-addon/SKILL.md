---
name: minecraft-bedrock-addon
version: 2.1.0
description: >
  Create Minecraft Bedrock addons (.mcaddon) with custom entities, items, blocks, recipes,
  Script API, behavior packs, resource packs, and packaging. Use when the user wants to build
  a Bedrock addon, create a custom mob or pet, add new items or blocks to Minecraft, make a
  resource pack, write Bedrock Script API logic, or package a .mcaddon file.
  Do not use for Java Edition mods or Forge/Fabric/NeoForge projects.
---

# Minecraft Bedrock Addon Development

Build Minecraft Bedrock Edition addons following this workflow. Load reference files only when needed for a specific step.

## Reference Sources

### Mojang Bedrock Samples (clone for vanilla examples)

```bash
git clone --depth 1 https://github.com/Mojang/bedrock-samples.git /tmp/bedrock-samples
# After use: rm -rf /tmp/bedrock-samples
```

Key paths: `behavior_pack/entities/`, `resource_pack/entity/`, `resource_pack/models/entity/`, `resource_pack/animations/`, `resource_pack/attachables/`, `resource_pack/sounds/`.

### DeepWiki (AI-powered lookups without cloning)

Use MCP tools to query either repo:

- **Vanilla packs**: `mcp tool deepwiki ask_question` with repo `Mojang/bedrock-samples` for entity patterns, component usage, vanilla behaviors
- **Community wiki**: `mcp tool deepwiki ask_question` with repo `Bedrock-OSS/bedrock-wiki` for tutorials, guides, Molang reference, runtime identifiers, format versions

### Microsoft Learn (official API docs)

Construct URLs by pattern:
- Entity components: `learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_<name>`
- Behavior goals: `learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitygoals/minecraftbehavior_<name>`
- Script API: `learn.microsoft.com/en-us/minecraft/creator/scriptapi/`
- Items/blocks/recipes: `learn.microsoft.com/en-us/minecraft/creator/reference/content/<type>reference/`

---

## Addon Creation Workflow

Follow these steps in order. Each step references specific files for detailed content.

### Step 1: Scaffold the project

Create the directory structure. Run `scripts/setup-addon.sh` with the addon name and only the features needed:

```bash
bash .claude/skills/minecraft-bedrock-addon/scripts/setup-addon.sh <addon_name> <namespace> "<description>" [features]

# Features: entity, item, block, recipe, spawn, script, sound, particle, trading, all
# Default (no features arg): entity

# Examples:
# Entity-only pet:
bash .claude/skills/minecraft-bedrock-addon/scripts/setup-addon.sh fire_fox ff "A fire fox pet"
# Entity + items + recipes:
bash .claude/skills/minecraft-bedrock-addon/scripts/setup-addon.sh my_mod mm "Full mod" entity,item,recipe
# Items-only weapons pack:
bash .claude/skills/minecraft-bedrock-addon/scripts/setup-addon.sh weapons wp "Custom weapons" item,recipe
# Everything:
bash .claude/skills/minecraft-bedrock-addon/scripts/setup-addon.sh mega_mod mm "Mega mod" all
```

This creates only the directories needed for the specified features, plus manifests, placeholder icons, localization stubs, and a build script. If `script` is specified, it also generates the Script API manifest entries and `scripts/main.js` entry point.

If the script is unavailable, create the structure manually. See `references/directory-structure.md` for the full template.

### Step 2: Define entity behaviors (BP)

Create `<addon_name>_BP/entities/<entity_name>.json`.

**Read `references/entity-system.md`** for:
- Entity file structure and format version
- Component groups and events (state machine pattern)
- Component catalog by category (identity, movement, combat, taming, equipment, breeding)
- Behavior priority system
- Filters and compound filter patterns
- Taming pattern (wolf-style, step-by-step)
- Runtime identifiers and when to use them
- Navigation/movement type matrix

**Key pattern** -- every entity uses this state machine:
1. `minecraft:entity_spawned` event adds initial component group (e.g., `ns:wild`)
2. Interaction events swap groups (e.g., taming removes `ns:wild`, adds `ns:tamed`)
3. Component groups contain the behaviors active in that state

### Step 3: Define loot tables (BP)

Create loot tables in `<addon_name>_BP/loot_tables/entities/`.

See `references/data-definitions.md` for loot table structure, equipment tables, functions (`set_count`, `looting_enchant`), and conditions (`killed_by_player`).

Loot tables have NO `format_version` field.

### Step 4: Define resource pack visuals (RP)

Create the client entity definition, model, render controller, animations, and animation controller.

**Read `references/resource-pack.md`** for:
- Client entity definition (links model, texture, animations, render controller)
- Geometry model structure and bone hierarchy
- Held item bone pattern (`rightItem` locator)
- Render controller patterns (simple, variant arrays, conditional textures)
- Animation keyframes (rotation, position, scale channels)
- Animation controller state machines and Molang transitions
- Localization file format (`en_US.lang`)
- Material types (`entity`, `entity_alphatest`, `entity_emissive`)

**Key rule**: Bone names in animations MUST exactly match bone names in geometry (case-sensitive).

### Step 5: Create textures and models

- **Entity textures**: 64x64 PNG (or 128x128 for detailed entities)
- **Item textures**: 16x16 PNG
- **Block textures**: 16x16 PNG
- **Pack icon**: 64x64 or 128x128 PNG

Use Blockbench (blockbench.net) for model creation. Select "Bedrock Entity" project. For starting points, clone bedrock-samples and open vanilla `.geo.json` files.

The setup script (`scripts/setup-addon.sh`) generates placeholder pack icons automatically. For entity/item/block textures, create solid-color PNGs at the correct dimensions using Python or ImageMagick, or supply real artwork.

### Step 6: Add custom items (BP + RP) -- if needed

**Read `references/data-definitions.md`** for:
- Item behavior definition (BP)
- Item texture atlas mapping (`item_texture.json`)
- Attachable definitions (how items render when held/worn)

### Step 7: Add custom blocks (BP + RP) -- if needed

**Read `references/data-definitions.md`** for:
- Block behavior definition (BP)
- Block texture atlas mapping (`terrain_texture.json`)
- Block geometry

### Step 8: Add recipes -- if needed

**Read `references/data-definitions.md`** for shaped, shapeless, and furnace recipe templates.

### Step 9: Add spawn rules -- if needed

**Read `references/data-definitions.md`** for spawn rule structure, population controls, biome filters.

### Step 10: Add Script API logic -- if needed

**Read `references/script-api.md`** for:
- Manifest configuration for scripts
- Entry point setup (`scripts/main.js`)
- Key modules and patterns
- Event subscriptions, tick loops, custom commands, UI forms

Requires "Beta APIs" experiment enabled in world settings.

### Step 11: Add sounds, particles, or trading -- if needed

**Read `references/advanced-systems.md`** for:
- Sound definitions and entity sound events
- Particle effect definitions and triggers
- Trading table structure

### Step 12: Validate and build

Run validation and build:

```bash
# Validate all JSON
bash .claude/skills/minecraft-bedrock-addon/scripts/validate-addon.sh <addon-dir>

# Build .mcaddon
cd <addon-dir> && bash build.sh
```

### Step 13: Deploy and test

1. Transfer `.mcaddon` via AirDrop, iCloud Drive, Files app, or email
2. Tap file on iOS device -- Minecraft imports both packs
3. Create/edit world -> Settings -> Add-Ons -> Enable both BP and RP
4. Test with `/summon <namespace>:<entity_name>` or spawn egg

---

## Naming Conventions

- **Namespace**: 2-3 char prefix from addon/creator name (e.g., `pt` for PocketThunder)
- **Entity identifier**: `<ns>:<entity_name>` (e.g., `pt:blue_war_axolotl`)
- **Files/folders**: `snake_case`
- **Pack folders**: `<addon_name>_BP`, `<addon_name>_RP`
- **Geometry**: `geometry.<entity_name>`
- **Animations**: `animation.<entity_name>.<anim_name>`
- **Animation controllers**: `controller.animation.<entity_name>.<name>`
- **Render controllers**: `controller.render.<entity_name>`
- **Component groups**: `<ns>:<group>` (e.g., `pt:wild`, `pt:tamed`)
- **Events**: `<ns>:<event>` (e.g., `pt:on_tame`)

---

## Cross-File Reference Map

Identifiers that MUST match across files:

| Defined In | Identifier | Referenced By |
|-----------|------------|---------------|
| RP manifest `header.uuid` | UUID | BP manifest `dependencies[].uuid` |
| BP entity `description.identifier` | `ns:name` | RP client entity identifier, lang files |
| BP loot table file path | relative path | BP entity `minecraft:loot.table`, `minecraft:equipment.table` |
| BP event name | `ns:event` | Component `tame_event.event`, etc. |
| BP component group names | `ns:group` | Event `add`/`remove` arrays |
| Geometry identifier | `geometry.name` | RP client entity `geometry.default` |
| Animation identifiers | full ID | RP client entity `animations` map values |
| Animation controller ID | full ID | RP client entity `animations` map values |
| Render controller ID | full ID | RP client entity `render_controllers[]` |
| Client entity short aliases | string | Animation controller states, `scripts.animate[]` |
| Texture path (no .png) | path | RP client entity `textures.default` |
| Bone names in geometry | string | Animation `bones` keys |
| Item/block texture name | string | `item_texture.json` / `terrain_texture.json` keys |

---

## Format Versions

| File Type | Version | Type |
|-----------|---------|------|
| Manifest | `2` | Integer |
| Entity behavior | `"1.21.0"` | String |
| Client entity | `"1.10.0"` | String |
| Geometry | `"1.21.0"` | String |
| Render controller | `"1.8.0"` | String |
| Animation | `"1.8.0"` | String |
| Animation controller | `"1.10.0"` | String |
| Item / Block / Recipe | `"1.21.0"` | String |
| Spawn rules | `"1.8.0"` | String |
| Attachable | `"1.10.0"` | String |
| Particle | `"1.10.0"` | String |
| Sound definitions | `"1.14.0"` | String |
| Loot / Trading tables | None | -- |

Manifests use integer `2`. All other files use strings. Do not mix.

---

## Common Pitfalls

1. **UUID collisions** -- Every UUID across both manifests must be unique
2. **Trailing commas** -- JSON forbids them. Validate before packaging
3. **Bone name mismatch** -- Animation bone names must exactly match geometry (case-sensitive)
4. **Missing `equip_item`** -- `minecraft:equipment` requires `minecraft:equip_item: {}` in base components
5. **Entity despawns after taming** -- Add `minecraft:persistent: {}` to the tamed group
6. **Texture path with extension** -- Omit `.png` in client entity texture references
7. **Pack not importing** -- Check `min_engine_version` <= installed game. Verify ZIP has `_BP` and `_RP` at root
8. **Script API silent failure** -- Enable "Beta APIs" experiment in world settings
9. **Animations not playing** -- Animation controller must be in `scripts.animate[]`
10. **iOS strict JSON** -- No comments, no trailing commas, validate thoroughly

---

## Additional Topics

For systems not covered in the reference files, use DeepWiki or clone bedrock-samples:

| Topic | Bedrock Samples Path |
|-------|---------------------|
| World generation / biomes | `behavior_pack/biomes/` |
| Feature rules | `behavior_pack/feature_rules/` |
| Dialogue / NPC systems | `behavior_pack/dialogue/` |
| Fog definitions | `resource_pack/fogs/` |
| JSON UI | `resource_pack/ui/` |
| Camera presets | `behavior_pack/cameras/` |

Query DeepWiki with repo `Bedrock-OSS/bedrock-wiki` for tutorials on any of these topics.
