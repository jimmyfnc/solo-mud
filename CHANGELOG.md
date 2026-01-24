# Changelog

All notable changes to Solo MUD will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Exit disambiguation for duplicate labels (`go passage to Hollow`)
- `debug` command for development/testing - shows raw game data
- `use` command for items and props (keys, consumables, interactables)
- Key feedback messages when unlocking doors
- Character creation flow with guided UI
- Exits now display destinations (`passage -> Hollow`)

### Changed
- Name validation now allows spaces (for first/last names like "John Smith")
- Movement parser supports custom exit labels (not just compass directions)
- Help command updated with new commands and syntax

### Fixed
- Fixed navigation through duplicate-labeled exits (both passages now accessible)
- Fixed custom exit labels not working (only compass directions worked before)

---

## [0.1.0] - 2026-01-23

### Added

#### Core Systems
- Procedural world generation with seeded PRNG (mulberry32)
- Graph-based world with BFS pathfinding and lock/key validation
- 6 biomes with weighted tag-based blending (forest, swamp, mountains, desert, tundra, plains)
- Dynamic descriptions based on time, weather, and visit state
- Accelerated game time (configurable ratio)
- Weather simulation system

#### Character System
- 5 base classes: Warrior, Rogue, Mage, Cleric, Ranger
- Stats: STR, DEX, CON, INT, WIS
- Level 1-30 progression (MVP tier)
- Equipment system with 11 slots
- Inventory with weight and slot limits

#### Client
- React web client with terminal aesthetic
- Real-time Socket.io connection
- Character creation UI with class selection
- Command input with history
- Status bar showing player stats
- Auto-scrolling terminal output

#### Server
- Fastify HTTP server with Socket.io
- Session management with auto-cleanup
- Command parsing with aliases and shortcuts
- World generation with validation pipeline

#### Commands
- `look` (l) - Examine surroundings
- `examine <target>` - Look at something closely
- `go <direction>` - Move in a direction
- `north/south/east/west` (n/s/e/w) - Direct movement
- `take <item>` - Pick up items
- `drop <item>` - Drop items
- `inventory` (i) - Check inventory
- `equipment` (eq) - View equipped items
- `equip <item>` - Equip from inventory
- `unequip <slot>` - Remove equipped item
- `help` (?) - Show help

### Technical
- pnpm monorepo with 3 packages (@solo-mud/shared, @solo-mud/server, @solo-mud/client)
- TypeScript throughout
- Vite for client bundling
- Zustand for state management
- Tailwind CSS for styling

---

## Versioning Guide

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes, major rewrites
- **MINOR** (0.X.0): New features, backwards compatible
- **PATCH** (0.0.X): Bug fixes, small improvements

### Pre-1.0 Development

During the 0.x phase:
- 0.1.x - Core foundation (world gen, basic commands)
- 0.2.x - Combat system
- 0.3.x - NPC and dialogue systems
- 0.4.x - Quests and progression
- 0.5.x - Dungeons and procedural content
- 0.6.x - Classes and abilities
- 0.7.x - Items and loot
- 0.8.x - Polish and balance
- 0.9.x - Beta testing
- 1.0.0 - First stable release

[Unreleased]: https://github.com/jimmyfnc/solo-mud/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jimmyfnc/solo-mud/releases/tag/v0.1.0
