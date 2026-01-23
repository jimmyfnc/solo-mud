# Solo MUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a procedurally generated text adventure MUD with validated world generation, real-time combat, and a React web client.

**Architecture:** pnpm monorepo with three packages: `@solo-mud/shared` (types, RNG), `@solo-mud/server` (Fastify + Socket.io game server), `@solo-mud/client` (React + Vite terminal UI). Game logic runs server-side; clients send commands and render responses.

**Tech Stack:** Node 20+, TypeScript, Fastify, Socket.io, React 18, Vite, Tailwind, Zustand, Vitest

---

## Phase 1: Monorepo Setup

### Task 1.1: Initialize pnpm workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.nvmrc`

**Step 1: Create root package.json**

```json
{
  "name": "solo-mud",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm --parallel run dev",
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'packages/*'
```

**Step 3: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
coverage/
.turbo/
```

**Step 4: Create .nvmrc**

```
20
```

**Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml .gitignore .nvmrc
git commit -m "chore: initialize pnpm monorepo workspace"
```

---

### Task 1.2: Create shared TypeScript config

**Files:**
- Create: `tsconfig.base.json`

**Step 1: Create base TypeScript config**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Step 2: Commit**

```bash
git add tsconfig.base.json
git commit -m "chore: add shared TypeScript base config"
```

---

### Task 1.3: Initialize shared package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

**Step 1: Create package.json**

