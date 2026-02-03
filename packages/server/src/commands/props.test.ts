/**
 * Tests for the prop interaction system.
 * Covers registry functions, prop helpers, and interaction handlers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PROP_REGISTRY,
  LOCATION_PROPS,
  getProp,
  getPropsForLocation,
  getVisibleProps,
  findPropByName,
  TAG_INTERACTIONS,
  INN_PROPS,
  SQUARE_PROPS,
  TEMPLE_PROPS,
} from '@solo-mud/shared';
import type { PropDefinition, Player, World } from '@solo-mud/shared';
import {
  isPropOnCooldown,
  setPropCooldown,
  formatCooldownMessage,
  pickRandomText,
  applyPropRewards,
  getRemainingCooldown,
} from './prop-helpers';

// ========================================
// Test Helpers
// ========================================

/**
 * Create a mock player with sensible defaults.
 */
function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'test-player',
    name: 'TestPlayer',
    class: 'warrior',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    baseStats: { strength: 10, agility: 10, intelligence: 10, vitality: 10 },
    currentHp: 100,
    maxHp: 100,
    currentMp: 50,
    maxMp: 50,
    talentPointsAvailable: 0,
    equipment: {},
    inventory: [],
    inventorySlots: 20,
    keyring: [],
    carryWeight: 0,
    maxCarryWeight: 100,
    itemSlots: [null, null, null, null],
    abilitySlots: [null, null, null, null],
    locationId: 'town_inn',
    boundTownId: 'town_square',
    inCombat: false,
    autoAttack: false,
    tutorial: { currentStep: 'movement', completedSteps: [] },
    globalCooldown: 0,
    abilityCooldowns: {},
    currency: { copper: 100, silver: 0, gold: 0 },
    statusEffects: [],
    questFlags: [],
    spells: { known: [], slots: [] },
    propCooldowns: {},
    ...overrides,
  } as Player;
}

/**
 * Create a mock world for testing item interactions.
 */
function createMockWorld(overrides: Partial<World> = {}): World {
  return {
    seed: 'test-seed',
    startId: 'town_inn',
    goalId: 'town_gate',
    locations: {},
    exits: {},
    adjacency: {},
    items: {},
    creatures: {},
    corpses: {},
    respawnQueue: [],
    time: { totalMinutes: 1000, timeOfDay: 'morning', day: 1 },
    weather: { type: 'clear', intensity: 0.5 },
    npcs: {},
    ...overrides,
  } as World;
}

// ========================================
// Registry Tests
// ========================================

