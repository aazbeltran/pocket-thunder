# Blue War Axolotl - Minecraft Bedrock Addon

## Project Overview

A Minecraft Bedrock Edition addon (.mcaddon) that adds a **Blue War Axolotl** -- a custom entity that flies, wields a diamond sword, and defends its owner.

## Structure

- `blue_war_axolotl_BP/` - Behavior Pack (server-side logic)
- `blue_war_axolotl_RP/` - Resource Pack (client-side visuals)
- `build.sh` - Packages both packs into a `.mcaddon` ZIP

## Entity: `pt:blue_war_axolotl`

- **Runtime identifier**: `minecraft:bee` (provides hover physics)
- **Taming**: Feed tropical fish (33% chance per fish)
- **Combat**: 8 damage + slowness effect, targets monsters
- **Flight**: Bee-style hover using `navigation.hover` + `movement.hover`
- **Health**: 30 HP (15 hearts)

## Key Patterns

- Wolf-style taming: `tameable` component in `pt:wild` group fires `pt:on_tame` event
- Component group state machine: `pt:wild` -> `pt:tamed` + `pt:combat_ready`
- Equipment via loot table: diamond sword assigned through `minecraft:equipment`

## Format Versions

- Entity behavior: `1.21.0`
- Geometry: `1.21.0`
- Client entity: `1.10.0`
- Render controllers: `1.8.0`
- Animations: `1.8.0`
- Animation controllers: `1.10.0`

## Build

```bash
bash build.sh
```

## CI and Release

- Workflow: `.github/workflows/blue-war-axolotl.yml`
- Every relevant push/PR builds the addon and uploads `blue_war_axolotl.mcaddon` as a workflow artifact.
- The workflow force-creates the first GitHub release only once (tag: `bwa-v0.1.0`) if no `bwa-v*` tags exist yet.
- Release publishing uses `softprops/action-gh-release` with `generate_release_notes: true`.

## Contribution Notes

- Use Conventional Commits for commit messages (example: `feat(blue-war-axolotl): add tame particle effect`).
- Do not commit generated build outputs; `blue-war-axolotl/*.mcaddon` is ignored by git.
- Before pushing, run:

```bash
find blue-war-axolotl -name '*.json' -print0 | while IFS= read -r -d '' f; do python3 -m json.tool "$f" >/dev/null; done
bash blue-war-axolotl/build.sh
```

## Reference Files

Source patterns based on official Bedrock samples:
- Wolf taming: `wolf.json` (component_groups, events)
- Bee flight: `bee.json` (navigation.hover, movement.hover, can_fly)
- Axolotl model: `axolotl.geo.json` (base geometry)
