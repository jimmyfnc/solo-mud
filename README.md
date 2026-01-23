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