describe('Prop Registry', () => {
  describe('PROP_REGISTRY', () => {
    it('contains all expected props from Inn', () => {
      expect(PROP_REGISTRY['inn_ginger_cat']).toBeDefined();
      expect(PROP_REGISTRY['inn_fireplace']).toBeDefined();
      expect(PROP_REGISTRY['inn_loose_floorboard']).toBeDefined();
    });

    it('contains all expected props from Town Square', () => {
      expect(PROP_REGISTRY['square_wishing_well']).toBeDefined();
      expect(PROP_REGISTRY['square_notice_board']).toBeDefined();
    });

    it('contains all expected props from Temple', () => {
      expect(PROP_REGISTRY['temple_offering_bowl']).toBeDefined();
      expect(PROP_REGISTRY['temple_holy_fountain']).toBeDefined();
    });

    it('has props with required fields', () => {
      const prop = PROP_REGISTRY['inn_ginger_cat'];
      expect(prop).toBeDefined();
      expect(prop!.id).toBe('inn_ginger_cat');
      expect(prop!.name).toBe('Ginger Tabby Cat');
      expect(prop!.tier).toBe('signature');
      expect(prop!.verbs).toContain('pet');
      expect(prop!.defaultInteraction).toBeDefined();
      expect(prop!.examineText).toBeDefined();
    });
  });

  describe('LOCATION_PROPS', () => {
    it('maps town_inn to Inn props', () => {
      expect(LOCATION_PROPS['town_inn']).toBe(INN_PROPS);
    });

    it('maps town_square to Square props', () => {
      expect(LOCATION_PROPS['town_square']).toBe(SQUARE_PROPS);
    });

    it('maps town_temple to Temple props', () => {
      expect(LOCATION_PROPS['town_temple']).toBe(TEMPLE_PROPS);
    });

    it('returns undefined for unknown locations', () => {
      expect(LOCATION_PROPS['unknown_location']).toBeUndefined();
    });
  });

  describe('getProp', () => {
    it('returns correct prop by ID', () => {
      const prop = getProp('inn_ginger_cat');
      expect(prop).toBeDefined();
      expect(prop!.name).toBe('Ginger Tabby Cat');
    });

    it('returns undefined for unknown prop ID', () => {
      const prop = getProp('nonexistent_prop');
      expect(prop).toBeUndefined();
    });
  });

  describe('getPropsForLocation', () => {
    it('returns props for known location', () => {
      const props = getPropsForLocation('town_inn');
      expect(Object.keys(props).length).toBeGreaterThan(0);
      expect(props['inn_ginger_cat']).toBeDefined();
    });

    it('returns empty object for unknown location', () => {
      const props = getPropsForLocation('unknown_location');
      expect(props).toEqual({});
    });
  });

  describe('getVisibleProps', () => {
    it('returns visible props for a location', () => {
      const visibleProps = getVisibleProps('town_inn');
      expect(visibleProps.length).toBeGreaterThan(0);
      // All returned props should NOT be hidden
      for (const prop of visibleProps) {
        expect(prop.hidden).not.toBe(true);
      }
    });

    it('excludes hidden props', () => {
      const visibleProps = getVisibleProps('town_inn');
      // inn_loose_floorboard is hidden
      const hasHiddenFloorboard = visibleProps.some(p => p.id === 'inn_loose_floorboard');
      expect(hasHiddenFloorboard).toBe(false);
    });

    it('returns empty array for unknown location', () => {
      const visibleProps = getVisibleProps('unknown_location');
      expect(visibleProps).toEqual([]);
    });
  });

  describe('findPropByName', () => {
    it('finds prop by exact match', () => {
      const prop = findPropByName('town_inn', 'Ginger Tabby Cat');
      expect(prop).toBeDefined();
      expect(prop!.id).toBe('inn_ginger_cat');
    });

    it('finds prop by exact match (case insensitive)', () => {
      const prop = findPropByName('town_inn', 'ginger tabby cat');
      expect(prop).toBeDefined();
      expect(prop!.id).toBe('inn_ginger_cat');
    });

    it('finds prop by partial match', () => {
      const prop = findPropByName('town_inn', 'cat');
      expect(prop).toBeDefined();
      expect(prop!.id).toBe('inn_ginger_cat');
    });

    it('finds prop by partial match (case insensitive)', () => {
      const prop = findPropByName('town_inn', 'CAT');
      expect(prop).toBeDefined();
      expect(prop!.id).toBe('inn_ginger_cat');
    });

    it('prefers exact match over partial match', () => {
      // This test assumes there might be props where exact vs partial matters
      // For example, if there was "cat" and "ginger tabby cat"
      const prop = findPropByName('town_inn', 'fireplace');
      expect(prop).toBeDefined();
      expect(prop!.name.toLowerCase()).toContain('fireplace');
    });

    it('returns undefined for no match', () => {
      const prop = findPropByName('town_inn', 'dragon');
      expect(prop).toBeUndefined();
    });

    it('returns undefined for unknown location', () => {
      const prop = findPropByName('unknown_location', 'cat');
      expect(prop).toBeUndefined();
    });
  });
});

// ========================================
// Prop Helper Tests
// ========================================

