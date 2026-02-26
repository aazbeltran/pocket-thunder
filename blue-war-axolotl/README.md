# Blue War Axolotl

A Minecraft Bedrock Edition addon that adds a flying, sword-wielding axolotl companion.

## Features

- Hovers and flies like a bee
- Tame with tropical fish (33% chance per fish)
- Once tamed, follows you and defends against monsters
- Wields a diamond sword (8 damage + slowness)
- 30 HP (15 hearts) -- tougher than a wolf
- Sits on command like a wolf
- Wings with idle bob and rapid flap animations

## Build

```bash
bash build.sh
```

This creates `blue_war_axolotl.mcaddon` in the project directory.

## Install on iOS

1. Transfer `blue_war_axolotl.mcaddon` to your iOS device (AirDrop, Files, email, etc.)
2. Tap the file -- Minecraft will open and import both packs
3. Create or edit a world, enable both "Blue War Axolotl BP" and "Blue War Axolotl RP"
4. Enable "Holiday Creator Features" in experimental settings (if required by your MC version)

## Usage

```
/summon pt:blue_war_axolotl
```

- **Tame**: Hold tropical fish and interact with the axolotl
- **Sit/Stand**: Interact with your tamed axolotl (empty hand)
- **Combat**: Your axolotl will automatically attack nearby monsters and anything that hurts you

## Known Limitations (v1)

- Texture is the vanilla blue axolotl -- wings use existing UV space (untextured cubes)
- No custom sounds or particles
- Only obtainable via creative mode or `/summon` (no natural spawning)
- Sword visibility depends on `rightItem` bone attachment working with the runtime identifier
