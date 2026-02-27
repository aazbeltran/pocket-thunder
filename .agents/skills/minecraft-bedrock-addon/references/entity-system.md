# Entity Behavior System Reference

## Entity File Structure

```json
{
  "format_version": "1.21.0",
  "minecraft:entity": {
    "description": {
      "identifier": "<namespace>:<entity_name>",
      "runtime_identifier": "<vanilla_entity>",
      "is_spawnable": true,
      "is_summonable": true,
      "is_experimental": false,
      "properties": {}
    },
    "component_groups": {},
    "components": {},
    "events": {}
  }
}
```

## Component Groups and Events (State Machine)

Component groups define named sets of components toggled by events:

```
[spawn event] -> add group "ns:wild"
[tame event]  -> remove "ns:wild", add "ns:tamed" + "ns:combat_ready"
[sit event]   -> add "ns:sitting"
[stand event] -> remove "ns:sitting"
```

Events support: `add` groups, `remove` groups, `sequence` for ordered steps, `randomize` for weighted random outcomes, `trigger` other events.

Multiple groups can be added/removed in a single event.

## Component Catalog

### Identity and Physics

| Component | Purpose |
|-----------|---------|
| `minecraft:type_family` | Family tags for filters (`"family": ["mob", "pet"]`) |
| `minecraft:collision_box` | Hitbox `width` and `height` |
| `minecraft:scale` | Visual scale multiplier |
| `minecraft:physics` | Gravity (`has_gravity`) and collision (`has_collision`) |
| `minecraft:pushable` | Whether entity is pushable |
| `minecraft:health` | HP `value` and `max` |
| `minecraft:breathable` | Air/water breathing, suffocation |
| `minecraft:damage_sensor` | React to damage types with filters and events |
| `minecraft:nameable` | Allow name tags |
| `minecraft:leashable` | Allow leads |

### Movement and Navigation

| Navigation | Movement | Use Case | Runtime ID Needed |
|------------|----------|----------|-------------------|
| `navigation.walk` | `movement.basic` | Ground mobs (zombie, cow) | No |
| `navigation.hover` | `movement.hover` | Hovering flyers (bee) | `minecraft:bee` |
| `navigation.fly` | `movement.fly` | Free flyers (parrot) | No |
| `navigation.float` | `movement.basic` | Water surface (strider) | No |
| `navigation.swim` | `movement.sway` | Underwater (fish) | No |
| `navigation.climb` | `movement.basic` | Wall climbers (spider) | No |
| `navigation.generic` | `movement.amphibious` | Land + water (axolotl) | No |

Flight requires: `minecraft:can_fly` + `minecraft:flying_speed` + navigation + movement.

### Combat

| Component | Purpose |
|-----------|---------|
| `minecraft:attack` | Damage value, status effects (`effect_name`, `effect_duration`) |
| `minecraft:behavior.melee_box_attack` | Melee AI with priority, speed, reach |
| `minecraft:behavior.ranged_attack` | Ranged AI with intervals, burst shots |
| `minecraft:shooter` | Projectile definition for ranged attacks |
| `minecraft:behavior.hurt_by_target` | Retaliate when hit |
| `minecraft:behavior.nearest_attackable_target` | Find enemies by family/distance/visibility |
| `minecraft:behavior.owner_hurt_by_target` | Defend owner (attack what hurts owner) |
| `minecraft:behavior.owner_hurt_target` | Attack owner's target |
| `minecraft:follow_range` | Detection range for targeting |

### Taming and Pets

| Component | Purpose |
|-----------|---------|
| `minecraft:tameable` | Taming items, probability, tame_event |
| `minecraft:is_tamed` | Marker for tamed state |
| `minecraft:sittable` | Sit/stand toggle |
| `minecraft:behavior.follow_owner` | Follow player (start_distance, stop_distance, can_teleport) |
| `minecraft:behavior.teleport_to_owner` | Teleport when far from owner |
| `minecraft:behavior.stay_while_sitting` | Stay put when sitting |
| `minecraft:persistent` | Prevent despawning (add to tamed group) |
| `minecraft:behavior.defend_village_target` | Defend area |