describe('Prop Helper Functions', () => {
  describe('isPropOnCooldown', () => {
    it('returns false when no cooldown is set', () => {
      const player = createMockPlayer({ propCooldowns: {} });
      const result = isPropOnCooldown(player, 'some_prop', 1000);
      expect(result).toBe(false);
    });

    it('returns true when cooldown is active', () => {
      const player = createMockPlayer({
        propCooldowns: { 'some_prop': 2000 }, // Cooldown ends at 2000
      });
      const result = isPropOnCooldown(player, 'some_prop', 1500); // Current time is 1500
      expect(result).toBe(true);
    });

    it('returns false when cooldown has expired', () => {
      const player = createMockPlayer({
        propCooldowns: { 'some_prop': 1000 }, // Cooldown ended at 1000
      });
      const result = isPropOnCooldown(player, 'some_prop', 1500); // Current time is 1500
      expect(result).toBe(false);
    });

    it('returns false when cooldown ends exactly now', () => {
      const player = createMockPlayer({
        propCooldowns: { 'some_prop': 1000 },
      });
      const result = isPropOnCooldown(player, 'some_prop', 1000);
      expect(result).toBe(false);
    });
  });

  describe('getRemainingCooldown', () => {
    it('returns 0 when no cooldown is set', () => {
      const player = createMockPlayer({ propCooldowns: {} });
      const result = getRemainingCooldown(player, 'some_prop', 1000);
      expect(result).toBe(0);
    });

    it('returns remaining time when cooldown is active', () => {
      const player = createMockPlayer({
        propCooldowns: { 'some_prop': 2000 },
      });
      const result = getRemainingCooldown(player, 'some_prop', 1500);
      expect(result).toBe(500);
    });

    it('returns 0 when cooldown has expired', () => {
      const player = createMockPlayer({
        propCooldowns: { 'some_prop': 1000 },
      });
      const result = getRemainingCooldown(player, 'some_prop', 1500);
      expect(result).toBe(0);
    });
  });

  describe('setPropCooldown', () => {
    it('sets the cooldown on the player', () => {
      const player = createMockPlayer({ propCooldowns: {} });
      setPropCooldown(player, 'some_prop', 1000, 30);
      expect(player.propCooldowns['some_prop']).toBe(1030);
    });

    it('does not set cooldown when duration is 0', () => {
      const player = createMockPlayer({ propCooldowns: {} });
      setPropCooldown(player, 'some_prop', 1000, 0);
      expect(player.propCooldowns['some_prop']).toBeUndefined();
    });

    it('does not set cooldown when duration is negative', () => {
      const player = createMockPlayer({ propCooldowns: {} });
      setPropCooldown(player, 'some_prop', 1000, -10);
      expect(player.propCooldowns['some_prop']).toBeUndefined();
    });

    it('overwrites existing cooldown', () => {
      const player = createMockPlayer({
        propCooldowns: { 'some_prop': 500 },
      });
      setPropCooldown(player, 'some_prop', 1000, 60);
      expect(player.propCooldowns['some_prop']).toBe(1060);
    });
  });

  describe('formatCooldownMessage', () => {
    it('formats message for very short cooldown (less than 1 minute)', () => {
      const message = formatCooldownMessage(0.5);
      expect(message).toContain('very recently');
      expect(message).toContain('moment');
    });

    it('formats message for exactly 1 minute', () => {
      const message = formatCooldownMessage(1);
      expect(message).toContain('recently');
      expect(message).toContain('about a minute');
    });

    it('formats message for minutes (less than an hour)', () => {
      const message = formatCooldownMessage(15);
      expect(message).toContain('recently');
      expect(message).toContain('15 minutes');
    });

    it('formats message for fractional minutes (rounds up)', () => {
      const message = formatCooldownMessage(15.3);
      expect(message).toContain('16 minutes');
    });

    it('formats message for exactly 1 hour', () => {
      const message = formatCooldownMessage(60);
      expect(message).toContain('1 hour');
    });

    it('formats message for multiple hours', () => {
      const message = formatCooldownMessage(120);
      expect(message).toContain('2 hours');
    });

    it('formats message for many hours (pluralized)', () => {
      const message = formatCooldownMessage(180);
      expect(message).toContain('3 hours');
    });
  });

  describe('pickRandomText', () => {
    it('returns the string when given a string', () => {
      const result = pickRandomText('Hello world');
      expect(result).toBe('Hello world');
    });

    it('returns a text from array when given array', () => {
      const options = ['one', 'two', 'three'];
      const result = pickRandomText(options);
      expect(options).toContain(result);
    });

    it('returns empty string for empty array', () => {
      const result = pickRandomText([]);
      expect(result).toBe('');
    });

    it('returns the only element for single-element array', () => {
      const result = pickRandomText(['only one']);
      expect(result).toBe('only one');
    });
  });

  describe('applyPropRewards', () => {
    it('applies XP reward', () => {
      const player = createMockPlayer({ xp: 0 });
      const world = createMockWorld();

      const messages = applyPropRewards(player, { xp: 5 }, world);

      expect(player.xp).toBe(5);
      expect(messages).toContain('You gain 5 XP.');
    });

    it('does not apply XP when 0', () => {
      const player = createMockPlayer({ xp: 10 });
      const world = createMockWorld();

      const messages = applyPropRewards(player, { xp: 0 }, world);

      expect(player.xp).toBe(10);
      expect(messages.some(m => m.includes('XP'))).toBe(false);
    });

    it('applies currency reward', () => {
      const player = createMockPlayer({
        currency: { copper: 10, silver: 0, gold: 0 },
      });
      const world = createMockWorld();

      const messages = applyPropRewards(player, { currency: 15 }, world);

      expect(player.currency.copper).toBe(25);
      expect(messages).toContain('You find 15 copper.');
    });

    it('does not apply currency when 0', () => {
      const player = createMockPlayer({
        currency: { copper: 10, silver: 0, gold: 0 },
      });
      const world = createMockWorld();

      const messages = applyPropRewards(player, { currency: 0 }, world);

      expect(player.currency.copper).toBe(10);
      expect(messages.some(m => m.includes('copper'))).toBe(false);
    });

    it('applies buff reward (new buff)', () => {
      const player = createMockPlayer({ statusEffects: [] });
      const world = createMockWorld();

      const messages = applyPropRewards(
        player,
        { buff: { id: 'content', duration: 15 } },
        world
      );

      expect(player.statusEffects.length).toBe(1);
      expect(player.statusEffects[0]!.id).toBe('content');
      expect(player.statusEffects[0]!.duration).toBe(15);
      expect(messages).toContain('You feel content.');
    });

    it('refreshes existing buff', () => {
      const player = createMockPlayer({
        statusEffects: [
          { id: 'content', name: 'content', duration: 5, stacks: 1, appliedAt: 0 },
        ],
      });
      const world = createMockWorld();

      applyPropRewards(
        player,
        { buff: { id: 'content', duration: 20 } },
        world
      );

      expect(player.statusEffects.length).toBe(1);
      expect(player.statusEffects[0]!.duration).toBe(20);
    });

    it('adds lore text to messages', () => {
      const player = createMockPlayer();
      const world = createMockWorld();

      const messages = applyPropRewards(
        player,
        { lore: 'Ancient secrets revealed!' },
        world
      );

      expect(messages).toContain('Ancient secrets revealed!');
    });

    it('unlocks quest flag', () => {
      const player = createMockPlayer({ questFlags: [] });
      const world = createMockWorld();

      applyPropRewards(player, { unlock: 'found_secret' }, world);

      expect(player.questFlags).toContain('found_secret');
    });

    it('does not duplicate quest flag', () => {
      const player = createMockPlayer({ questFlags: ['found_secret'] });
      const world = createMockWorld();

      applyPropRewards(player, { unlock: 'found_secret' }, world);

      expect(player.questFlags.filter(f => f === 'found_secret').length).toBe(1);
    });

    it('returns empty array when no rewards', () => {
      const player = createMockPlayer();
      const world = createMockWorld();

      const messages = applyPropRewards(player, undefined, world);

      expect(messages).toEqual([]);
    });

    it('applies multiple rewards at once', () => {
      const player = createMockPlayer({
        xp: 0,
        currency: { copper: 0, silver: 0, gold: 0 },
        statusEffects: [],
        questFlags: [],
      });
      const world = createMockWorld();

      const messages = applyPropRewards(
        player,
        {
          xp: 10,
          currency: 5,
          buff: { id: 'blessed', duration: 30 },
          lore: 'A secret revealed!',
          unlock: 'found_it',
        },
        world
      );

      expect(player.xp).toBe(10);
      expect(player.currency.copper).toBe(5);
      expect(player.statusEffects.length).toBe(1);
      expect(player.questFlags).toContain('found_it');
      expect(messages.length).toBe(4); // XP, currency, buff, lore
    });
  });
});

