/**
 * Town layout validation tests.
 *
 * These tests ensure that the static town locations and travel paths
 * remain consistent and prevent accidental layout changes.
 */

import { describe, it, expect } from 'vitest';
import {
  EASTHOLLOW_LOCATIONS,
  EASTHOLLOW_EXITS,
  EASTHOLLOW_ADJACENCY,
  EASTHOLLOW_NPCS,
  TOWN_INN,
  TOWN_SQUARE,
  TOWN_TRAINING,
  TOWN_MARKET,
  TOWN_BLACKSMITH,
  TOWN_ALCHEMIST,
  TOWN_GENERAL,
  TOWN_GATE,
  TOWN_TEMPLE,
  TOWN_EAST_ROAD,
} from '@solo-mud/shared';

describe('Town Layout Validation', () => {
  describe('Required Locations', () => {
    const requiredLocations = [
      { id: TOWN_INN, name: 'The Rusty Blade Inn' },
      { id: TOWN_SQUARE, name: 'Town Square' },
      { id: TOWN_TRAINING, name: 'Training Yard' },
      { id: TOWN_MARKET, name: 'Market Street' },
      { id: TOWN_BLACKSMITH, name: 'The Iron Anvil' },
      { id: TOWN_ALCHEMIST, name: "Elwin's Remedies" },
      { id: TOWN_GENERAL, name: "Thom's Supplies" },
      { id: TOWN_GATE, name: 'Town Gate' },
      { id: TOWN_TEMPLE, name: 'Temple of the Light' },
      { id: TOWN_EAST_ROAD, name: 'Eastern Road' },
    ];

    it('should have all required town locations', () => {
      for (const { id, name } of requiredLocations) {
        expect(EASTHOLLOW_LOCATIONS[id], `Missing location: ${id}`).toBeDefined();
        expect(EASTHOLLOW_LOCATIONS[id]?.name).toBe(name);
      }
    });

    it('should have exactly 10 town locations', () => {
      expect(Object.keys(EASTHOLLOW_LOCATIONS).length).toBe(10);
    });

    it('all locations should be safe zones', () => {
      for (const loc of Object.values(EASTHOLLOW_LOCATIONS)) {
        expect(loc.isSafeZone, `${loc.id} should be a safe zone`).toBe(true);
      }
    });

    it('temple should be the respawn point', () => {
      expect(EASTHOLLOW_LOCATIONS[TOWN_TEMPLE]?.isRespawnPoint).toBe(true);
    });
  });

  describe('Town Layout Structure', () => {
    /**
     * Expected town layout (from CLAUDE.md):
     *
     *                               [Northern Alley] ─down─> SEWER
     *                                      │
     *                                    south
     *                                      │
     *                               [Training Yard]
     *                                      │
     *                                    south
     *                                      │
     * [Wilderness] <─w─ [Outside Walls] <─e─ [Town Gate] <─e─ [TOWN SQUARE] ─e─> [Eastern Road]
     *                                     (guards)                 │                  │
     *                                                            south           n/  \s
     *                                                              │            /     \
     *                                                       [Market Street]   [Inn]  [Temple]
     *                                                        /    │    \      spawn  respawn
     *                                                       w     s     e
     *                                                       │     │     │
     *                                                [Smith][General][Alchemist]
     */

    it('Town Square should connect to Gate (west), Training (north), Market (south), East Road (east)', () => {
      const exits = EASTHOLLOW_ADJACENCY[TOWN_SQUARE] ?? [];
      const exitData = exits.map(id => EASTHOLLOW_EXITS[id]).filter(Boolean);

      const directions = exitData.map(e => e!.label).sort();
      expect(directions).toContain('north');
      expect(directions).toContain('south');
      expect(directions).toContain('east');
      expect(directions).toContain('west');

      // Verify destinations
      const destinations = exitData.map(e => e!.to);
      expect(destinations).toContain(TOWN_TRAINING);
      expect(destinations).toContain(TOWN_MARKET);
      expect(destinations).toContain(TOWN_EAST_ROAD);
      expect(destinations).toContain(TOWN_GATE);
    });

    it('Eastern Road should connect to Square (west), Inn (north), Temple (south)', () => {
      const exits = EASTHOLLOW_ADJACENCY[TOWN_EAST_ROAD] ?? [];
      const exitData = exits.map(id => EASTHOLLOW_EXITS[id]).filter(Boolean);

      const destinations = exitData.map(e => e!.to);
      expect(destinations).toContain(TOWN_SQUARE);
      expect(destinations).toContain(TOWN_INN);
      expect(destinations).toContain(TOWN_TEMPLE);
    });

    it('Inn should be accessible via Eastern Road, not directly from Town Square', () => {
      // Inn should only connect to Eastern Road
      const innExits = EASTHOLLOW_ADJACENCY[TOWN_INN] ?? [];
      const innExitData = innExits.map(id => EASTHOLLOW_EXITS[id]).filter(Boolean);

      expect(innExitData.length).toBe(1);
      expect(innExitData[0]?.to).toBe(TOWN_EAST_ROAD);
      expect(innExitData[0]?.label).toBe('out');

      // Verify Town Square does NOT have a direct exit to Inn
      const squareExits = EASTHOLLOW_ADJACENCY[TOWN_SQUARE] ?? [];
      const squareDestinations = squareExits.map(id => EASTHOLLOW_EXITS[id]?.to);
      expect(squareDestinations).not.toContain(TOWN_INN);
    });

    it('Temple should be accessible via Eastern Road', () => {
      const templeExits = EASTHOLLOW_ADJACENCY[TOWN_TEMPLE] ?? [];
      const templeExitData = templeExits.map(id => EASTHOLLOW_EXITS[id]).filter(Boolean);

      expect(templeExitData.length).toBe(1);
      expect(templeExitData[0]?.to).toBe(TOWN_EAST_ROAD);
      expect(templeExitData[0]?.label).toBe('out');
    });

    it('Market Street should connect to Square, Blacksmith, Alchemist', () => {
      const exits = EASTHOLLOW_ADJACENCY[TOWN_MARKET] ?? [];
      const destinations = exits.map(id => EASTHOLLOW_EXITS[id]?.to);

      expect(destinations).toContain(TOWN_SQUARE);
      expect(destinations).toContain(TOWN_BLACKSMITH);
      expect(destinations).toContain(TOWN_ALCHEMIST);
    });

    it('General Store should connect to both Blacksmith and Alchemist', () => {
      const exits = EASTHOLLOW_ADJACENCY[TOWN_GENERAL] ?? [];
      const destinations = exits.map(id => EASTHOLLOW_EXITS[id]?.to);

      expect(destinations).toContain(TOWN_BLACKSMITH);
      expect(destinations).toContain(TOWN_ALCHEMIST);
    });
  });

  describe('Exit Consistency', () => {
    it('all exits in adjacency should be defined', () => {
      for (const [locId, exitIds] of Object.entries(EASTHOLLOW_ADJACENCY)) {
        for (const exitId of exitIds) {
          expect(EASTHOLLOW_EXITS[exitId], `Exit ${exitId} from ${locId} is not defined`).toBeDefined();
        }
      }
    });

    it('all exits should have valid from/to locations', () => {
      for (const [exitId, exit] of Object.entries(EASTHOLLOW_EXITS)) {
        expect(EASTHOLLOW_LOCATIONS[exit.from], `Exit ${exitId} has invalid 'from' location: ${exit.from}`).toBeDefined();
        expect(EASTHOLLOW_LOCATIONS[exit.to], `Exit ${exitId} has invalid 'to' location: ${exit.to}`).toBeDefined();
      }
    });

    it('bidirectional exits should exist for all connections', () => {
      // For each exit A->B, there should be a return exit B->A
      for (const [exitId, exit] of Object.entries(EASTHOLLOW_EXITS)) {
        const returnExits = Object.values(EASTHOLLOW_EXITS).filter(
          e => e.from === exit.to && e.to === exit.from
        );
        expect(returnExits.length, `No return exit from ${exit.to} to ${exit.from}`).toBeGreaterThan(0);
      }
    });
  });

  describe('NPC Placement', () => {
    const requiredNPCs = [
      { id: 'npc_mira', location: TOWN_INN },
      { id: 'npc_marcus', location: TOWN_GATE },
      { id: 'npc_holt', location: TOWN_TRAINING },
      { id: 'npc_sera', location: TOWN_TRAINING },
      { id: 'npc_shadow', location: TOWN_TRAINING },
      { id: 'npc_thom', location: TOWN_GENERAL },
      { id: 'npc_kira', location: TOWN_BLACKSMITH },
      { id: 'npc_elwin', location: TOWN_ALCHEMIST },
      { id: 'npc_giles', location: TOWN_SQUARE },
      { id: 'npc_pete', location: TOWN_SQUARE },
      { id: 'npc_priestess_anna', location: TOWN_TEMPLE },
    ];

    it('should have all required NPCs', () => {
      for (const { id, location } of requiredNPCs) {
        expect(EASTHOLLOW_NPCS[id], `Missing NPC: ${id}`).toBeDefined();
        expect(EASTHOLLOW_NPCS[id]?.locationId, `NPC ${id} should be at ${location}`).toBe(location);
      }
    });

    it('each location should reference NPCs that exist', () => {
      for (const loc of Object.values(EASTHOLLOW_LOCATIONS)) {
        if (loc.npcs) {
          for (const npcId of loc.npcs) {
            expect(EASTHOLLOW_NPCS[npcId], `Location ${loc.id} references non-existent NPC: ${npcId}`).toBeDefined();
          }
        }
      }
    });

    it('NPC locations should match location NPC lists', () => {
      for (const npc of Object.values(EASTHOLLOW_NPCS)) {
        const location = EASTHOLLOW_LOCATIONS[npc.locationId];
        expect(location, `NPC ${npc.id} references non-existent location: ${npc.locationId}`).toBeDefined();
        expect(location?.npcs, `Location ${npc.locationId} has no NPC list`).toBeDefined();
        expect(location?.npcs, `Location ${npc.locationId} does not list NPC ${npc.id}`).toContain(npc.id);
      }
    });
  });

  describe('Spawn Points', () => {
    it('Inn should be the player spawn point (start location)', () => {
      // The Inn is exported as TOWN_INN and should be the start location
      expect(TOWN_INN).toBe('town_inn');
    });

    it('Temple should be the respawn point (death location)', () => {
      const temple = EASTHOLLOW_LOCATIONS[TOWN_TEMPLE];
      expect(temple?.isRespawnPoint).toBe(true);
    });
  });
});
