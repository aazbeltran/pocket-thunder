# Addon Directory Structure

## Full Template

```
<addon-name>/
  build.sh                          # Packages as .mcaddon
  <addon_name>_BP/                  # Behavior Pack
    manifest.json                   # Pack identity and dependencies
    pack_icon.png                   # 64x64 or 128x128 PNG
    entities/                       # Entity server behaviors
      <entity_name>.json
    items/                          # Custom item definitions
      <item_name>.json
    blocks/                         # Custom block definitions
      <block_name>.json
    loot_tables/
      entities/
        <entity_name>.json          # Death drops
        <entity_name>_equipment.json # Equipment tables
      blocks/
        <block_name>.json
      chests/
        <chest_name>.json
    recipes/
      <recipe_name>.json
    spawn_rules/
      <entity_name>.json
    scripts/                        # Script API (JavaScript)
      main.js
    trading/
      <entity_name>.json
  <addon_name>_RP/                  # Resource Pack
    manifest.json
    pack_icon.png
    entity/                         # Client entity definitions
      <entity_name>.entity.json
    models/
      entity/
        <entity_name>.geo.json      # Geometry models
      blocks/
        <block_name>.geo.json
    textures/
      entity/
        <entity_name>.png           # Entity textures (typically 64x64)
      blocks/
        <block_name>.png            # Block textures (16x16)
      items/
        <item_name>.png             # Item textures (16x16)
      item_texture.json             # Item texture atlas mapping
      terrain_texture.json          # Block texture atlas mapping
    animations/
      <entity_name>.animation.json
    animation_controllers/
      <entity_name>.animation_controllers.json
    render_controllers/
      <entity_name>.render_controllers.json
    attachables/
      <item_name>.json              # How items render when held/worn
    sounds/
      sound_definitions.json
      <custom_sounds>/
    particles/
      <particle_name>.json
    texts/
      languages.json
      en_US.lang                    # Required: English localization
      es_ES.lang                    # Optional: other locales
```

## Naming Rules

- Pack folders: `<addon_name>_BP` and `<addon_name>_RP`
- All files and folders: `snake_case`
- Entity namespace: `<2-3_char_prefix>:<entity_name>`
- Only create directories needed for the addon (e.g., skip `scripts/` if not using Script API)