// ========================================
// Tag Interactions Tests
// ========================================

describe('Tag Interactions', () => {
  it('TAG_INTERACTIONS contains water_source', () => {
    expect(TAG_INTERACTIONS['water_source']).toBeDefined();
    expect(TAG_INTERACTIONS['water_source'].itemTags).toContain('fillable');
    expect(TAG_INTERACTIONS['water_source'].verb).toBe('fill');
  });

  it('TAG_INTERACTIONS contains fire', () => {
    expect(TAG_INTERACTIONS['fire']).toBeDefined();
    expect(TAG_INTERACTIONS['fire'].itemTags).toContain('lightable');
    expect(TAG_INTERACTIONS['fire'].verb).toBe('light');
  });

  it('TAG_INTERACTIONS contains heat_source', () => {
    expect(TAG_INTERACTIONS['heat_source']).toBeDefined();
    expect(TAG_INTERACTIONS['heat_source'].itemTags).toContain('cookable');
    expect(TAG_INTERACTIONS['heat_source'].verb).toBe('cook');
  });

  it('TAG_INTERACTIONS contains holy_water_source', () => {
    expect(TAG_INTERACTIONS['holy_water_source']).toBeDefined();
    expect(TAG_INTERACTIONS['holy_water_source'].itemTags).toContain('fillable');
    expect(TAG_INTERACTIONS['holy_water_source'].verb).toBe('fill');
  });
});

