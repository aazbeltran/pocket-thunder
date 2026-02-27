# Data Definitions Reference

## Loot Tables (BP)

No `format_version` field. Used for death drops, equipment, chest loot.

```json
{
  "pools": [
    {
      "rolls": 1,
      "entries": [
        {
          "type": "item",
          "name": "minecraft:diamond",
          "weight": 1,
          "functions": [
            { "function": "set_count", "count": { "min": 0, "max": 2 } },
            { "function": "looting_enchant", "count": { "min": 0, "max": 1 } }
          ]
        },
        { "type": "item", "name": "minecraft:emerald", "weight": 3 },
        { "type": "empty", "weight": 6 }
      ],
      "conditions": [
        { "condition": "killed_by_player" }
      ]
    }
  ]
}
```

**Functions**: `set_count`, `looting_enchant`, `set_damage`, `enchant_randomly`, `set_data`.
**Conditions**: `killed_by_player`, `random_chance`, `has_mark_variant`.

### Equipment Loot Table

Guarantees a specific item for entity equipment:

```json
{
  "pools": [
    {
      "rolls": 1,
      "entries": [
        { "type": "item", "name": "minecraft:diamond_sword", "weight": 1 }
      ]
    }
  ]
}
```

Referenced via `"minecraft:equipment": { "table": "loot_tables/entities/<name>_equipment.json" }`.
Requires `"minecraft:equip_item": {}` in base entity components.

---

## Custom Items (BP + RP)

### Item Behavior (BP)

Format version: `"1.21.0"`.

```json
{
  "format_version": "1.21.0",
  "minecraft:item": {
    "description": {
      "identifier": "<ns>:<item_name>",
      "menu_category": {
        "category": "equipment",
        "group": "itemGroup.name.sword"
      }
    },
    "components": {
      "minecraft:max_stack_size": 1,
      "minecraft:hand_equipped": true,
      "minecraft:damage": { "value": 7 },
      "minecraft:durability": { "max_durability": 500 },
      "minecraft:icon": { "texture": "<item_texture_name>" },
      "minecraft:display_name": { "value": "item.<ns>:<item_name>.name" }
    }
  }
}
```

### Item Texture Atlas (RP)

`textures/item_texture.json`:

```json
{
  "resource_pack_name": "<Pack Name>",
  "texture_name": "atlas.items",
  "texture_data": {
    "<item_texture_name>": {
      "textures": "textures/items/<item_name>"
    }
  }
}
```

### Attachables (RP)

Define how items render when held/worn. Format version: `"1.10.0"`.

```json
{
  "format_version": "1.10.0",
  "minecraft:attachable": {
    "description": {
      "identifier": "<ns>:<item_name>",
      "materials": { "default": "entity", "enchanted": "entity_alphatest_glint" },
      "textures": { "default": "textures/items/<item_name>" },
      "geometry": { "default": "geometry.<item_name>" },
      "animations": {
        "hold_first_person": "animation.item.hold_first_person",
        "hold_third_person": "animation.item.hold_third_person"
      },
      "scripts": {
        "animate": [
          { "hold_first_person": "context.is_first_person" },
          { "hold_third_person": "!context.is_first_person" }
        ]
      },
      "render_controllers": ["controller.render.item_default"]
    }
  }
}
```

---

## Custom Blocks (BP + RP)

### Block Behavior (BP)

Format version: `"1.21.0"`.

```json
{
  "format_version": "1.21.0",
  "minecraft:block": {
    "description": {
      "identifier": "<ns>:<block_name>",
      "menu_category": { "category": "construction" }
    },
    "components": {
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 3.0 },
      "minecraft:destructible_by_explosion": { "explosion_resistance": 6.0 },
      "minecraft:map_color": "#HEXCOLOR",
      "minecraft:geometry": "geometry.<block_name>",
      "minecraft:material_instances": {
        "*": { "texture": "<block_texture_name>", "render_method": "opaque" }
      }
    }
  }
}
```

### Block Texture Atlas (RP)

`textures/terrain_texture.json`:

```json
{
  "resource_pack_name": "<Pack Name>",
  "texture_name": "atlas.terrain",
  "texture_data": {
    "<block_texture_name>": {
      "textures": "textures/blocks/<block_name>"
    }
  }
}
```

---

## Recipes (BP)

### Shaped Crafting

```json
{
  "format_version": "1.21.0",
  "minecraft:recipe_shaped": {
    "description": { "identifier": "<ns>:<recipe_name>" },
    "tags": ["crafting_table"],
    "pattern": ["ABA", " C ", " C "],
    "key": {
      "A": { "item": "minecraft:diamond" },
      "B": { "item": "minecraft:emerald" },
      "C": { "item": "minecraft:stick" }
    },
    "unlock": [{ "item": "minecraft:diamond" }],
    "result": { "item": "<ns>:<item_name>", "count": 1 }
  }
}
```

### Shapeless Crafting

```json
{
  "format_version": "1.21.0",
  "minecraft:recipe_shapeless": {
    "description": { "identifier": "<ns>:<recipe_name>" },
    "tags": ["crafting_table"],
    "ingredients": [
      { "item": "minecraft:gold_ingot" },
      { "item": "minecraft:apple" }
    ],
    "unlock": [{ "item": "minecraft:gold_ingot" }],
    "result": { "item": "<ns>:<item_name>", "count": 1 }
  }
}
```

### Furnace / Smelting

```json
{
  "format_version": "1.21.0",
  "minecraft:recipe_furnace": {
    "description": { "identifier": "<ns>:<recipe_name>" },
    "tags": ["furnace", "blast_furnace"],
    "input": "<ns>:<raw_item>",
    "output": "<ns>:<smelted_item>"
  }
}
```

---

## Spawn Rules (BP)

Format version: `"1.8.0"`.

```json
{
  "format_version": "1.8.0",
  "minecraft:spawn_rules": {
    "description": {
      "identifier": "<ns>:<entity_name>",
      "population_control": "animal"
    },
    "conditions": [
      {
        "minecraft:spawns_on_surface": {},
        "minecraft:spawns_on_block_filter": ["minecraft:grass_block"],
        "minecraft:brightness_filter": { "min": 7, "max": 15, "adjust_for_weather": true },
        "minecraft:density_limit": { "surface": 4 },
        "minecraft:biome_filter": { "test": "has_biome_tag", "value": "animal" },
        "minecraft:weight": { "default": 8 }
      }
    ]
  }
}
```

Population controls: `"animal"`, `"monster"`, `"water_animal"`, `"ambient"`.
