/**
 * World map visualization test - outputs a visual map of the generated world.
 * Run with: pnpm test packages/server/src/world/map-output.test.ts
 */

import { describe, it, expect } from 'vitest';
import { generateWorld } from './generate';
import type { World, Location } from '@solo-mud/shared';

// Build adjacency graph for wilderness visualization
interface GraphNode {
  id: string;
  name: string;
  depth: number;
  biome: string;
  connections: { to: string; label: string; locked: boolean }[];
}

function buildWildernessGraph(world: World): Map<string, GraphNode> {
  const graph = new Map<string, GraphNode>();

  for (const loc of Object.values(world.locations)) {
    if (loc.id.startsWith('town_')) continue;

    const biome = Object.entries(loc.biome).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'plains';
    const exitIds = world.adjacency[loc.id] ?? [];
    const connections = exitIds
      .map(exitId => {
        const exit = world.exits[exitId];
        if (!exit || exit.to.startsWith('town_')) return null;
        return { to: exit.to, label: exit.label, locked: exit.type === 'locked' };
      })
      .filter((c): c is { to: string; label: string; locked: boolean } => c !== null);

    graph.set(loc.id, {
      id: loc.id,
      name: loc.name,
      depth: loc.depth ?? 0,
      biome,
      connections,
    });
  }

  return graph;
}

// Generate ASCII world map using depth-based layers
function generateAsciiWorldMap(world: World): string[] {
  const lines: string[] = [];
  const graph = buildWildernessGraph(world);

  // Group by depth
  const byDepth = new Map<number, GraphNode[]>();
  for (const node of graph.values()) {
    if (!byDepth.has(node.depth)) byDepth.set(node.depth, []);
    byDepth.get(node.depth)!.push(node);
  }

  const maxDepth = Math.max(...byDepth.keys());

  // Create abbreviated names (first 8 chars)
  const abbrev = (name: string) => name.slice(0, 10).padEnd(10);
  const nodeNum = (id: string) => id.replace('loc_', '');

  lines.push('');
  lines.push('┌─────────────────────────────────────────────────────────────────────────┐');
  lines.push('│                    WILDERNESS MAP (by Depth)                           │');
  lines.push('│                    ══════════════════════════                          │');
  lines.push('│                                                                        │');
  lines.push('│  Legend: [##] = Location number   ─── = Path   ═══ = Locked door      │');
  lines.push('│          ↑↓←→ = Direction hints   (D#) = Depth level                  │');
  lines.push('└─────────────────────────────────────────────────────────────────────────┘');
  lines.push('');

  // Find town connection
  const townEntry = world.adjacency['town_gate']?.find(exitId => {
    const exit = world.exits[exitId];
    return exit && !exit.to.startsWith('town_');
  });
  const townExitTarget = townEntry ? world.exits[townEntry]?.to : 'loc_0';

  lines.push('                              ┌──────────────┐');
  lines.push('                              │  EASTHOLLOW  │');
  lines.push('                              │   (TOWN)     │');
  lines.push('                              └──────┬───────┘');
  lines.push('                                     │');
  lines.push('                                     ▼');

  // Draw each depth level
  for (let depth = 0; depth <= maxDepth; depth++) {
    const nodes = byDepth.get(depth) ?? [];
    if (nodes.length === 0) continue;

    const dangerIcon = depth <= 1 ? '🌿' : depth <= 3 ? '⚔️ ' : depth <= 5 ? '💀' : '☠️ ';
    const dangerText = depth <= 1 ? 'Safe' : depth <= 3 ? 'Moderate' : depth <= 5 ? 'Dangerous' : 'Deadly';

    lines.push('');
    lines.push(`═══════════════════ DEPTH ${depth} ${dangerIcon} ${dangerText} ═══════════════════`);
    lines.push('');

    // Draw nodes at this depth in a row
    const nodeBoxes: string[] = [];
    for (const node of nodes) {
      const biomeIcon = node.biome === 'forest' ? '🌲' : node.biome === 'hills' ? '⛰️' :
                        node.biome === 'swamp' ? '🌿' : node.biome === 'mountains' ? '🏔️' : '🌾';
      nodeBoxes.push(`[${nodeNum(node.id).padStart(2)}] ${abbrev(node.name)} ${biomeIcon}`);
    }

    // Print 3 nodes per row
    for (let i = 0; i < nodeBoxes.length; i += 3) {
      const row = nodeBoxes.slice(i, i + 3).join('   ');
      lines.push(`    ${row}`);
    }

    // Show connections to next depth
    if (depth < maxDepth) {
      const nextDepthNodes = byDepth.get(depth + 1) ?? [];
      if (nextDepthNodes.length > 0) {
        lines.push('');
        lines.push('         │');

        // Find connections between this depth and next
        const crossConnections: string[] = [];
        for (const node of nodes) {
          for (const conn of node.connections) {
            const targetNode = graph.get(conn.to);
            if (targetNode && targetNode.depth === depth + 1) {
              const arrow = conn.locked ? '═══🔒═══▶' : '────────▶';
              crossConnections.push(`    [${nodeNum(node.id)}] ${arrow} [${nodeNum(conn.to)}]`);
            }
          }
        }

        // Show unique connections (dedup)
        const shown = new Set<string>();
        for (const conn of crossConnections) {
          const key = conn.replace(/[^0-9]/g, '');
          if (!shown.has(key)) {
            shown.add(key);
            lines.push(conn);
          }
        }

        lines.push('         ▼');
      }
    }
  }

  return lines;
}

