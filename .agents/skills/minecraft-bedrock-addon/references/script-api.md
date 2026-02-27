# Script API Reference

## Overview

The Script API enables TypeScript/JavaScript logic in behavior packs. Requires manifest changes and "Beta APIs" experiment in world settings.

## Manifest Configuration

Add a script module and `@minecraft/server` dependency to the BP manifest:

```json
{
  "format_version": 2,
  "header": {
    "name": "<Pack Name> BP",
    "description": "<description>",
    "uuid": "<UUID-1>",
    "version": [1, 0, 0],
    "min_engine_version": [1, 21, 0]
  },
  "modules": [
    {
      "type": "data",
      "uuid": "<UUID-2>",
      "version": [1, 0, 0]
    },
    {
      "type": "script",
      "uuid": "<UUID-3>",
      "version": [1, 0, 0],
      "entry": "scripts/main.js",
      "language": "javascript"
    }
  ],
  "dependencies": [
    { "uuid": "<RP-HEADER-UUID>", "version": [1, 0, 0] },
    { "module_name": "@minecraft/server", "version": "1.17.0" }
  ]
}
```

Generate an additional UUID for the script module.

## Key Modules

| Module | Purpose |
|--------|---------|
| `@minecraft/server` | World, entities, blocks, events, commands, dimensions |
| `@minecraft/server-ui` | Action forms, message forms, modal forms |
| `@minecraft/server-gametest` | GameTest framework for automated testing |
| `@minecraft/server-admin` | Server admin features |

## Entry Point

`scripts/main.js`:

```javascript
import { world, system } from "@minecraft/server";

// React to entity hit events
world.afterEvents.entityHitEntity.subscribe((event) => {
  const { damagingEntity, hitEntity } = event;
  // Custom combat logic
});

// Tick-based recurring logic (20 ticks = 1 second)
system.runInterval(() => {
  // Check conditions, update state, etc.
}, 20);

// Custom chat commands
world.beforeEvents.chatSend.subscribe((event) => {
  if (event.message.startsWith("!")) {
    event.cancel = true;
    const cmd = event.message.substring(1);
    // Handle command
  }
});
```

## Common Patterns

### Player interaction

```javascript
const players = world.getAllPlayers();
const player = players[0];
player.sendMessage("Hello from scripts!");
```

### Entity spawning

```javascript
const dimension = world.getDimension("overworld");
const entity = dimension.spawnEntity("ns:custom_entity", { x: 0, y: 64, z: 0 });
```

### Running commands

```javascript
dimension.runCommand("say Hello World");
player.runCommand("give @s diamond 1");
```

### Custom UI forms

```javascript
import { ActionFormData } from "@minecraft/server-ui";

const form = new ActionFormData()
  .title("My Menu")
  .body("Choose an option")
  .button("Option 1")
  .button("Option 2");

form.show(player).then(response => {
  if (response.canceled) return;
  if (response.selection === 0) {
    player.sendMessage("Selected option 1");
  }
});
```

### Scheduled delays

```javascript
// Run once after 60 ticks (3 seconds)
system.runTimeout(() => {
  // Delayed action
}, 60);
```

## Full API Reference

`https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/`

For specific module versions, query DeepWiki with repo `Bedrock-OSS/bedrock-wiki` or search Microsoft Learn.