```json
{
  "name": "@solo-mud/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/types/index.js"
    },
    "./constants": {
      "types": "./dist/constants/index.d.ts",
      "import": "./dist/constants/index.js"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.2.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create placeholder index.ts**

```typescript
// @solo-mud/shared - Shared types, constants, and utilities
export const VERSION = '0.1.0';
```

**Step 4: Install dependencies and build**

Run: `pnpm install && pnpm --filter @solo-mud/shared build`
Expected: Successful build, `packages/shared/dist/` created

**Step 5: Commit**

```bash
git add packages/shared/
git commit -m "chore: initialize @solo-mud/shared package"
```

---

### Task 1.4: Initialize server package

**Files:**
- Create: `packages/server/package.json`
- Create: `packages/server/tsconfig.json`
- Create: `packages/server/src/index.ts`

**Step 1: Create package.json**

```json
{
  "name": "@solo-mud/server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@solo-mud/shared": "workspace:*",
    "fastify": "^4.25.2",
    "socket.io": "^4.7.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "vitest": "^1.2.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create placeholder index.ts**

```typescript
// @solo-mud/server - Game server entry point
console.log('Solo MUD Server starting...');
```

**Step 4: Install dependencies**

Run: `pnpm install`
Expected: All dependencies installed

**Step 5: Commit**

```bash
git add packages/server/
git commit -m "chore: initialize @solo-mud/server package"
```

---

### Task 1.5: Initialize client package

**Files:**
- Create: `packages/client/package.json`
- Create: `packages/client/tsconfig.json`
- Create: `packages/client/tsconfig.node.json`
- Create: `packages/client/vite.config.ts`
- Create: `packages/client/index.html`
- Create: `packages/client/src/main.tsx`
- Create: `packages/client/src/App.tsx`
- Create: `packages/client/src/vite-env.d.ts`
- Create: `packages/client/tailwind.config.js`
- Create: `packages/client/postcss.config.js`
- Create: `packages/client/src/index.css`

**Step 1: Create package.json**

```json
{
  "name": "@solo-mud/client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@solo-mud/shared": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.4",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "vite": "^5.0.12",
    "vitest": "^1.2.0"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "noEmit": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 3: Create tsconfig.node.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "noEmit": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
```

**Step 5: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Solo MUD</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 6: Create src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

**Step 7: Create src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 8: Create src/App.tsx**

```tsx
function App() {
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <h1 className="text-2xl mb-4">Solo MUD</h1>
      <p>Connecting to server...</p>
    </div>
  );
}

export default App;
```

**Step 9: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
```

**Step 10: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Step 11: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-black;
}
```

**Step 12: Install dependencies and verify**

Run: `pnpm install && pnpm --filter @solo-mud/client dev`
Expected: Vite dev server starts on port 3000, shows "Solo MUD" page

**Step 13: Commit**

```bash
git add packages/client/
git commit -m "chore: initialize @solo-mud/client package with Vite + React + Tailwind"
```

---

## Phase 2: Shared Types and Utilities

### Task 2.1: Create seeded RNG utility (TDD)

**Files:**
- Create: `packages/shared/src/utils/rng.ts`
- Create: `packages/shared/src/utils/rng.test.ts`
- Create: `packages/shared/src/utils/index.ts`

**Step 1: Write the failing test**

Create `packages/shared/src/utils/rng.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createRng } from './rng';

describe('createRng', () => {
  it('should produce deterministic sequence for same seed', () => {
    const rng1 = createRng('test-seed');
    const rng2 = createRng('test-seed');

    const seq1 = [rng1.next(), rng1.next(), rng1.next()];
    const seq2 = [rng2.next(), rng2.next(), rng2.next()];

    expect(seq1).toEqual(seq2);
  });

  it('should produce different sequence for different seeds', () => {
    const rng1 = createRng('seed-a');
    const rng2 = createRng('seed-b');

    const val1 = rng1.next();
    const val2 = rng2.next();

    expect(val1).not.toEqual(val2);
  });

  it('should produce values between 0 and 1', () => {
    const rng = createRng('bounds-test');

    for (let i = 0; i < 100; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('should handle numeric seeds', () => {
    const rng1 = createRng(12345);
    const rng2 = createRng(12345);

    expect(rng1.next()).toEqual(rng2.next());
  });

  it('nextInt should return integers in range [min, max]', () => {
    const rng = createRng('int-test');

    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(5, 10);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it('pick should select a random element from array', () => {
    const rng = createRng('pick-test');
    const items = ['a', 'b', 'c', 'd'];

    const picked = rng.pick(items);
    expect(items).toContain(picked);
  });

  it('shuffle should return shuffled array without modifying original', () => {
    const rng = createRng('shuffle-test');
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];

    const shuffled = rng.shuffle(copy);

    expect(copy).toEqual(original); // Original unchanged
    expect(shuffled).toHaveLength(original.length);
    expect(shuffled.sort()).toEqual(original.sort()); // Same elements
  });

  it('shuffle should be deterministic for same seed', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const rng1 = createRng('shuffle-deterministic');
    const rng2 = createRng('shuffle-deterministic');

    const shuffled1 = rng1.shuffle([...items]);
    const shuffled2 = rng2.shuffle([...items]);

    expect(shuffled1).toEqual(shuffled2);
  });

  it('weightedPick should respect weights', () => {
    const rng = createRng('weighted-test');
    const items = [
      { value: 'common', weight: 100 },
      { value: 'rare', weight: 1 },
    ];

    // With such skewed weights, most picks should be 'common'
    let commonCount = 0;
    for (let i = 0; i < 100; i++) {
      const picked = rng.weightedPick(items);
      if (picked.value === 'common') commonCount++;
    }

    expect(commonCount).toBeGreaterThan(90);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @solo-mud/shared test`
Expected: FAIL - Cannot find module './rng'

**Step 3: Write minimal implementation**

Create `packages/shared/src/utils/rng.ts`:

```typescript
/**
 * Seeded pseudo-random number generator using mulberry32 algorithm.
 * Produces deterministic sequences for reproducible world generation.
 */

export interface Rng {
  /** Returns a float in [0, 1) */
  next(): number;

  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number;

  /** Returns a random element from the array */
  pick<T>(array: readonly T[]): T;

  /** Returns a shuffled copy of the array (Fisher-Yates) */
  shuffle<T>(array: readonly T[]): T[];

  /** Returns a weighted random pick */
  weightedPick<T extends { weight: number }>(items: readonly T[]): T;

  /** Returns true with the given probability (0-1) */
  chance(probability: number): boolean;
}

/**
 * Hash a string to a 32-bit integer using djb2 algorithm
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit
}

/**
 * Create a seeded RNG instance.
 * Same seed always produces same sequence.
 */
export function createRng(seed: string | number): Rng {
  // Convert seed to number if string
  let state = typeof seed === 'string' ? hashString(seed) : seed >>> 0;

  // Ensure non-zero state
  if (state === 0) state = 1;

  // Mulberry32 algorithm - fast and good distribution
  function next(): number {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  function pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return array[nextInt(0, array.length - 1)];
  }

  function shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    // Fisher-Yates shuffle
    for (let i = result.length - 1; i > 0; i--) {
      const j = nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function weightedPick<T extends { weight: number }>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = next() * totalWeight;

    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) {
        return item;
      }
    }

    // Fallback (shouldn't happen with valid weights)
    return items[items.length - 1];
  }

  function chance(probability: number): boolean {
    return next() < probability;
  }

  return { next, nextInt, pick, shuffle, weightedPick, chance };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @solo-mud/shared test`
Expected: All tests PASS

**Step 5: Create utils index**

Create `packages/shared/src/utils/index.ts`:

```typescript
export { createRng, type Rng } from './rng';
```

**Step 6: Commit**

```bash
git add packages/shared/src/utils/
git commit -m "feat(shared): add seeded RNG utility with deterministic random functions"
```

---

### Task 2.2: Create world types

**Files:**
- Create: `packages/shared/src/types/world.ts`
- Create: `packages/shared/src/types/index.ts`

**Step 1: Create world types**

Create `packages/shared/src/types/world.ts`:

```typescript
/**
 * Core world data structures for procedural generation.
 */

export type NodeId = string;
export type EdgeId = string;
export type ItemId = string;
export type EnemyId = string;

/** Exit types determine traversal requirements */
export type EdgeType = 'open' | 'locked' | 'hidden' | 'hazard';

/** Requirements to pass through an exit */
export interface Requirement {
  kind: 'item' | 'level' | 'quest';
  value: string | number;
}

/** An exit connecting two locations */
export interface Exit {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
  label: string; // "north", "iron door", "dark passage"
  type: EdgeType;
  requirement?: Requirement;
}

/** Biome weights for tag-based blending */
export type BiomeWeights = {
  plains?: number;
  forest?: number;
  hills?: number;
  swamp?: number;
  mountains?: number;
  desert?: number;
};

/** Visit tracking for dynamic descriptions */
export interface VisitState {
  visitCount: number;
  firstVisitTime?: number;
  lastVisitTime?: number;
}

/** A location in the world graph */
export interface Location {
  id: NodeId;
  name: string;
  biome: BiomeWeights;
  props: string[]; // "altar", "campfire", "broken statue"
  items: ItemId[];
  enemies: EnemyId[];
  visitState: VisitState;
  depth: number; // Distance from start (for difficulty scaling)
}

/** Item rarity tiers */
export type Rarity = 'junk' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** An affix that modifies an item */
export interface Affix {
  id: string;
  name: string;
  type: 'prefix' | 'suffix';
  statMods: Record<string, number>;
}

/** A game item */
export interface Item {
  id: ItemId;
  baseId: string; // Template ID
  name: string;
  tags: string[]; // "weapon", "key", "consumable"
  rarity: Rarity;
  affixes: Affix[];
}

/** Time of day for descriptions and NPC schedules */
export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

/** Weather state */
export interface WeatherState {
  type: 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';
  intensity: number; // 0-1
  movingDirection?: string; // "north", "east", etc.
}

/** Game time tracking */
export interface GameTime {
  /** Total game minutes elapsed */
  totalMinutes: number;
  /** Current time of day */
  timeOfDay: TimeOfDay;
  /** Current day number */
  day: number;
}

/** The complete world state */
export interface World {
  seed: string;
  startId: NodeId;
  goalId: NodeId;
  locations: Record<NodeId, Location>;
  exits: Record<EdgeId, Exit>;
  /** Maps location ID to array of exit IDs originating from it */
  adjacency: Record<NodeId, EdgeId[]>;
  items: Record<ItemId, Item>;
  time: GameTime;
  weather: WeatherState;
}

/** Generation parameters */
export interface WorldGenParams {
  seed: string;
  nodeCount: number;
  extraEdges: number;
  lockedEdges: number;
}
```

**Step 2: Create types index**

Create `packages/shared/src/types/index.ts`:

```typescript
export * from './world';
```

**Step 3: Update main index**

Update `packages/shared/src/index.ts`:

```typescript
// @solo-mud/shared - Shared types, constants, and utilities
export const VERSION = '0.1.0';

export * from './types';
export * from './utils';
```

**Step 4: Build and verify**

Run: `pnpm --filter @solo-mud/shared build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add packages/shared/src/
git commit -m "feat(shared): add world type definitions"
```

---

### Task 2.3: Create character types

**Files:**
- Create: `packages/shared/src/types/character.ts`
- Modify: `packages/shared/src/types/index.ts`

**Step 1: Create character types**

Create `packages/shared/src/types/character.ts`:

```typescript
/**
 * Character and combat types.
 */

import type { ItemId, NodeId } from './world';

/** Base stat names */
export type StatName = 'str' | 'dex' | 'con' | 'int' | 'wis';

/** Character base stats */
export interface Stats {
  str: number; // Melee damage, carry capacity
  dex: number; // Hit chance, dodge, crit, attack speed
  con: number; // HP pool, physical resistance
  int: number; // Spell damage, mana pool
  wis: number; // Spell resistance, mana regen
}

/** Base class identifiers */
export type ClassName = 'warrior' | 'rogue' | 'mage' | 'cleric' | 'ranger';

/** Class definition */
export interface ClassDef {
  id: ClassName;
  name: string;
  description: string;
  primaryStats: [StatName, StatName];
  baseStats: Stats;
  hpPerLevel: number;
  mpPerLevel: number;
}

/** Subclass tier (unlocks at 10, 30, 50, 70, 90) */
export type SubclassTier = 1 | 2 | 3 | 4 | 5;

/** A talent in the subclass tree */
export interface Talent {
  id: string;
  name: string;
  description: string;
  maxRank: number;
  requires?: string; // ID of prerequisite talent
  effects: Record<string, number>; // e.g., { "damage_bonus": 5 }
}

/** Subclass definition */
export interface SubclassDef {
  id: string;
  name: string;
  parentClass: ClassName;
  tier: SubclassTier;
  parentSubclass?: string; // For tier 2+, which tier 1 it branches from
  talents: Talent[];
}

/** Player's subclass progress */
export interface SubclassProgress {
  subclassId: string;
  talentRanks: Record<string, number>; // talent ID -> current rank
  totalPointsSpent: number;
}

/** Equipment slots */
export type EquipSlot =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'chest'
  | 'hands'
  | 'legs'
  | 'feet'
  | 'ring1'
  | 'ring2'
  | 'necklace'
  | 'cloak';

/** Player's equipment */
export type Equipment = Partial<Record<EquipSlot, ItemId>>;

/** Inventory item stack */
export interface InventorySlot {
  itemId: ItemId;
  quantity: number;
}

/** Quick slot assignment */
export interface QuickSlot {
  type: 'item' | 'ability';
  id: string;
}

/** Player character state */
export interface Player {
  id: string;
  name: string;
  class: ClassName;
  level: number;
  xp: number;
  xpToNextLevel: number;

  // Stats
  baseStats: Stats;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;

  // Subclass
  subclass?: SubclassProgress;
  talentPointsAvailable: number;

  // Inventory
  equipment: Equipment;
  inventory: InventorySlot[];
  inventorySlots: number;
  carryWeight: number;
  maxCarryWeight: number;

  // Quick slots
  itemSlots: (QuickSlot | null)[]; // q1-q4
  abilitySlots: (QuickSlot | null)[]; // a1-a4

  // Position
  locationId: NodeId;
  boundTownId: NodeId; // For recall scrolls

  // Combat state
  inCombat: boolean;
  autoAttack: boolean;
  targetId?: string;
  globalCooldown: number; // ms remaining
  abilityCooldowns: Record<string, number>; // ability ID -> ms remaining

  // Currency
  gold: number;

  // Death state
  corpseLocationId?: NodeId;
  corpseItems?: InventorySlot[];
}

/** Calculated combat stats (from base + gear + buffs) */
export interface CombatStats {
  attackPower: number;
  spellPower: number;
  defense: number;
  magicResist: number;
  hitChance: number;
  dodgeChance: number;
  critChance: number;
  critDamage: number;
  attackSpeed: number; // ticks between attacks
}
```

**Step 2: Update types index**

Update `packages/shared/src/types/index.ts`:

```typescript
export * from './world';
export * from './character';
```

**Step 3: Build and verify**

Run: `pnpm --filter @solo-mud/shared build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/shared/src/types/
git commit -m "feat(shared): add character and combat type definitions"
```

---

### Task 2.4: Create message types for client-server communication

**Files:**
- Create: `packages/shared/src/types/messages.ts`
- Modify: `packages/shared/src/types/index.ts`

**Step 1: Create message types**

Create `packages/shared/src/types/messages.ts`:

```typescript
/**
 * Socket.io message types for client-server communication.
 */

import type { Player, CombatStats } from './character';
import type { Location, Exit, Item, GameTime, WeatherState } from './world';

// ============ Client -> Server Messages ============

/** Client command input */
export interface CommandMessage {
  type: 'command';
  input: string; // Raw command string, e.g., "go north" or "attack goblin"
}

/** Client requests full state sync */
export interface SyncRequestMessage {
  type: 'sync_request';
}

/** Client -> Server message union */
export type ClientMessage = CommandMessage | SyncRequestMessage;

// ============ Server -> Client Messages ============

/** Server sends text output to display */
export interface OutputMessage {
  type: 'output';
  lines: OutputLine[];
}

/** A single line of output with optional styling */
export interface OutputLine {
  text: string;
  style?: 'normal' | 'error' | 'success' | 'combat' | 'system' | 'whisper';
  timestamp?: number;
}

/** Server sends room/location update */
export interface RoomMessage {
  type: 'room';
  location: Location;
  exits: Exit[];
  items: Item[];
  enemies: EnemySnapshot[];
  npcs: NpcSnapshot[];
}

/** Snapshot of an enemy in the room */
export interface EnemySnapshot {
  id: string;
  name: string;
  level: number;
  hpPercent: number;
  inCombat: boolean;
  targetId?: string;
}

/** Snapshot of an NPC in the room */
export interface NpcSnapshot {
  id: string;
  name: string;
  role: string; // "shopkeeper", "trainer", etc.
  dialogue?: string; // Current greeting/status
}

/** Server sends player state update */
export interface PlayerUpdateMessage {
  type: 'player_update';
  player: Partial<Player>;
  combatStats?: CombatStats;
}

/** Server sends combat tick update */
export interface CombatMessage {
  type: 'combat';
  events: CombatEvent[];
}

/** A single combat event */
export interface CombatEvent {
  eventType: 'attack' | 'ability' | 'damage' | 'heal' | 'death' | 'miss' | 'dodge' | 'crit';
  sourceId: string;
  sourceName: string;
  targetId?: string;
  targetName?: string;
  value?: number;
  abilityName?: string;
}

/** Server sends time/weather update */
export interface TimeMessage {
  type: 'time';
  time: GameTime;
  weather: WeatherState;
}

/** Server sends error message */
export interface ErrorMessage {
  type: 'error';
  message: string;
  code?: string;
}

/** Full state sync response */
export interface SyncMessage {
  type: 'sync';
  player: Player;
  combatStats: CombatStats;
  room: RoomMessage;
  time: GameTime;
  weather: WeatherState;
}

/** Server -> Client message union */
export type ServerMessage =
  | OutputMessage
  | RoomMessage
  | PlayerUpdateMessage
  | CombatMessage
  | TimeMessage
  | ErrorMessage
  | SyncMessage;

// ============ Event Names ============

export const CLIENT_EVENTS = {
  COMMAND: 'command',
  SYNC_REQUEST: 'sync_request',
} as const;

export const SERVER_EVENTS = {
  OUTPUT: 'output',
  ROOM: 'room',
  PLAYER_UPDATE: 'player_update',
  COMBAT: 'combat',
  TIME: 'time',
  ERROR: 'error',
  SYNC: 'sync',
} as const;
```

**Step 2: Update types index**

Update `packages/shared/src/types/index.ts`:

```typescript
export * from './world';
export * from './character';
export * from './messages';
```

**Step 3: Build and verify**

Run: `pnpm --filter @solo-mud/shared build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add packages/shared/src/types/
git commit -m "feat(shared): add client-server message types for Socket.io"
```

---

### Task 2.5: Create biome and class constants

**Files:**
- Create: `packages/shared/src/constants/biomes.ts`
- Create: `packages/shared/src/constants/classes.ts`
- Create: `packages/shared/src/constants/index.ts`

**Step 1: Create biome constants**

Create `packages/shared/src/constants/biomes.ts`:

```typescript
/**
 * Biome definitions and content tables.
 */

export type BiomeId = 'plains' | 'forest' | 'hills' | 'swamp' | 'mountains' | 'desert';

export interface BiomeDef {
  id: BiomeId;
  name: string;
  description: string;
  levelRange: [number, number];
  props: string[];
  ambience: string[];
}

export const BIOMES: Record<BiomeId, BiomeDef> = {
  plains: {
    id: 'plains',
    name: 'Plains',
    description: 'Open grasslands with scattered farms and roads.',
    levelRange: [1, 15],
    props: [
      'tall grass',
      'wildflowers',
      'dirt road',
      'wooden fence',
      'old well',
      'hay bale',
      'grazing sheep',
      'stone marker',
    ],
    ambience: [
      'Wind rustles through the grass.',
      'A hawk circles overhead.',
      'Distant farm bells chime.',
    ],
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Dense woodland with clearings and streams.',
    levelRange: [3, 20],
    props: [
      'ancient oak',
      'fallen log',
      'mushroom ring',
      'mossy stones',
      'bubbling stream',
      'hollow tree',
      'deer trail',
      'bird nest',
    ],
    ambience: [
      'Leaves rustle in the canopy.',
      'A woodpecker drums nearby.',
      'Shafts of light pierce the foliage.',
    ],
  },
  hills: {
    id: 'hills',
    name: 'Hills',
    description: 'Rocky terrain with caves and windswept outcrops.',
    levelRange: [8, 25],
    props: [
      'rocky outcrop',
      'cave entrance',
      'windswept ridge',
      'ancient cairn',
      'abandoned mine',
      'steep cliff',
      'mountain goat',
      'eagle nest',
    ],
    ambience: [
      'Wind howls across the ridge.',
      'Loose stones clatter down the slope.',
      'An eagle screams in the distance.',
    ],
  },
  swamp: {
    id: 'swamp',
    name: 'Swamp',
    description: 'Murky bogs with dead trees and ancient ruins.',
    levelRange: [10, 25],
    props: [
      'stagnant pool',
      'dead tree',
      'thick fog',
      'crumbling ruin',
      'will-o-wisp',
      'rotting log',
      'mosquito swarm',
      'sunken statue',
    ],
    ambience: [
      'Bubbles rise from the murk.',
      'Something splashes in the distance.',
      'The air is thick and fetid.',
    ],
  },
  mountains: {
    id: 'mountains',
    name: 'Mountains',
    description: 'Treacherous peaks with mines and ancient strongholds.',
    levelRange: [15, 30],
    props: [
      'sheer cliff',
      'deep chasm',
      'frozen waterfall',
      'abandoned fortress',
      'dragon bones',
      'crystal formation',
      'rope bridge',
      'snow drift',
    ],
    ambience: [
      'Thunder echoes through the peaks.',
      'Snow swirls in the bitter wind.',
      'The air grows thin and cold.',
    ],
  },
  desert: {
    id: 'desert',
    name: 'Desert',
    description: 'Endless dunes with hidden oases and buried tombs.',
    levelRange: [12, 28],
    props: [
      'sand dune',
      'sun-bleached bones',
      'oasis palm',
      'buried temple',
      'sandstone pillar',
      'scorpion burrow',
      'ancient obelisk',
      'caravan wreckage',
    ],
    ambience: [
      'Heat shimmers on the horizon.',
      'Sand hisses in the wind.',
      'The sun beats down mercilessly.',
    ],
  },
};

export const BIOME_IDS = Object.keys(BIOMES) as BiomeId[];
```

**Step 2: Create class constants**

Create `packages/shared/src/constants/classes.ts`:

```typescript
/**
 * Class and subclass definitions.
 */

import type { ClassName, ClassDef, Stats } from '../types/character';

const defaultStats: Stats = { str: 10, dex: 10, con: 10, int: 10, wis: 10 };

export const CLASSES: Record<ClassName, ClassDef> = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    description: 'A master of martial combat, excelling in melee damage and durability.',
    primaryStats: ['str', 'con'],
    baseStats: { ...defaultStats, str: 14, con: 12, dex: 10, int: 8, wis: 8 },
    hpPerLevel: 12,
    mpPerLevel: 2,
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    description: 'A swift striker who relies on precision, stealth, and critical hits.',
    primaryStats: ['dex', 'str'],
    baseStats: { ...defaultStats, dex: 14, str: 12, con: 10, wis: 8, int: 8 },
    hpPerLevel: 8,
    mpPerLevel: 4,
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    description: 'A wielder of arcane power, devastating enemies with powerful spells.',
    primaryStats: ['int', 'wis'],
    baseStats: { ...defaultStats, int: 14, wis: 12, dex: 10, str: 8, con: 8 },
    hpPerLevel: 6,
    mpPerLevel: 12,
  },
  cleric: {
    id: 'cleric',
    name: 'Cleric',
    description: 'A divine caster who heals allies and smites the unholy.',
    primaryStats: ['wis', 'con'],
    baseStats: { ...defaultStats, wis: 14, con: 12, str: 10, int: 8, dex: 8 },
    hpPerLevel: 8,
    mpPerLevel: 10,
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    description: 'A wilderness expert skilled in ranged combat and tracking.',
    primaryStats: ['dex', 'wis'],
    baseStats: { ...defaultStats, dex: 14, wis: 12, con: 10, str: 8, int: 8 },
    hpPerLevel: 8,
    mpPerLevel: 6,
  },
};

export const CLASS_IDS = Object.keys(CLASSES) as ClassName[];

/** XP required for each level (index = level - 1) */
export const XP_TABLE: number[] = [
  0, // Level 1
  100, // Level 2
  300, // Level 3
  600, // Level 4
  1000, // Level 5
  1500, // Level 6
  2100, // Level 7
  2800, // Level 8
  3600, // Level 9
  4500, // Level 10 (subclass unlock)
  5500,
  6600,
  7800,
  9100,
  10500,
  12000,
  13600,
  15300,
  17100,
  19000, // Level 20
  21000,
  23100,
  25300,
  27600,
  30000,
  32500,
  35100,
  37800,
  40600,
  43500, // Level 30 (tier 2 subclass)
];

/** Get XP needed for a level */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > XP_TABLE.length) {
    // Extrapolate for levels beyond table
    const lastXp = XP_TABLE[XP_TABLE.length - 1];
    const growth = 3000; // XP increase per level after table
    return lastXp + (level - XP_TABLE.length) * growth;
  }
  return XP_TABLE[level - 1];
}

/** Levels where subclass tiers unlock */
export const SUBCLASS_UNLOCK_LEVELS = [10, 30, 50, 70, 90];

/** Talent points gained at each level */
export function talentPointsAtLevel(level: number): number {
  let points = 0;
  if (level >= 10) {
    // 1 point per level starting at 10
    points = level - 9;
    // Bonus points at subclass tier unlocks
    for (const unlock of SUBCLASS_UNLOCK_LEVELS) {
      if (level >= unlock) points += 2;
    }
  }
  return points;
}
```

**Step 3: Create constants index**

Create `packages/shared/src/constants/index.ts`:

```typescript
export * from './biomes';
export * from './classes';
```

**Step 4: Update main index**

Update `packages/shared/src/index.ts`:

```typescript
// @solo-mud/shared - Shared types, constants, and utilities
export const VERSION = '0.1.0';

export * from './types';
export * from './utils';
export * from './constants';
```

**Step 5: Build and verify**

Run: `pnpm --filter @solo-mud/shared build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add packages/shared/src/
git commit -m "feat(shared): add biome and class constant definitions"
```

---

## Phase 3: World Generation (Server)

### Task 3.1: Create graph utilities (TDD)

**Files:**
- Create: `packages/server/src/world/graph.ts`
- Create: `packages/server/src/world/graph.test.ts`

**Step 1: Write the failing test**

Create `packages/server/src/world/graph.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createRng } from '@solo-mud/shared';
import {
  createSpanningTree,
  addRandomEdges,
  computeBfsDepths,
  findFarthestNode,
  reconstructPath,
  isConnected,
} from './graph';

describe('graph utilities', () => {
  describe('createSpanningTree', () => {
    it('should connect all nodes', () => {
      const rng = createRng('spanning-test');
      const nodeCount = 10;
      const edges = createSpanningTree(nodeCount, rng);

      // Spanning tree has n-1 edges
      expect(edges.length).toBe(nodeCount - 1);

      // All nodes should be reachable from node 0
      const adj = buildAdjacency(nodeCount, edges);
      expect(isConnected(adj, 0)).toBe(true);
    });

    it('should be deterministic for same seed', () => {
      const edges1 = createSpanningTree(10, createRng('deterministic'));
      const edges2 = createSpanningTree(10, createRng('deterministic'));
      expect(edges1).toEqual(edges2);
    });
  });

  describe('addRandomEdges', () => {
    it('should add specified number of edges without duplicates', () => {
      const rng = createRng('extra-edges');
      const nodeCount = 10;
      const treeEdges = createSpanningTree(nodeCount, rng);
      const allEdges = addRandomEdges(nodeCount, treeEdges, 5, rng);

      expect(allEdges.length).toBe(treeEdges.length + 5);

      // Check no duplicates or self-loops
      const seen = new Set<string>();
      for (const [a, b] of allEdges) {
        expect(a).not.toBe(b); // No self-loops
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        expect(seen.has(key)).toBe(false); // No duplicates
        seen.add(key);
      }
    });
  });

  describe('computeBfsDepths', () => {
    it('should compute correct depths from start', () => {
      // Simple linear graph: 0 - 1 - 2 - 3
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
      ];
      const adj = buildAdjacency(4, edges);
      const { depths, parents } = computeBfsDepths(adj, 0);

      expect(depths[0]).toBe(0);
      expect(depths[1]).toBe(1);
      expect(depths[2]).toBe(2);
      expect(depths[3]).toBe(3);

      expect(parents[0]).toBe(-1);
      expect(parents[1]).toBe(0);
      expect(parents[2]).toBe(1);
      expect(parents[3]).toBe(2);
    });
  });

  describe('findFarthestNode', () => {
    it('should find the node with maximum depth', () => {
      // 0 - 1 - 2
      //       \
      //        3 - 4 - 5
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [1, 3],
        [3, 4],
        [4, 5],
      ];
      const adj = buildAdjacency(6, edges);
      const { depths } = computeBfsDepths(adj, 0);
      const farthest = findFarthestNode(depths);

      expect(farthest).toBe(5); // Depth 4: 0->1->3->4->5
    });
  });

  describe('reconstructPath', () => {
    it('should reconstruct path from start to goal', () => {
      const parents = [-1, 0, 1, 2, 3];
      const path = reconstructPath(parents, 0, 4);

      expect(path).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('isConnected', () => {
    it('should return true for connected graph', () => {
      const edges: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
      ];
      const adj = buildAdjacency(4, edges);
      expect(isConnected(adj, 0)).toBe(true);
    });

    it('should return false for disconnected graph', () => {
      const edges: [number, number][] = [
        [0, 1],
        [2, 3],
      ];
      const adj = buildAdjacency(4, edges);
      expect(isConnected(adj, 0)).toBe(false);
    });
  });
});

// Helper to build adjacency list
function buildAdjacency(nodeCount: number, edges: [number, number][]): number[][] {
  const adj: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  return adj;
}
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @solo-mud/server test`
Expected: FAIL - Cannot find module './graph'

**Step 3: Write minimal implementation**

Create `packages/server/src/world/graph.ts`:

```typescript
/**
 * Graph algorithms for world generation.
 */

import type { Rng } from '@solo-mud/shared';

/**
 * Create a random spanning tree connecting all nodes.
 * Guarantees all nodes are reachable from node 0.
 */
export function createSpanningTree(
  nodeCount: number,
  rng: Rng
): [number, number][] {
  const edges: [number, number][] = [];
  const connected = new Set<number>([0]);

  for (let i = 1; i < nodeCount; i++) {
    // Connect new node to a random existing connected node
    const connectedArray = Array.from(connected);
    const parent = rng.pick(connectedArray);
    edges.push([parent, i]);
    connected.add(i);
  }

  return edges;
}

/**
 * Add random edges to create loops/shortcuts.
 * Avoids duplicates and self-loops.
 */
export function addRandomEdges(
  nodeCount: number,
  existingEdges: [number, number][],
  count: number,
  rng: Rng
): [number, number][] {
  const result = [...existingEdges];

  // Track existing edges
  const edgeSet = new Set<string>();
  for (const [a, b] of existingEdges) {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    edgeSet.add(key);
  }

  let added = 0;
  let attempts = 0;
  const maxAttempts = count * 10;

  while (added < count && attempts < maxAttempts) {
    attempts++;
    const a = rng.nextInt(0, nodeCount - 1);
    const b = rng.nextInt(0, nodeCount - 1);

    if (a === b) continue; // No self-loops

    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (edgeSet.has(key)) continue; // No duplicates

    edgeSet.add(key);
    result.push([a, b]);
    added++;
  }

  return result;
}

/**
 * Compute BFS depths and parent pointers from a start node.
 */
export function computeBfsDepths(
  adjacency: number[][],
  start: number
): { depths: number[]; parents: number[] } {
  const nodeCount = adjacency.length;
  const depths = new Array(nodeCount).fill(-1);
  const parents = new Array(nodeCount).fill(-1);

  depths[start] = 0;
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of adjacency[current]) {
      if (depths[neighbor] === -1) {
        depths[neighbor] = depths[current] + 1;
        parents[neighbor] = current;
        queue.push(neighbor);
      }
    }
  }

  return { depths, parents };
}

/**
 * Find the node with maximum depth.
 */
export function findFarthestNode(depths: number[]): number {
  let maxDepth = -1;
  let farthest = 0;

  for (let i = 0; i < depths.length; i++) {
    if (depths[i] > maxDepth) {
      maxDepth = depths[i];
      farthest = i;
    }
  }

  return farthest;
}

/**
 * Reconstruct path from start to goal using parent pointers.
 */
export function reconstructPath(
  parents: number[],
  start: number,
  goal: number
): number[] {
  const path: number[] = [];
  let current = goal;

  while (current !== -1) {
    path.unshift(current);
    if (current === start) break;
    current = parents[current];
  }

  return path;
}

/**
 * Check if all nodes are reachable from start.
 */
export function isConnected(adjacency: number[][], start: number): boolean {
  const { depths } = computeBfsDepths(adjacency, start);
  return depths.every((d) => d !== -1);
}

/**
 * Build adjacency list from edge list.
 */
export function buildAdjacency(
  nodeCount: number,
  edges: [number, number][]
): number[][] {
  const adj: number[][] = Array.from({ length: nodeCount }, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  return adj;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @solo-mud/server test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/server/src/world/
git commit -m "feat(server): add graph utilities for world generation"
```

---

### Task 3.2: Create world validation (TDD)

**Files:**
- Create: `packages/server/src/world/validate.ts`
- Create: `packages/server/src/world/validate.test.ts`

**Step 1: Write the failing test**

Create `packages/server/src/world/validate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { World, Location, Exit, Item } from '@solo-mud/shared';
import { simulateReachability, validateWorld } from './validate';

describe('simulateReachability', () => {
  it('should reach all open locations from start', () => {
    const world = createTestWorld([
      { from: 'start', to: 'a', type: 'open' },
      { from: 'a', to: 'b', type: 'open' },
      { from: 'b', to: 'goal', type: 'open' },
    ]);

    const result = simulateReachability(world);

    expect(result.reachable.has('start')).toBe(true);
    expect(result.reachable.has('a')).toBe(true);
    expect(result.reachable.has('b')).toBe(true);
    expect(result.reachable.has('goal')).toBe(true);
  });

  it('should not reach locked locations without key', () => {
    const world = createTestWorld([
      { from: 'start', to: 'a', type: 'open' },
      { from: 'a', to: 'goal', type: 'locked', requirement: { kind: 'item', value: 'key_iron' } },
    ]);

    const result = simulateReachability(world);

    expect(result.reachable.has('start')).toBe(true);
    expect(result.reachable.has('a')).toBe(true);
    expect(result.reachable.has('goal')).toBe(false);
  });

  it('should reach locked locations when key is available', () => {
    const world = createTestWorld(
      [
        { from: 'start', to: 'a', type: 'open' },
        { from: 'a', to: 'goal', type: 'locked', requirement: { kind: 'item', value: 'key_iron' } },
      ],
      { a: ['key_iron'] } // Key is in location 'a'
    );

    const result = simulateReachability(world);

    expect(result.reachable.has('goal')).toBe(true);
    expect(result.inventory.has('key_iron')).toBe(true);
  });

  it('should collect items as locations become reachable', () => {
    const world = createTestWorld(
      [
        { from: 'start', to: 'a', type: 'open' },
        { from: 'a', to: 'b', type: 'locked', requirement: { kind: 'item', value: 'key_1' } },
        { from: 'b', to: 'goal', type: 'locked', requirement: { kind: 'item', value: 'key_2' } },
      ],
      {
        start: ['key_1'],
        b: ['key_2'],
      }
    );

    const result = simulateReachability(world);

    expect(result.reachable.has('goal')).toBe(true);
    expect(result.inventory.has('key_1')).toBe(true);
    expect(result.inventory.has('key_2')).toBe(true);
  });
});

describe('validateWorld', () => {
  it('should pass for valid solvable world', () => {
    const world = createTestWorld(
      [
        { from: 'start', to: 'a', type: 'open' },
        { from: 'a', to: 'goal', type: 'locked', requirement: { kind: 'item', value: 'key_iron' } },
        { from: 'start', to: 'side', type: 'open' },
      ],
      { side: ['key_iron'] }
    );

    const result = validateWorld(world);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when goal is unreachable', () => {
    const world = createTestWorld([
      { from: 'start', to: 'a', type: 'open' },
      { from: 'a', to: 'goal', type: 'locked', requirement: { kind: 'item', value: 'key_iron' } },
      // No key_iron anywhere
    ]);

    const result = validateWorld(world);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('unreachable'))).toBe(true);
  });

  it('should fail when graph is disconnected', () => {
    const world = createTestWorld([
      { from: 'start', to: 'a', type: 'open' },
      // 'goal' has no connections
    ]);
    // Manually add disconnected goal
    world.locations['goal'] = createLocation('goal');

    const result = validateWorld(world);

    expect(result.valid).toBe(false);
  });
});

// ============ Test Helpers ============

interface TestEdge {
  from: string;
  to: string;
  type: 'open' | 'locked';
  requirement?: { kind: 'item'; value: string };
}

function createTestWorld(
  edges: TestEdge[],
  itemPlacements: Record<string, string[]> = {}
): World {
  const locations: Record<string, Location> = {};
  const exits: Record<string, Exit> = {};
  const adjacency: Record<string, string[]> = {};
  const items: Record<string, Item> = {};

  // Create locations
  const locationIds = new Set<string>();
  locationIds.add('start');
  locationIds.add('goal');
  for (const edge of edges) {
    locationIds.add(edge.from);
    locationIds.add(edge.to);
  }

  for (const id of locationIds) {
    locations[id] = createLocation(id);
    adjacency[id] = [];
  }

  // Create exits
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const exitId = `exit_${i}`;
    const reverseExitId = `exit_${i}_rev`;

    exits[exitId] = {
      id: exitId,
      from: edge.from,
      to: edge.to,
      label: `to_${edge.to}`,
      type: edge.type,
      requirement: edge.requirement,
    };

    exits[reverseExitId] = {
      id: reverseExitId,
      from: edge.to,
      to: edge.from,
      label: `to_${edge.from}`,
      type: edge.type,
      requirement: edge.requirement,
    };

    adjacency[edge.from].push(exitId);
    adjacency[edge.to].push(reverseExitId);
  }

  // Place items
  for (const [locationId, itemIds] of Object.entries(itemPlacements)) {
    for (const itemId of itemIds) {
      items[itemId] = {
        id: itemId,
        baseId: itemId,
        name: itemId,
        tags: ['key'],
        rarity: 'common',
        affixes: [],
      };
      locations[locationId].items.push(itemId);
    }
  }

  return {
    seed: 'test',
    startId: 'start',
    goalId: 'goal',
    locations,
    exits,
    adjacency,
    items,
    time: { totalMinutes: 0, timeOfDay: 'morning', day: 1 },
    weather: { type: 'clear', intensity: 0 },
  };
}

function createLocation(id: string): Location {
  return {
    id,
    name: id,
    biome: { plains: 1 },
    props: [],
    items: [],
    enemies: [],
    visitState: { visitCount: 0 },
    depth: 0,
  };
}
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @solo-mud/server test`
Expected: FAIL - Cannot find module './validate'

**Step 3: Write minimal implementation**

Create `packages/server/src/world/validate.ts`:

```typescript
/**
 * World validation - ensures generated worlds are solvable.
 */

import type { World, NodeId, ItemId, Requirement } from '@solo-mud/shared';

export interface ReachabilityResult {
  reachable: Set<NodeId>;
  inventory: Set<ItemId>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  reachability?: ReachabilityResult;
}

/**
 * Simulate player traversal to determine reachable locations.
 * Starts at startId, collects items, unlocks paths until no progress.
 */
export function simulateReachability(world: World): ReachabilityResult {
  const reachable = new Set<NodeId>([world.startId]);
  const inventory = new Set<ItemId>();

  // Collect items from starting location
  collectItems(world, world.startId, inventory);

  let changed = true;
  while (changed) {
    changed = false;

    // Try to traverse all exits from reachable locations
    for (const locationId of reachable) {
      const exitIds = world.adjacency[locationId] ?? [];

      for (const exitId of exitIds) {
        const exit = world.exits[exitId];
        if (!exit) continue;

        const targetId = exit.to;
        if (reachable.has(targetId)) continue;

        // Check if we can traverse this exit
        if (canTraverse(exit, inventory)) {
          reachable.add(targetId);
          collectItems(world, targetId, inventory);
          changed = true;
        }
      }
    }
  }

  return { reachable, inventory };
}

/**
 * Check if an exit can be traversed with current inventory.
 */
function canTraverse(exit: { type: string; requirement?: Requirement }, inventory: Set<ItemId>): boolean {
  if (exit.type === 'open') return true;
  if (exit.type === 'locked' && exit.requirement) {
    if (exit.requirement.kind === 'item') {
      return inventory.has(exit.requirement.value as string);
    }
    // TODO: Handle level/quest requirements
  }
  return false;
}

/**
 * Collect all items from a location into inventory.
 */
function collectItems(world: World, locationId: NodeId, inventory: Set<ItemId>): void {
  const location = world.locations[locationId];
  if (!location) return;

  for (const itemId of location.items) {
    inventory.add(itemId);
  }
}

/**
 * Validate that a world is solvable and well-formed.
 */
export function validateWorld(world: World): ValidationResult {
  const errors: string[] = [];

  // Check basic structure
  if (!world.locations[world.startId]) {
    errors.push(`Start location '${world.startId}' does not exist`);
  }
  if (!world.locations[world.goalId]) {
    errors.push(`Goal location '${world.goalId}' does not exist`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Check connectivity (ignoring lock requirements)
  const allReachable = checkConnectivity(world);
  if (!allReachable) {
    errors.push('World graph is not fully connected');
  }

  // Simulate reachability with locks/keys
  const reachability = simulateReachability(world);

  if (!reachability.reachable.has(world.goalId)) {
    errors.push(`Goal '${world.goalId}' is unreachable from start`);
  }

  return {
    valid: errors.length === 0,
    errors,
    reachability,
  };
}

/**
 * Check if all locations are connected (ignoring lock requirements).
 */
function checkConnectivity(world: World): boolean {
  const visited = new Set<NodeId>();
  const queue: NodeId[] = [world.startId];
  visited.add(world.startId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const exitIds = world.adjacency[current] ?? [];

    for (const exitId of exitIds) {
      const exit = world.exits[exitId];
      if (!exit) continue;

      if (!visited.has(exit.to)) {
        visited.add(exit.to);
        queue.push(exit.to);
      }
    }
  }

  // All locations should be visited
  const locationCount = Object.keys(world.locations).length;
  return visited.size === locationCount;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @solo-mud/server test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/server/src/world/
git commit -m "feat(server): add world validation with reachability simulation"
```

---

### Task 3.3: Create world generator (TDD)

**Files:**
- Create: `packages/server/src/world/generate.ts`
- Create: `packages/server/src/world/generate.test.ts`

**Step 1: Write the failing test**

Create `packages/server/src/world/generate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateWorld } from './generate';
import { validateWorld } from './validate';

describe('generateWorld', () => {
  it('should generate a connected world', () => {
    const world = generateWorld({ seed: 'test-connected', nodeCount: 18, extraEdges: 5, lockedEdges: 2 });

    expect(Object.keys(world.locations).length).toBe(18);
    expect(world.startId).toBeDefined();
    expect(world.goalId).toBeDefined();
    expect(world.startId).not.toBe(world.goalId);
  });

  it('should generate a solvable world', () => {
    const world = generateWorld({ seed: 'test-solvable', nodeCount: 18, extraEdges: 5, lockedEdges: 2 });
    const validation = validateWorld(world);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should be deterministic for same seed', () => {
    const world1 = generateWorld({ seed: 'deterministic-test', nodeCount: 10, extraEdges: 3, lockedEdges: 1 });
    const world2 = generateWorld({ seed: 'deterministic-test', nodeCount: 10, extraEdges: 3, lockedEdges: 1 });

    expect(world1.startId).toBe(world2.startId);
    expect(world1.goalId).toBe(world2.goalId);
    expect(Object.keys(world1.locations)).toEqual(Object.keys(world2.locations));
    expect(Object.keys(world1.exits)).toEqual(Object.keys(world2.exits));
  });

  it('should produce different worlds for different seeds', () => {
    const world1 = generateWorld({ seed: 'seed-a', nodeCount: 10, extraEdges: 3, lockedEdges: 1 });
    const world2 = generateWorld({ seed: 'seed-b', nodeCount: 10, extraEdges: 3, lockedEdges: 1 });

    // Very unlikely to have same goal by chance
    expect(world1.goalId === world2.goalId && world1.startId === world2.startId).toBe(false);
  });

  it('should place locked exits on critical path', () => {
    const world = generateWorld({ seed: 'locked-test', nodeCount: 18, extraEdges: 5, lockedEdges: 2 });

    const lockedExits = Object.values(world.exits).filter((e) => e.type === 'locked');
    expect(lockedExits.length).toBeGreaterThanOrEqual(2); // At least 2 locked (may have reverse edges)

    // Each locked exit should have a requirement
    for (const exit of lockedExits) {
      expect(exit.requirement).toBeDefined();
    }
  });

  it('should place keys reachable before their locks', () => {
    const world = generateWorld({ seed: 'key-placement', nodeCount: 18, extraEdges: 5, lockedEdges: 2 });
    const validation = validateWorld(world);

    // If valid, keys must be reachable before locks
    expect(validation.valid).toBe(true);
  });

  it('should assign biomes based on depth', () => {
    const world = generateWorld({ seed: 'biome-test', nodeCount: 18, extraEdges: 5, lockedEdges: 2 });

    const startLocation = world.locations[world.startId];
    const goalLocation = world.locations[world.goalId];

    // Start should have shallow biome weights (plains/forest)
    expect(startLocation.depth).toBe(0);
    // Goal should have higher depth
    expect(goalLocation.depth).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @solo-mud/server test`
Expected: FAIL - Cannot find module './generate'

**Step 3: Write minimal implementation**

Create `packages/server/src/world/generate.ts`:

```typescript
/**
 * Procedural world generation pipeline.
 */

import {
  createRng,
  type Rng,
  type World,
  type WorldGenParams,
  type Location,
  type Exit,
  type Item,
  type NodeId,
  type EdgeId,
  type BiomeWeights,
  BIOMES,
  BIOME_IDS,
} from '@solo-mud/shared';

import {
  createSpanningTree,
  addRandomEdges,
  buildAdjacency,
  computeBfsDepths,
  findFarthestNode,
  reconstructPath,
} from './graph';
import { validateWorld } from './validate';

const MAX_RETRY_ATTEMPTS = 10;

const EXIT_LABELS = ['north', 'south', 'east', 'west', 'up', 'down', 'passage', 'door', 'path', 'tunnel'];

const LOCATION_NAMES = [
  'Clearing', 'Crossroads', 'Hollow', 'Ridge', 'Valley', 'Grove', 'Ruins',
  'Camp', 'Pond', 'Cave Entrance', 'Old Bridge', 'Shrine', 'Watchtower',
  'Ravine', 'Thicket', 'Meadow', 'Cliff', 'Stream', 'Den', 'Overlook',
];

/**
 * Generate a complete, validated world.
 */
export function generateWorld(params: WorldGenParams): World {
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    const attemptSeed = attempt === 0 ? params.seed : `${params.seed}_${attempt}`;
    const world = generateWorldAttempt({ ...params, seed: attemptSeed });

    const validation = validateWorld(world);
    if (validation.valid) {
      return world;
    }

    console.warn(`World generation attempt ${attempt + 1} failed:`, validation.errors);
  }

  throw new Error(`Failed to generate valid world after ${MAX_RETRY_ATTEMPTS} attempts`);
}

/**
 * Single attempt at world generation.
 */
function generateWorldAttempt(params: WorldGenParams): World {
  const rng = createRng(params.seed);
  const { nodeCount, extraEdges, lockedEdges } = params;

  // 1. Create nodes
  const nodeIndices = Array.from({ length: nodeCount }, (_, i) => i);

  // 2. Build spanning tree
  const treeEdges = createSpanningTree(nodeCount, rng);

  // 3. Add extra edges for loops
  const allEdges = addRandomEdges(nodeCount, treeEdges, extraEdges, rng);

  // 4. Compute depths from start (node 0)
  const adjacencyNumbers = buildAdjacency(nodeCount, allEdges);
  const { depths, parents } = computeBfsDepths(adjacencyNumbers, 0);

  // 5. Find goal (farthest from start)
  const goalIndex = findFarthestNode(depths);

  // 6. Reconstruct critical path
  const criticalPath = reconstructPath(parents, 0, goalIndex);

  // 7. Convert to string IDs
  const nodeIds = nodeIndices.map((i) => `loc_${i}`);
  const startId = nodeIds[0];
  const goalId = nodeIds[goalIndex];

  // 8. Create locations
  const locations: Record<NodeId, Location> = {};
  for (let i = 0; i < nodeCount; i++) {
    const nodeId = nodeIds[i];
    const depth = depths[i];
    locations[nodeId] = createLocation(nodeId, depth, rng);
  }

  // 9. Create exits and adjacency
  const exits: Record<EdgeId, Exit> = {};
  const adjacency: Record<NodeId, EdgeId[]> = {};

  for (const nodeId of nodeIds) {
    adjacency[nodeId] = [];
  }

  // Select edges on critical path (skip first 2) to lock
  const criticalEdgeIndices = new Set<number>();
  const criticalEdges: [number, number][] = [];
  for (let i = 0; i < criticalPath.length - 1; i++) {
    criticalEdges.push([criticalPath[i], criticalPath[i + 1]]);
  }

  // Find which allEdges are on the critical path
  const edgesToLock: number[] = [];
  for (let i = 0; i < allEdges.length; i++) {
    const [a, b] = allEdges[i];
    for (let j = 2; j < criticalEdges.length; j++) {
      // Skip first 2 edges
      const [ca, cb] = criticalEdges[j];
      if ((a === ca && b === cb) || (a === cb && b === ca)) {
        criticalEdgeIndices.add(i);
        break;
      }
    }
  }

  // Select up to lockedEdges from critical path edges
  const availableToLock = Array.from(criticalEdgeIndices);
  const shuffledToLock = rng.shuffle(availableToLock);
  const lockedEdgeIndices = new Set(shuffledToLock.slice(0, lockedEdges));

  // Create items (keys) for locked edges
  const items: Record<string, Item> = {};
  const lockKeys: Map<number, string> = new Map();

  let keyIndex = 0;
  for (const edgeIndex of lockedEdgeIndices) {
    const keyId = `key_${keyIndex++}`;
    const keyNames = ['iron', 'bone', 'crystal', 'brass', 'obsidian', 'silver'];
    const keyName = `${rng.pick(keyNames)} key`;

    items[keyId] = {
      id: keyId,
      baseId: 'key',
      name: keyName,
      tags: ['key'],
      rarity: 'common',
      affixes: [],
    };

    lockKeys.set(edgeIndex, keyId);
  }

  // Create exits
  for (let i = 0; i < allEdges.length; i++) {
    const [a, b] = allEdges[i];
    const nodeA = nodeIds[a];
    const nodeB = nodeIds[b];
    const isLocked = lockedEdgeIndices.has(i);
    const keyId = lockKeys.get(i);

    const exitIdAB = `exit_${i}_ab`;
    const exitIdBA = `exit_${i}_ba`;
    const label = rng.pick(EXIT_LABELS);

    const exitAB: Exit = {
      id: exitIdAB,
      from: nodeA,
      to: nodeB,
      label,
      type: isLocked ? 'locked' : 'open',
      requirement: isLocked && keyId ? { kind: 'item', value: keyId } : undefined,
    };

    const exitBA: Exit = {
      id: exitIdBA,
      from: nodeB,
      to: nodeA,
      label: getOppositeLabel(label),
      type: isLocked ? 'locked' : 'open',
      requirement: isLocked && keyId ? { kind: 'item', value: keyId } : undefined,
    };

    exits[exitIdAB] = exitAB;
    exits[exitIdBA] = exitBA;
    adjacency[nodeA].push(exitIdAB);
    adjacency[nodeB].push(exitIdBA);
  }

  // 10. Place keys (must be reachable before their locks)
  for (const [edgeIndex, keyId] of lockKeys) {
    const [lockA, lockB] = allEdges[edgeIndex];
    const lockDepth = Math.min(depths[lockA], depths[lockB]);

    // Find locations with depth < lockDepth, preferably off critical path
    const candidates = nodeIds.filter((id, i) => {
      const d = depths[i];
      const onCriticalPath = criticalPath.includes(i);
      return d < lockDepth && !onCriticalPath;
    });

    // Fallback: any location with lower depth
    const fallbackCandidates = nodeIds.filter((_, i) => depths[i] < lockDepth);

    const placement = candidates.length > 0 ? rng.pick(candidates) : rng.pick(fallbackCandidates.length > 0 ? fallbackCandidates : [startId]);

    locations[placement].items.push(keyId);
  }

  return {
    seed: params.seed,
    startId,
    goalId,
    locations,
    exits,
    adjacency,
    items,
    time: { totalMinutes: 480, timeOfDay: 'morning', day: 1 }, // 8 AM
    weather: { type: 'clear', intensity: 0 },
  };
}

/**
 * Create a location with biome based on depth.
 */
function createLocation(id: NodeId, depth: number, rng: Rng): Location {
  const name = rng.pick(LOCATION_NAMES);
  const biome = assignBiome(depth, rng);
  const props = generateProps(biome, rng);

  return {
    id,
    name: `${name} (${id})`,
    biome,
    props,
    items: [],
    enemies: [],
    visitState: { visitCount: 0 },
    depth,
  };
}

/**
 * Assign biome weights based on depth.
 */
function assignBiome(depth: number, rng: Rng): BiomeWeights {
  // Depth bands determine primary biome
  const weights: BiomeWeights = {};

  if (depth <= 2) {
    // Safe starter area
    weights.plains = 0.6 + rng.next() * 0.2;
    weights.forest = 0.2 + rng.next() * 0.2;
  } else if (depth <= 5) {
    // Transitional
    weights.forest = 0.4 + rng.next() * 0.2;
    weights.hills = 0.2 + rng.next() * 0.2;
    weights.plains = 0.1 + rng.next() * 0.2;
  } else if (depth <= 8) {
    // Mid-range
    weights.hills = 0.4 + rng.next() * 0.2;
    weights.swamp = 0.2 + rng.next() * 0.2;
    weights.forest = 0.1 + rng.next() * 0.1;
  } else {
    // Deep/dangerous
    weights.mountains = 0.3 + rng.next() * 0.2;
    weights.swamp = 0.2 + rng.next() * 0.2;
    weights.desert = 0.2 + rng.next() * 0.2;
  }

  return weights;
}

/**
 * Generate props based on biome weights.
 */
function generateProps(biome: BiomeWeights, rng: Rng): string[] {
  const props: string[] = [];
  const propCount = rng.nextInt(1, 3);

  // Get dominant biome
  const entries = Object.entries(biome) as [keyof typeof BIOMES, number][];
  entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const dominantBiomeId = entries[0]?.[0] ?? 'plains';
  const biomeDef = BIOMES[dominantBiomeId];

  if (biomeDef) {
    for (let i = 0; i < propCount; i++) {
      props.push(rng.pick(biomeDef.props));
    }
  }

  return [...new Set(props)]; // Remove duplicates
}

/**
 * Get opposite direction label.
 */
function getOppositeLabel(label: string): string {
  const opposites: Record<string, string> = {
    north: 'south',
    south: 'north',
    east: 'west',
    west: 'east',
    up: 'down',
    down: 'up',
  };
  return opposites[label] ?? label;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @solo-mud/server test`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add packages/server/src/world/
git commit -m "feat(server): add procedural world generator with validated lock/key placement"
```

---

## Phase 4-13: Continued Implementation

Due to length constraints, the remaining phases follow the same TDD pattern:

### Phase 4: Fastify + Socket.io Server
- Task 4.1: Create Fastify app setup
- Task 4.2: Add Socket.io integration
- Task 4.3: Create connection handling

### Phase 5: Basic Commands
- Task 5.1: Create command parser (TDD)
- Task 5.2: Implement look command
- Task 5.3: Implement go command
- Task 5.4: Implement take/drop commands
- Task 5.5: Implement inventory command

### Phase 6: Client Terminal UI
- Task 6.1: Create Terminal component
- Task 6.2: Create CommandInput component
- Task 6.3: Create output rendering
- Task 6.4: Add Socket.io connection hook

### Phase 7: Client-Server Integration
- Task 7.1: Connect client to server
- Task 7.2: Handle room updates
- Task 7.3: Handle command responses

### Phase 8: Character System
- Task 8.1: Create player factory
- Task 8.2: Implement stat calculations
- Task 8.3: Add character creation flow

### Phase 9: Combat System
- Task 9.1: Create tick system
- Task 9.2: Implement auto-attack
- Task 9.3: Add GCD and cooldowns
- Task 9.4: Create enemy AI

### Phase 10: Equipment & Loot
- Task 10.1: Create item generator (TDD)
- Task 10.2: Implement affix system
- Task 10.3: Add equipment commands

### Phase 11: Dynamic Descriptions
- Task 11.1: Create description templates
- Task 11.2: Implement state tracking
- Task 11.3: Add time-of-day variations

### Phase 12: Time & Weather
- Task 12.1: Create time tick system
- Task 12.2: Implement weather simulation
- Task 12.3: Add NPC schedules

### Phase 13: Polish & Integration Testing
- Task 13.1: End-to-end game loop test
- Task 13.2: Add README with instructions
- Task 13.3: Final cleanup and documentation

---

## Execution Checklist

After each task:
- [ ] Tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Changes committed with descriptive message

After each phase:
- [ ] Integration test between packages
- [ ] Manual smoke test if applicable
- [ ] Update README if needed