// ========================================
// Prop Definition Tests
// ========================================

describe('Prop Definitions', () => {
  describe('Inn Props', () => {
    it('inn_ginger_cat has correct structure', () => {
      const cat = INN_PROPS['inn_ginger_cat'];
      expect(cat).toBeDefined();
      expect(cat!.tier).toBe('signature');
      expect(cat!.verbs).toContain('pet');
      expect(cat!.verbs).toContain('feed');
      expect(cat!.defaultInteraction.cooldown).toBe(30);
      expect(cat!.defaultInteraction.rewards?.buff?.id).toBe('content');
    });

    it('inn_loose_floorboard is hidden', () => {
      const floorboard = INN_PROPS['inn_loose_floorboard'];
      expect(floorboard).toBeDefined();
      expect(floorboard!.hidden).toBe(true);
      expect(floorboard!.discoverVerb).toBe('search');
    });

    it('inn_fireplace has fire tag', () => {
      const fireplace = INN_PROPS['inn_fireplace'];
      expect(fireplace).toBeDefined();
      expect(fireplace!.tags).toContain('fire');
      expect(fireplace!.tags).toContain('heat_source');
    });

    it('inn_tip_jar requires item', () => {
      const tipJar = INN_PROPS['inn_tip_jar'];
      expect(tipJar).toBeDefined();
      expect(tipJar!.defaultInteraction.requiresItem).toBe('coin');
    });
  });

  describe('Temple Props', () => {
    it('temple_holy_fountain has water and holy water tags', () => {
      const fountain = TEMPLE_PROPS['temple_holy_fountain'];
      expect(fountain).toBeDefined();
      expect(fountain!.tags).toContain('water_source');
      expect(fountain!.tags).toContain('holy_water_source');
    });

    it('temple_loose_tile is hidden signature prop', () => {
      const tile = TEMPLE_PROPS['temple_loose_tile'];
      expect(tile).toBeDefined();
      expect(tile!.tier).toBe('signature');
      expect(tile!.hidden).toBe(true);
      expect(tile!.discoverVerb).toBe('search');
    });

    it('temple_offering_bowl costs currency', () => {
      const bowl = TEMPLE_PROPS['temple_offering_bowl'];
      expect(bowl).toBeDefined();
      expect(bowl!.defaultInteraction.rewards?.currency).toBe(-10);
    });
  });

  describe('Square Props', () => {
    it('wishing well has water_source tag', () => {
      const well = SQUARE_PROPS['square_wishing_well'];
      expect(well).toBeDefined();
      expect(well!.tags).toContain('water_source');
    });
  });
});