### Equipment and Interaction

| Component | Purpose |
|-----------|---------|
| `minecraft:equipment` | Assign equipment from loot table path |
| `minecraft:equip_item` | Enable equipping (REQUIRED with equipment) |
| `minecraft:loot` | Death drop loot table path |
| `minecraft:interact` | Player interaction handling with filters and events |
| `minecraft:rideable` | Mountable entity with seat count |
| `minecraft:inventory` | Container inventory |

### Breeding and Lifecycle

| Component | Purpose |
|-----------|---------|
| `minecraft:breedable` | Breeding items, require_tame, require_full_health |
| `minecraft:ageable` | Baby/adult lifecycle with duration |
| `minecraft:is_baby` / `minecraft:is_adult` | Age markers |
| `minecraft:despawn` | Despawn distance rules |
| `minecraft:experience_reward` | XP on death (Molang expression) |

### Idle and Movement Behaviors

| Component | Purpose |
|-----------|---------|
| `minecraft:behavior.float` | Stay on water surface (priority 0) |
| `minecraft:behavior.look_at_player` | Face nearby players |
| `minecraft:behavior.random_look_around` | Look around randomly |
| `minecraft:behavior.random_hover` | Hover randomly (for flyers) |
| `minecraft:behavior.random_stroll` | Walk randomly (for ground mobs) |
| `minecraft:behavior.random_swim` | Swim randomly (for water mobs) |
| `minecraft:behavior.tempt` | Follow player holding specific items |
| `minecraft:behavior.panic` | Run when damaged |

## Behavior Priority System

Lower number = higher priority:

| Priority | Behavior Type |
|----------|---------------|
| 0 | `float` (survival override) |
| 1 | `owner_hurt_by_target` / `hurt_by_target` |
| 2 | `owner_hurt_target` |
| 3-4 | `melee_attack` / `tempt` / `stay_while_sitting` |
| 5 | `nearest_attackable_target` |
| 6 | `follow_owner` |
| 7-8 | `look_at_player` / `random_look_around` |
| 10-12 | `random_hover` / `random_stroll` / `wander` |

## Filters

Boolean conditions used in behaviors, events, damage sensors:

```json
{ "test": "is_family", "subject": "other", "operator": "==", "value": "monster" }
```

Common: `is_family`, `has_component`, `is_sneaking`, `has_equipment`, `is_owner`, `in_water`, `on_ground`, `has_target`, `is_daytime`.

Compound: `all_of` (AND), `any_of` (OR), `none_of` (NOT).

## Taming Pattern (Wolf-Style)

1. Place `minecraft:tameable` in the `wild` component group (preferred):
   ```json
   "minecraft:tameable": {
     "probability": 0.33,
     "tame_items": ["tropical_fish"],
     "tame_event": { "event": "ns:on_tame", "target": "self" }
   }
   ```
2. Define the tame event to swap groups:
   ```json
   "ns:on_tame": {
     "remove": { "component_groups": ["ns:wild"] },
     "add": { "component_groups": ["ns:tamed", "ns:combat_ready"] }
   }
   ```
3. Tamed group contains: `is_tamed`, `persistent`, `follow_owner`, `owner_hurt_by_target`, `owner_hurt_target`, `sittable`.

## Runtime Identifiers

Hard-coded engine behaviors accessed via `runtime_identifier` in entity description:

| Runtime ID | Provides |
|-----------|----------|
| `minecraft:bee` | Hover physics engine (required for `navigation.hover`) |
| `minecraft:horse` | Rideable with jump bar, tameable via riding |
| `minecraft:iron_golem` | Offer flower, village defense AI |
| `minecraft:parrot` | Shoulder riding mechanics |
| `minecraft:cat` | Sleep with owner, scare creepers |
| `minecraft:villager_v2` | Trading UI support |
| `minecraft:ender_dragon` | Boss bar, flight path system |

Full list: query DeepWiki with repo `Bedrock-OSS/bedrock-wiki` or visit `wiki.bedrock.dev/entities/runtime-identifier`.
