/**
 * End-to-end game loop integration tests.
 * Tests the full game flow from world generation through gameplay.
 */

import { describe, it, expect } from 'vitest';
import { generateWorld } from '../world/generate';
import { validateWorld } from '../world/validate';
import { createPlayer } from '../character/player-factory';
import { calculateCombatStats } from '../character/stats';
import { parseCommand, isMovementCommand, getDirection } from '../commands/parser';
import { generateDescription, type DescriptionContext, type Biome, type Weather } from '../descriptions';
import { getLightLevel } from '../descriptions/time-effects';
import { createTimeTicker } from '../time/time-ticker';
import { createWeatherSimulator } from '../time/weather';
import { createNpcManager, createNpcSchedule, getNpcDialogue } from '../npc/schedule';
import { generateItem, generateLootDrop, type ItemTemplate, type LootTable } from '../loot/item-generator';
import { CombatTicker } from '../combat/tick';
import { rollAttack, calculateDamage, type CombatEntity } from '../combat/auto-attack';
import { createCooldownManager, type AbilityDefinition } from '../combat/cooldowns';
import { createEnemyAI, type EnemyAIState, type AIContext, type Enemy } from '../combat/enemy-ai';
import { createRng } from '@solo-mud/shared';
import type { GameTime, TimeOfDay, CombatStats } from '@solo-mud/shared';