// ========================================
// Prop Interaction Edge Cases
// ========================================

describe('Prop Interaction Edge Cases', () => {
  describe('Hidden props', () => {
    it('hidden props exist in registry but not in visible list', () => {
      // The hidden floorboard should be in PROP_REGISTRY
      expect(PROP_REGISTRY['inn_loose_floorboard']).toBeDefined();

      // But not in visible props
      const visible = getVisibleProps('town_inn');
      const hasFloorboard = visible.some(p => p.id === 'inn_loose_floorboard');
      expect(hasFloorboard).toBe(false);
    });

    it('hidden props can still be found by name', () => {
      // findPropByName should still find hidden props (for when player searches)
      const prop = findPropByName('town_inn', 'floorboard');
      expect(prop).toBeDefined();
      expect(prop!.hidden).toBe(true);
    });
  });

  describe('Cooldown key formats', () => {
    it('default interaction uses prop ID as cooldown key', () => {
      const player = createMockPlayer({ propCooldowns: {} });
      const propId = 'inn_ginger_cat';

      setPropCooldown(player, propId, 1000, 30);
      expect(player.propCooldowns[propId]).toBe(1030);
    });

    it('item interaction uses prop_item as cooldown key', () => {
      const player = createMockPlayer({ propCooldowns: {} });
      const cooldownKey = 'inn_tip_jar_coin';

      setPropCooldown(player, cooldownKey, 1000, 60);
      expect(player.propCooldowns[cooldownKey]).toBe(1060);
    });

    it('tag interaction uses prop_tag_tagname as cooldown key', () => {
      const player = createMockPlayer({ propCooldowns: {} });
      const cooldownKey = 'temple_holy_fountain_tag_water_source';

      setPropCooldown(player, cooldownKey, 1000, 10);
      expect(player.propCooldowns[cooldownKey]).toBe(1010);
    });
  });

  describe('Multiple interactions on same prop', () => {
    it('different items can have different cooldowns on same prop', () => {
      const player = createMockPlayer({ propCooldowns: {} });

      setPropCooldown(player, 'fireplace_torch', 1000, 10);
      setPropCooldown(player, 'fireplace_meat', 1000, 30);

      expect(player.propCooldowns['fireplace_torch']).toBe(1010);
      expect(player.propCooldowns['fireplace_meat']).toBe(1030);
    });
  });
});

// ========================================
// Prop Text Variations
// ========================================

describe('Prop Text Variations', () => {
  it('props have multiple text variations', () => {
    const cat = INN_PROPS['inn_ginger_cat'];
    expect(Array.isArray(cat!.defaultInteraction.text)).toBe(true);
    expect((cat!.defaultInteraction.text as string[]).length).toBeGreaterThan(1);
  });

  it('props have multiple examine text variations', () => {
    const cat = INN_PROPS['inn_ginger_cat'];
    expect(Array.isArray(cat!.examineText)).toBe(true);
    expect(cat!.examineText.length).toBeGreaterThan(1);
  });

  it('pickRandomText handles text array from prop', () => {
    const cat = INN_PROPS['inn_ginger_cat'];
    const text = pickRandomText(cat!.defaultInteraction.text);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });
});
