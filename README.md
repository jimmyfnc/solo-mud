# Solo MUD

A procedurally generated single-player text adventure (MUD) with roguelike elements. Built with TypeScript, featuring deterministic world generation, dynamic descriptions, and real-time combat.

## Features

- **Procedural World Generation**: Seeded RNG creates deterministic, explorable worlds
- **Dynamic Descriptions**: Context-aware room descriptions based on biome, time, weather, and visit history
- **Day/Night Cycle**: Time progression affects gameplay, visibility, and NPC schedules
- **Weather System**: Markov chain weather simulation with natural transitions
- **Combat System**: Tick-based combat with auto-attacks, cooldowns, and enemy AI
- **Character Classes**: Warrior, Rogue, Mage, Cleric, and Ranger with unique stats
- **Loot Generation**: Procedural items with rarity tiers and affix system
- **NPC Schedules**: NPCs move between locations based on time of day
- **Living Ecosystem**: Creatures hunt, flee, and interact with each other independently of the player

## Project Structure

```
packages/
  shared/     # Shared types, utilities, and RNG
  server/     # Game logic, world generation, combat
  client/     # React + Tailwind UI (planned)
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Build all packages
pnpm build
```

### Development

```bash
# Run server tests in watch mode
pnpm --filter @solo-mud/server test

# Run client development server
pnpm --filter @solo-mud/client dev
```

## Commands

### Movement
| Command | Aliases | Description |
|---------|---------|-------------|
| `go <direction>` | | Move in a direction |
| `north`, `south`, `east`, `west` | `n`, `s`, `e`, `w` | Move directly |
| `up`, `down` | `u`, `d` | Move vertically |
| `go <exit> to <destination>` | | Disambiguate multiple exits |

### Exploration
| Command | Aliases | Description |
|---------|---------|-------------|
| `look` | `l` | Examine your surroundings |
| `examine <target>` | | Look at something closely |
| `map` | | Show a mini-map of nearby areas |

### Items & Inventory
| Command | Aliases | Description |
|---------|---------|-------------|
| `inventory` | `i` | Check your inventory |
| `take <item>` | `get` | Pick up an item |
| `take <item> from <corpse>` | | Loot from a corpse |
| `drop <item>` | | Drop an item |
| `use <item>` | | Use an item or interact |
| `loot [target] [#\|all]` | | Loot items from corpse/container |
| `open <container>` | | Open a chest or container |

### Equipment
| Command | Aliases | Description |
|---------|---------|-------------|
| `equipment` | `eq` | View equipped items |
| `equip <item>` | | Equip an item from inventory |
| `unequip <slot>` | | Remove equipped item |

### Combat
| Command | Aliases | Description |
|---------|---------|-------------|
| `attack <target>` | `kill`, `k` | Attack a creature |
| `flee` | | Escape from combat (50% chance) |

### Spells & Abilities
| Command | Aliases | Description |
|---------|---------|-------------|
| `spells` | `skills`, `abilities` | View known spells |
| `cast <spell>` | | Cast a spell |
| `learn <spell>` | | Learn a spell from a trainer |

### Quick Slots
| Command | Aliases | Description |
|---------|---------|-------------|
| `slots` | `quickslots` | View quick slot assignments |
| `assign <slot> <item/spell>` | | Assign to slot (q1-q4, a1-a4) |
| `unassign <slot>` | | Clear a quick slot |

### NPCs & Shops
| Command | Aliases | Description |
|---------|---------|-------------|
| `talk <npc>` | | Talk to someone |
| `say <number>` | | Respond in conversation |
| `list` | | View shop inventory |
| `buy <item>` | | Purchase from shop |
| `sell <item>` | | Sell to shop |

### Character
| Command | Aliases | Description |
|---------|---------|-------------|
| `status` | `stats` | View stats and active effects |
| `tutorial` | | Check tutorial progress |

### System
| Command | Aliases | Description |
|---------|---------|-------------|
| `help` | `?` | Show help message |
| `quit` | `logout`, `exit` | Save and return to character select |
| `debug` | | Show raw game data (dev mode) |

## Architecture

### Shared Package (`@solo-mud/shared`)

Core types and utilities used across packages:

- **Types**: Player, World, Combat, Messages
- **RNG**: Seeded random number generator (Mulberry32)
- **Constants**: Class definitions, XP curves

### Server Package (`@solo-mud/server`)

Game logic and systems:

- **World Generation**: Graph-based map with biomes and exits
- **Character System**: Player factory, stats calculation
- **Combat**: Tick system, auto-attacks, cooldowns, enemy AI
- **Descriptions**: Template-based dynamic text generation
- **Time/Weather**: Day/night cycle, weather simulation
- **NPCs**: Schedule-based location and dialogue
- **Loot**: Procedural item generation with affixes
- **Ecosystem**: Creature AI with hunting, fleeing, and territory defense

### Client Package (`@solo-mud/client`)

React-based terminal UI (in development):

- Vite + React + TypeScript
- Tailwind CSS for styling
- Socket.io for real-time communication

## Game Systems

### World Generation

Worlds are generated from a seed string, ensuring the same seed always produces the same world:

```typescript
import { generateWorld } from '@solo-mud/server/world';

const world = generateWorld({
  seed: 'my-adventure',
  nodeCount: 50,
  extraEdges: 10,
  lockedEdges: 5,
});
```

### Combat

The combat system uses a 100ms tick for real-time action:

- **Attack Rolls**: Hit chance, dodge, critical hits
- **Damage Calculation**: Attack power vs defense
- **Cooldowns**: Global cooldown (GCD) and ability-specific
- **Enemy AI**: State machine (idle/combat/evading/dead) with aggro system

### Time and Weather

Time advances in-game minutes, transitioning through periods:
- Dawn (5:00-8:00)
- Morning (8:00-12:00)
- Noon (12:00-14:00)
- Afternoon (14:00-18:00)
- Evening (18:00-21:00)
- Night (21:00-5:00)

Weather uses Markov chain transitions between: clear, cloudy, rain, storm, fog.

### Living Ecosystem

The world simulates a living ecosystem where creatures act independently of the player:

- **Creature Tiers**: Ambient (sheep, rabbit), Common (wolf, goblin), Dangerous (bear, spider), Apex (troll)
- **Predator/Prey**: Aggressive creatures hunt those 2+ levels below them
- **Flee & Chase**: Passive creatures flee from predators, who may give chase (max 3 rooms)
- **Territory**: Territorial creatures (bears, trolls) defend their spawn location + adjacent areas
- **Intimidation**: High-level players can walk past lower-tier creatures without being attacked
- **Distance-Based LOD**: Full combat simulation near player, instant resolution far away
- **Corpses & Respawn**: Dead creatures leave corpses (lootable), then respawn after tier-based timers

Players can witness, intervene in, or avoid creature-vs-creature encounters. Attack a predator mid-hunt and it turns on you. Let nature take its course and find the aftermath later.

## Testing

All game systems have comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test -- --coverage

# Run specific test file
pnpm --filter @solo-mud/server test -- --run src/combat/tick.test.ts
```

## License

MIT