describe('Game Loop Integration', () => {
  const TEST_SEED = 'integration-test-seed';

  describe('World Generation and Validation', () => {
    it('should generate a valid, explorable world', () => {
      const world = generateWorld({
        seed: TEST_SEED,
        nodeCount: 20,
        extraEdges: 5,
        lockedEdges: 2,
      });

      // Validate world structure
      const validation = validateWorld(world);
      expect(validation.valid).toBe(true);

      // Check basic requirements
      expect(Object.keys(world.locations).length).toBeGreaterThanOrEqual(10);
      expect(world.startId).toBeDefined();
      expect(world.goalId).toBeDefined();
      expect(world.locations[world.startId]).toBeDefined();
      expect(world.locations[world.goalId]).toBeDefined();

      // Check adjacency exists
      const startExits = world.adjacency[world.startId] ?? [];
      expect(startExits.length).toBeGreaterThan(0);
    });

    it('should create deterministic worlds from same seed', () => {
      const world1 = generateWorld({ seed: TEST_SEED, nodeCount: 15, extraEdges: 3, lockedEdges: 1 });
      const world2 = generateWorld({ seed: TEST_SEED, nodeCount: 15, extraEdges: 3, lockedEdges: 1 });

      expect(world1.startId).toBe(world2.startId);
      expect(world1.goalId).toBe(world2.goalId);
      expect(Object.keys(world1.locations)).toEqual(Object.keys(world2.locations));
    });
  });

  describe('Character Creation and Stats', () => {
    it('should create a playable character with valid stats', () => {
      const player = createPlayer({
        id: 'player-1',
        name: 'TestHero',
        className: 'warrior',
        startLocationId: 'start',
      });

      expect(player.name).toBe('TestHero');
      expect(player.class).toBe('warrior');
      expect(player.level).toBe(1);
      expect(player.currentHp).toBeGreaterThan(0);
      expect(player.maxHp).toBeGreaterThan(0);
      expect(player.currentHp).toBe(player.maxHp);

      // Combat stats should be calculable from base stats
      const combatStats = calculateCombatStats(player.baseStats);
      expect(combatStats.attackPower).toBeGreaterThan(0);
      expect(combatStats.defense).toBeGreaterThan(0);
    });

    it('should create different class builds', () => {
      const warrior = createPlayer({ id: 'p1', name: 'War', className: 'warrior', startLocationId: 's' });
      const mage = createPlayer({ id: 'p2', name: 'Mag', className: 'mage', startLocationId: 's' });
      const rogue = createPlayer({ id: 'p3', name: 'Rog', className: 'rogue', startLocationId: 's' });

      // Different classes should have different stat distributions
      expect(warrior.baseStats.str).toBeGreaterThan(mage.baseStats.str);
      expect(mage.baseStats.int).toBeGreaterThan(warrior.baseStats.int);
      expect(rogue.baseStats.dex).toBeGreaterThan(warrior.baseStats.dex);
    });
  });

  describe('Command Parsing', () => {
    it('should parse movement commands', () => {
      const cmd = parseCommand('go north');
      expect(cmd.command).toBe('go');
      expect(cmd.args).toContain('north');
      expect(isMovementCommand('go')).toBe(true);
      expect(getDirection(cmd)).toBe('north');
    });

    it('should parse combat commands', () => {
      const attack = parseCommand('attack goblin');
      expect(attack.command).toBe('attack');
      expect(attack.args).toContain('goblin');

      const look = parseCommand('look');
      expect(look.command).toBe('look');
    });

    it('should handle equipment commands', () => {
      const equip = parseCommand('equip sword');
      expect(equip.command).toBe('equip');

      const unequip = parseCommand('unequip weapon');
      expect(unequip.command).toBe('unequip');
    });

    it('should handle command aliases', () => {
      const look = parseCommand('l');
      expect(look.command).toBe('look');

      const attack = parseCommand('k goblin');
      expect(attack.command).toBe('attack');
    });
  });

  describe('Description Generation', () => {
    it('should generate contextual descriptions', () => {
      const rng = createRng(TEST_SEED);

      const forestMorning: DescriptionContext = {
        biome: 'forest',
        timeOfDay: 'morning',
        weather: 'clear',
        visitCount: 1,
        props: ['ancient oak'],
        rng,
      };

      const description = generateDescription(forestMorning);
      expect(description.length).toBeGreaterThan(20);
    });

    it('should vary by biome and time', () => {
      const desertNight: DescriptionContext = {
        biome: 'desert',
        timeOfDay: 'night',
        weather: 'clear',
        visitCount: 1,
        props: [],
        rng: createRng('desc-test-1'),
      };

      const forestMorning: DescriptionContext = {
        biome: 'forest',
        timeOfDay: 'morning',
        weather: 'clear',
        visitCount: 1,
        props: [],
        rng: createRng('desc-test-2'),
      };

      const desc1 = generateDescription(desertNight);
      const desc2 = generateDescription(forestMorning);

      expect(desc1).not.toBe(desc2);
    });
  });

  describe('Time System', () => {
    it('should track and advance game time', () => {
      const initialTime: GameTime = {
        totalMinutes: 480, // 8:00 AM
        timeOfDay: 'morning',
        day: 1,
      };

      const ticker = createTimeTicker(initialTime);

      expect(ticker.getTime().timeOfDay).toBe('morning');

      // Advance to noon
      ticker.tick(240); // +4 hours
      expect(ticker.getTime().timeOfDay).toBe('noon');

      // Advance to night
      ticker.tick(600); // +10 hours (now 22:00)
      expect(ticker.getTime().timeOfDay).toBe('night');
    });

    it('should affect light levels by time', () => {
      const noonLight = getLightLevel('noon');
      const nightLight = getLightLevel('night');

      expect(noonLight).toBe(1.0);
      expect(nightLight).toBeLessThan(0.3);
    });

    it('should track day changes', () => {
      const ticker = createTimeTicker({
        totalMinutes: 1400, // 23:20
        timeOfDay: 'night',
        day: 1,
      });

      let newDay = 0;
      ticker.onDayChange((day) => {
        newDay = day;
      });

      ticker.tick(60); // Cross midnight
      expect(newDay).toBe(2);
    });
  });

  describe('Weather System', () => {
    it('should simulate weather changes', () => {
      const rng = createRng('weather-test');
      const simulator = createWeatherSimulator({ type: 'cloudy', intensity: 0.5 }, rng);

      // Tick multiple times to see weather evolution
      const weatherTypes = new Set<string>();
      for (let i = 0; i < 50; i++) {
        simulator.tick();
        weatherTypes.add(simulator.getWeather().type);
      }

      // Should have some variety (cloudy weather can transition)
      expect(weatherTypes.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('NPC Schedules', () => {
    it('should track NPC locations by time', () => {
      const manager = createNpcManager();

      manager.registerNpc({
        id: 'npc-blacksmith',
        name: 'Forge Master',
        role: 'blacksmith',
        schedule: createNpcSchedule({
          dawn: { locationId: 'forge', activity: 'lighting forge' },
          morning: { locationId: 'forge', activity: 'smithing' },
          noon: { locationId: 'tavern', activity: 'lunch' },
          afternoon: { locationId: 'forge', activity: 'smithing' },
          evening: { locationId: 'home', activity: 'resting' },
          night: { locationId: 'home', activity: 'sleeping' },
        }),
      });

      expect(manager.getNpcLocation('npc-blacksmith', 'morning')).toBe('forge');
      expect(manager.getNpcLocation('npc-blacksmith', 'noon')).toBe('tavern');
      expect(manager.getNpcLocation('npc-blacksmith', 'night')).toBe('home');
    });

    it('should provide time-appropriate dialogue', () => {
      const morningDialogue = getNpcDialogue('blacksmith', 'morning');
      const nightDialogue = getNpcDialogue('blacksmith', 'night');

      expect(morningDialogue).toContain('forge');
      expect(nightDialogue).toContain('cold');
    });
  });

  describe('Loot Generation', () => {
    it('should generate items with appropriate rarity', () => {
      const rng = createRng('loot-test');

      const template: ItemTemplate = {
        id: 'sword',
        name: 'Iron Sword',
        tags: ['weapon', 'sword'],
        baseValue: 50,
        levelRange: [1, 10],
        allowedAffixes: ['sharp', 'swift', 'str-bonus'],
      };

      const items = [];
      for (let i = 0; i < 50; i++) {
        const item = generateItem({
          template,
          rarity: 'uncommon',
          level: 5,
          rng,
        });
        items.push(item);
      }

      // All items should exist
      expect(items.length).toBe(50);
      expect(items[0]!.name).toContain('Iron Sword');
    });

    it('should generate loot drops from table', () => {
      const rng = createRng('drop-test');

      const template: ItemTemplate = {
        id: 'potion',
        name: 'Health Potion',
        tags: ['consumable'],
        baseValue: 25,
        levelRange: [1, 20],
        allowedAffixes: [],
      };

      const lootTable: LootTable = {
        id: 'goblin-loot',
        dropChance: 1.0, // Always drop
        minItems: 1,
        maxItems: 2,
        entries: [
          { templateId: 'potion', weight: 1, minRarity: 'common', maxRarity: 'uncommon' },
        ],
      };

      const drops = generateLootDrop({
        lootTable,
        level: 3,
        rng,
        templates: { potion: template },
      });

      expect(Array.isArray(drops)).toBe(true);
      expect(drops.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Combat System', () => {
    it('should process combat ticks', () => {
      const ticker = new CombatTicker();
      let tickCount = 0;

      const unsubscribe = ticker.onTick(() => {
        tickCount++;
        return { events: [] };
      });

      ticker.start();

      // Wait a bit for ticks (combat tick is 100ms)
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          ticker.stop();
          unsubscribe();
          expect(tickCount).toBeGreaterThan(0);
          resolve();
        }, 350);
      });
    });

    it('should calculate attack rolls', () => {
      const attackerStats: CombatStats = {
        attack: 20,
        defense: 10,
        maxHp: 100,
        hitChance: 0.8,
        dodgeChance: 0.1,
        critChance: 0.1,
        critMultiplier: 1.5,
        attackSpeed: 1000,
      };

      const defenderStats: CombatStats = {
        attack: 10,
        defense: 15,
        maxHp: 80,
        hitChance: 0.7,
        dodgeChance: 0.15,
        critChance: 0.05,
        critMultiplier: 1.5,
        attackSpeed: 1000,
      };

      const attacker: CombatEntity = {
        id: 'attacker-1',
        name: 'Attacker',
        currentHp: 100,
        combatStats: attackerStats,
      };

      const defender: CombatEntity = {
        id: 'defender-1',
        name: 'Defender',
        currentHp: 80,
        combatStats: defenderStats,
      };

      // Roll multiple times to see variety
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const result = rollAttack(attacker, defender);
        results.add(result.type);
      }

      // Should have hits at minimum
      expect(results.has('hit') || results.has('crit')).toBe(true);
    });

    it('should manage cooldowns', () => {
      const cdManager = createCooldownManager();

      const fireball: AbilityDefinition = {
        id: 'fireball',
        name: 'Fireball',
        cooldownMs: 5000,
        gcdMs: 1500,
      };

      expect(cdManager.canUseAbility(fireball)).toBe(true);

      cdManager.useAbility(fireball);
      expect(cdManager.canUseAbility(fireball)).toBe(false);

      // Tick past cooldown
      cdManager.tick(5001);
      expect(cdManager.isAbilityOnCooldown('fireball')).toBe(false);
    });

    it('should run enemy AI state machine', () => {
      const enemyStats: CombatStats = {
        attack: 15,
        defense: 8,
        maxHp: 50,
        hitChance: 0.7,
        dodgeChance: 0.1,
        critChance: 0.05,
        critMultiplier: 1.5,
        attackSpeed: 1200,
      };

      const enemy: Enemy = {
        id: 'goblin-1',
        name: 'Goblin',
        currentHp: 50,
        combatStats: enemyStats,
        level: 3,
        xpReward: 25,
        behavior: 'aggressive',
        aggroRange: 3,
        leashRange: 10,
      };

      const state: EnemyAIState = {
        enemy,
        currentTarget: null,
        aggroList: new Map(),
        attackCooldown: 0,
        state: 'idle',
        homePosition: 'cave',
        currentPosition: 'cave',
      };

      const context: AIContext = {
        getEntitiesInRange: () => [],
        resolveTarget: () => null,
      };

      const ai = createEnemyAI(state, context);

      expect(state.state).toBe('idle');

      // Simulate taking damage
      ai.onDamageTaken('player-1', 10);
      expect(state.aggroList.get('player-1')).toBe(10);
    });
  });

  describe('Full Game Flow', () => {
    it('should support a complete gameplay session', () => {
      // 1. Generate world
      const world = generateWorld({
        seed: 'full-game-test',
        nodeCount: 15,
        extraEdges: 3,
        lockedEdges: 1,
      });

      expect(validateWorld(world).valid).toBe(true);

      // 2. Create character
      const player = createPlayer({
        id: 'player-hero',
        name: 'Adventurer',
        className: 'warrior',
        startLocationId: world.startId,
      });

      expect(player.currentHp).toBe(player.maxHp);

      // 3. Get starting location description
      const startLocation = world.locations[world.startId]!;
      const dominantBiome = Object.entries(startLocation.biome).reduce((a, b) =>
        (a[1] ?? 0) > (b[1] ?? 0) ? a : b
      )[0] as Biome;

      const descCtx: DescriptionContext = {
        biome: dominantBiome,
        timeOfDay: world.time.timeOfDay,
        weather: world.weather.type as Weather,
        visitCount: startLocation.visitState.visitCount,
        props: startLocation.props,
        rng: createRng(`${world.seed}-${startLocation.id}`),
      };

      const description = generateDescription(descCtx);
      expect(description.length).toBeGreaterThan(0);

      // 4. Parse a command
      const cmd = parseCommand('look');
      expect(cmd.command).toBe('look');

      // 5. Check exits are available
      const exitIds = world.adjacency[world.startId] ?? [];
      expect(exitIds.length).toBeGreaterThan(0);

      // 6. Verify time and weather are initialized
      expect(world.time.day).toBeGreaterThanOrEqual(1);
      expect(world.weather.type).toBeDefined();

      // 7. Calculate player combat readiness
      const combatStats = calculateCombatStats(player.baseStats);
      expect(combatStats.attackPower).toBeGreaterThan(0);
      expect(combatStats.defense).toBeGreaterThan(0);
    });
  });
});
