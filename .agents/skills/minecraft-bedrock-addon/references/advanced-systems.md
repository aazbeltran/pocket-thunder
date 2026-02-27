# Advanced Systems Reference

## Sound Definitions (RP)

Format version: `"1.14.0"`.

### Sound Definition File

`sounds/sound_definitions.json`:

```json
{
  "format_version": "1.14.0",
  "sound_definitions": {
    "<ns>.<sound_event>": {
      "category": "neutral",
      "sounds": [
        {
          "name": "sounds/<ns>/<sound_file>",
          "volume": 1.0,
          "pitch": 1.0
        }
      ]
    }
  }
}
```

Categories: `"neutral"`, `"player"`, `"hostile"`, `"block"`, `"music"`, `"ui"`, `"weather"`.

### Entity Sound Events

Reference sounds in entity behavior via `minecraft:ambient_sound_interval` or in the client entity `sound_effects` map.

For vanilla examples, clone bedrock-samples and check `resource_pack/sounds/sound_definitions.json`.

---

## Particle Effects (RP)

Format version: `"1.10.0"`. Defined in `resource_pack/particles/`.

```json
{
  "format_version": "1.10.0",
  "particle_effect": {
    "description": {
      "identifier": "<ns>:<particle_name>",
      "basic_render_parameters": {
        "material": "particles_alpha",
        "texture": "textures/particle/particles"
      }
    },
    "components": {
      "minecraft:emitter_rate_instant": { "num_particles": 10 },
      "minecraft:emitter_lifetime_once": { "active_time": 1.0 },
      "minecraft:particle_lifetime_expression": { "max_lifetime": 1.0 },
      "minecraft:particle_initial_speed": 2.0,
      "minecraft:particle_motion_dynamic": { "linear_acceleration": [0, -9.8, 0] },
      "minecraft:particle_appearance_billboard": {
        "size": [0.1, 0.1],
        "facing_camera_mode": "rotate_xyz"
      }
    }
  }
}
```

### Triggering Particles

- **From animation controllers**: Add `"particle_effects": [{ "effect": "<particle_name>" }]` to a state
- **From Script API**: Use entity component methods
- **From entity events**: Use `minecraft:particle_event_lifetime_expression`

For vanilla examples: `resource_pack/particles/` in bedrock-samples.
Full docs: `learn.microsoft.com/en-us/minecraft/creator/reference/content/particlesreference/`

---

## Trading Tables (BP)

No `format_version` field. Define villager-style trade inventories.

```json
{
  "tiers": [
    {
      "trades": [
        {
          "wants": [
            { "item": "minecraft:emerald", "quantity": 5 }
          ],
          "gives": [
            { "item": "<ns>:<item_name>", "quantity": 1 }
          ],
          "max_uses": 12,
          "trader_exp": 2
        }
      ]
    }
  ]
}
```

### Entity Setup for Trading

1. Reference in entity behavior: `"minecraft:trade_table": { "table": "trading/<entity_name>.json" }`
2. Add behavior goal: `"minecraft:behavior.trade_with_player": { "priority": 1 }`
3. Set `"runtime_identifier": "minecraft:villager_v2"` for the trading UI