describe('World Map Visualization', () => {
  it('generates and displays world map', () => {
    const world = generateWorld({
      seed: 'map-demo',
      nodeCount: 18,
      extraEdges: 5,
      lockedEdges: 2,
    });

    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                    SOLO MUD - WORLD MAP                            ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    // Print the static town map
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('                    EASTHOLLOW TOWN (Safe Zone)');
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    console.log('                    ┌─────────────────┐');
    console.log('                    │  Training Yard  │');
    console.log('                    │  (class trainers│');
    console.log('                    │   + dummy)      │');
    console.log('                    └────────┬────────┘');
    console.log('                             │ south');
    console.log('                             │');
    console.log('┌──────────────┐    ┌───────┴───────┐    ┌─────────────────┐');
    console.log("│  Town Gate   ├────┤  Town Square  ├────┤ The Rusty Blade │");
    console.log('│              │west│   (center)    │east│    Inn [START]  │');
    console.log('│              │    │               │    │  (Mira - shop)  │');
    console.log('└──────┬───────┘    └───────┬───────┘    └─────────────────┘');
    console.log('       │                    │ south');
    console.log('       │                    │');
    console.log('  wilderness           ┌────┴────┐');
    console.log('  (loc_0)              │ Market  │');
    console.log('                       │ Street  │');
    console.log('                       └────┬────┘');
    console.log('                      west  │  east');
    console.log('              ┌─────────────┼─────────────┐');
    console.log('              │             │             │');
    console.log('     ┌────────┴───────┐           ┌──────┴────────┐');
    console.log("     │ The Iron Anvil │           │   Elwin's     │");
    console.log('     │  (Kira - wpns) │           │   Remedies    │');
    console.log('     └────────┬───────┘           │ (potions)     │');
    console.log('              │ south             └───────┬───────┘');
    console.log('              │                           │ south');
    console.log('              │      ┌────────────────────┘');
    console.log('              │      │');
    console.log('              └──────┴───────┐');
    console.log("                    ┌────────┴────────┐");
    console.log("                    │  Thom's        │");
    console.log('                    │  Supplies      │');
    console.log('                    │  (general)     │');
    console.log('                    └─────────────────┘\n');

    // ASCII World Map
    const asciiMap = generateAsciiWorldMap(world);
    asciiMap.forEach(line => console.log(line));

    // Wilderness areas detail
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('                    LOCATION DETAILS');
    console.log('═══════════════════════════════════════════════════════════════════════\n');

    // Organize locations by type
    const wildernessLocations = Object.values(world.locations)
      .filter(loc => !loc.id.startsWith('town_'))
      .sort((a, b) => (a.depth ?? 0) - (b.depth ?? 0));

    // Group by depth
    const byDepth = new Map<number, typeof wildernessLocations>();
    for (const loc of wildernessLocations) {
      const depth = loc.depth ?? 0;
      if (!byDepth.has(depth)) byDepth.set(depth, []);
      byDepth.get(depth)!.push(loc);
    }

    // Get dominant biome
    function getDominantBiome(biome: Record<string, number>): string {
      let maxBiome = 'plains';
      let maxWeight = 0;
      for (const [name, weight] of Object.entries(biome)) {
        if (weight > maxWeight) {
          maxWeight = weight;
          maxBiome = name;
        }
      }
      return maxBiome;
    }

    // Get exits for a location
    function getExits(locId: string) {
      const exitIds = world.adjacency[locId] ?? [];
      return exitIds.map(exitId => {
        const exit = world.exits[exitId];
        if (!exit) return null;
        const dest = world.locations[exit.to];
        return {
          label: exit.label,
          toName: dest ? dest.name : exit.to,
          locked: exit.type === 'locked',
        };
      }).filter((e): e is { label: string; toName: string; locked: boolean } => e !== null);
    }

    // Print each depth level
    for (const [depth, locs] of Array.from(byDepth.entries()).sort((a, b) => a[0] - b[0])) {
      const dangerLabel = depth <= 2 ? '(Safe)' : depth <= 5 ? '(Moderate)' : depth <= 8 ? '(Dangerous)' : '(Deadly)';
      console.log(`──────── DEPTH ${depth} ${dangerLabel} ────────\n`);

      for (const loc of locs) {
        const biome = getDominantBiome(loc.biome);
        const exits = getExits(loc.id);
        const creatures = loc.creatures ?? [];

        console.log(`  📍 ${loc.name} (${loc.id})`);
        console.log(`     Biome: ${biome}`);
        console.log(`     Props: ${loc.props.join(', ')}`);

        if (exits.length > 0) {
          const exitStrs = exits.map(e => {
            const lock = e.locked ? ' 🔒' : '';
            return `${e.label}→${e.toName}${lock}`;
          });
          console.log(`     Exits: ${exitStrs.join(' | ')}`);
        }

        if (creatures.length > 0) {
          console.log(`     Creatures: ${creatures.join(', ')}`);
        }

        console.log();
      }
    }

    // Connection graph
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('                    CONNECTION GRAPH');
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    console.log('Format: [location] --direction--> [connected location]');
    console.log('        🔒 = locked exit (requires key)\n');

    for (const loc of wildernessLocations) {
      const exits = getExits(loc.id);
      if (exits.length === 0) continue;

      const lines = exits.map(e => {
        const lock = e.locked ? ' 🔒' : '';
        return `    --${e.label}${lock}--> ${e.toName}`;
      });

      console.log(`[${loc.name}] (depth ${loc.depth})`);
      lines.forEach(line => console.log(line));
      console.log();
    }

    // Key locations
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('                    KEY LOCATIONS');
    console.log('═══════════════════════════════════════════════════════════════════════\n');

    const startLoc = world.locations[world.startId];
    const goalLoc = world.locations[world.goalId];
    console.log(`  🏠 START: ${startLoc?.name ?? world.startId}`);
    console.log(`  🎯 GOAL:  ${goalLoc?.name ?? world.goalId} (depth ${goalLoc?.depth ?? '?'})\n`);

    // Keys and locked doors
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('                    KEYS & LOCKED DOORS');
    console.log('═══════════════════════════════════════════════════════════════════════\n');

    const keys = Object.values(world.items).filter(item => item.tags.includes('key'));
    if (keys.length > 0) {
      for (const key of keys) {
        let keyLoc = 'unknown';
        for (const loc of Object.values(world.locations)) {
          if (loc.items.includes(key.id)) {
            keyLoc = `${loc.name} (depth ${loc.depth})`;
            break;
          }
        }

        let unlocks = 'unknown';
        for (const exit of Object.values(world.exits)) {
          if (exit.requirement?.value === key.id) {
            const from = world.locations[exit.from];
            const to = world.locations[exit.to];
            unlocks = `${from?.name ?? exit.from} <--> ${to?.name ?? exit.to}`;
            break;
          }
        }

        console.log(`  🔑 ${key.name}`);
        console.log(`     Found at: ${keyLoc}`);
        console.log(`     Unlocks: ${unlocks}\n`);
      }
    } else {
      console.log('  No locked doors in this world seed.\n');
    }

    // Always pass - this test is just for visualization
    expect(true).toBe(true);
  });
});
