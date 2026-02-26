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

## Reference Files

Source patterns based on official Bedrock samples:
- Wolf taming: `wolf.json` (component_groups, events)
- Bee flight: `bee.json` (navigation.hover, movement.hover, can_fly)
- Axolotl model: `axolotl.geo.json` (base geometry)
