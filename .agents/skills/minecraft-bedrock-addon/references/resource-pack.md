# Resource Pack System Reference

## Client Entity Definition

Links all visual assets for an entity. Format version: `"1.10.0"`.

```json
{
  "format_version": "1.10.0",
  "minecraft:client_entity": {
    "description": {
      "identifier": "<namespace>:<entity_name>",
      "materials": { "default": "entity_alphatest" },
      "textures": { "default": "textures/entity/<entity_name>" },
      "geometry": { "default": "geometry.<entity_name>" },
      "animations": {
        "idle": "animation.<entity_name>.idle",
        "walk": "animation.<entity_name>.walk",
        "attack": "animation.<entity_name>.attack",
        "controller.main": "controller.animation.<entity_name>.main"
      },
      "scripts": {
        "animate": ["controller.main"]
      },
      "render_controllers": ["controller.render.<entity_name>"],
      "spawn_egg": {
        "base_color": "#HEXCOLOR",
        "overlay_color": "#HEXCOLOR"
      }
    }
  }
}
```

**Materials**: `entity` (opaque), `entity_alphatest` (transparency/alpha), `entity_emissive` (glowing).

**Alias pattern**: Full identifiers are mapped to short names (e.g., `"idle"` -> `"animation.my_mob.idle"`). Animation controllers and `scripts.animate` use only the short names.

## Geometry Models

Format version: `"1.21.0"`. Define bones (skeleton) with cubes (visual shapes).

```json
{
  "format_version": "1.21.0",
  "minecraft:geometry": [{
    "description": {
      "identifier": "geometry.<entity_name>",
      "texture_width": 64,
      "texture_height": 64,
      "visible_bounds_width": 2.0,
      "visible_bounds_height": 1.5,
      "visible_bounds_offset": [0, 0.75, 0]
    },
    "bones": [
      { "name": "root", "pivot": [0, 0, 0] },
      {
        "name": "body", "parent": "root", "pivot": [0, 8, 0],
        "cubes": [{ "origin": [-4, 4, -3], "size": [8, 8, 6], "uv": [0, 0] }]
      },
      {
        "name": "head", "parent": "body", "pivot": [0, 12, -3],
        "cubes": [{ "origin": [-3, 12, -6], "size": [6, 6, 6], "uv": [0, 16] }]
      }
    ]
  }]
}
```

### Held Item Bone Pattern

Add a `rightItem` child bone under the arm bone with a locator. The engine auto-renders equipped items at this locator:

```json
{
  "name": "right_arm", "parent": "body", "pivot": [-4, 8, 0],
  "cubes": [{ "origin": [-6, 4, -1], "size": [2, 4, 2], "uv": [16, 20] }]
},
{
  "name": "rightItem", "parent": "right_arm", "pivot": [-5, 4, 0],
  "locators": { "rightItem": [-5, 4, 0] }
}
```

### Tips

- Use Blockbench (blockbench.net) for model creation. Select "Bedrock Entity" project. Export as "Bedrock Geometry".
- Clone bedrock-samples and open vanilla `.geo.json` files as starting points.
- **Zero-depth cubes** (`"size": [W, H, 0]`): Creates flat planes for wings, fins, tails.
- `"mirror": true` flips UV for symmetric bones without needing separate UV coordinates.

## Render Controllers

Format version: `"1.8.0"`. Map geometry, textures, materials using aliases from client entity.

### Simple (single texture)

```json
{
  "format_version": "1.8.0",
  "render_controllers": {
    "controller.render.<entity_name>": {
      "geometry": "geometry.default",
      "materials": [{ "*": "material.default" }],
      "textures": ["texture.default"]
    }
  }
}
```

### Variant selection (multiple textures via query.variant)

```json
"arrays": {
  "textures": {
    "Array.skins": ["Texture.variant1", "Texture.variant2", "Texture.variant3"]
  }
},
"textures": ["Array.skins[query.variant]"]
```

### Conditional (ternary expression)

```json
"textures": ["query.is_tamed ? Texture.tame : Texture.wild"]
```

### Per-bone materials

```json
"materials": [
  { "*": "material.default" },
  { "*wing*": "material.transparent" }
]
```

## Animations

Format version: `"1.8.0"`. Keyframe-based bone animations.

```json
{
  "format_version": "1.8.0",
  "animations": {
    "animation.<entity_name>.idle": {
      "loop": true,
      "animation_length": 2.0,
      "bones": {
        "body": {
          "position": {
            "0.0": [0, 0, 0],
            "1.0": [0, 0.5, 0],
            "2.0": [0, 0, 0]
          }
        },
        "left_wing": {
          "rotation": {
            "0.0": [0, 0, -5],
            "0.5": [0, 0, 5],
            "1.0": [0, 0, -5]
          }
        }
      }
    }
  }
}
```

**Channels**: `rotation` (degrees XYZ), `position` (pixels XYZ), `scale` (multiplier XYZ).
**Lerp modes**: Linear (default), `"catmullrom"` (smooth curves) via `"lerp_mode"` in keyframe objects.
**Non-looping**: Set `"loop": false` for one-shot animations (attacks, transitions).

## Animation Controllers

Format version: `"1.10.0"`. State machines that select which animation plays.

```json
{
  "format_version": "1.10.0",
  "animation_controllers": {
    "controller.animation.<entity_name>.main": {
      "initial_state": "idle",
      "states": {
        "idle": {
          "animations": ["idle"],
          "transitions": [
            { "moving": "query.modified_move_speed > 0.1" },
            { "attacking": "query.is_delayed_attacking" }
          ]
        },
        "moving": {
          "animations": ["walk"],
          "transitions": [
            { "idle": "query.modified_move_speed <= 0.1" },
            { "attacking": "query.is_delayed_attacking" }
          ]
        },
        "attacking": {
          "animations": ["attack"],
          "transitions": [
            { "idle": "query.any_animation_finished" }
          ]
        }
      }
    }
  }
}
```

### Common Molang Queries

| Query | Purpose |
|-------|---------|
| `query.modified_move_speed` | Movement speed (>0.1 = moving) |
| `query.is_delayed_attacking` | Entity is attacking |
| `query.any_animation_finished` | Non-looping animation completed |
| `query.is_in_water` / `query.is_on_ground` | Environment state |
| `query.is_playing_dead` / `query.is_sleeping` | Behavior state |
| `query.variant` | Variant index (for texture arrays) |
| `query.is_tamed` / `query.is_angry` | Entity state |
| `query.property('<ns>:<prop>')` | Custom entity properties |

States can also trigger `particle_effects` and `sound_effects`.

## Localization

`texts/en_US.lang` (required -- one entry per line, no JSON):

```
entity.<ns>:<entity>.name=Display Name
item.spawn_egg.entity.<ns>:<entity>.name=Spawn Display Name
item.<ns>:<item>.name=Item Name
tile.<ns>:<block>.name=Block Name
```

`texts/languages.json`:

```json
["en_US", "es_ES", "es_MX"]
```
