/**
 * Creature incursion system - handles creatures wandering near town
 * and NPCs (guards, shopkeepers, trainers, etc.) defending against them.
 */

import type { World, Creature, OutputLine, NodeId, CreatureTier } from '@solo-mud/shared';
import { createRng, CREATURE_TEMPLATES, getCombatNpcsAtLocation } from '@solo-mud/shared';
import { handleCreatureDeath } from './ecosystem';

/** Result of an incursion event */
export interface IncursionEvent {
  type: 'incursion_start' | 'guard_attack' | 'creature_death' | 'guard_victory' | 'incursion_repelled';
  locationId: NodeId;
  messages: OutputLine[];
  creatureId?: string;
  guardId?: string;
}

/** Active incursion state */
export interface ActiveIncursion {
  creatureId: string;
  creatureName: string;
  locationId: NodeId;
  ticksRemaining: number;
  guardsFighting: string[];
}

/** Incursion manager state */
export interface IncursionState {
  activeIncursions: ActiveIncursion[];
  lastIncursionTick: number;
  incursionCooldown: number; // Ticks between incursion attempts
}

/** Create initial incursion state */
export function createIncursionState(): IncursionState {
  return {
    activeIncursions: [],
    lastIncursionTick: 0,
    incursionCooldown: 30, // About 5 minutes at 10s ticks
  };
}

/** Creature templates that can raid the town */
const RAIDING_CREATURES = ['goblin', 'wolf', 'bandit'];

/** Descriptions for incursion events */
const INCURSION_MESSAGES = {
  goblin: {
    arrive: 'A goblin scout has been spotted near the town gate!',
    attack: 'The goblin shrieks and attacks with a rusty blade!',
    death: 'The goblin falls with a gurgling cry.',
    flee: 'The goblin retreats back into the wilderness, snarling.',
  },
  wolf: {
    arrive: 'A wolf prowls near the town gate, growling menacingly!',
    attack: 'The wolf lunges with snapping jaws!',
    death: 'The wolf collapses with a final whimper.',
    flee: 'The wolf slinks back into the shadows.',
  },
  bandit: {
    arrive: 'A hooded bandit approaches the town gate!',
    attack: 'The bandit draws a blade and attacks!',
    death: 'The bandit crumples to the ground.',
    flee: 'The bandit flees, cursing as they go.',
  },
};

/**
 * Check if an incursion should start.
 */
export function shouldStartIncursion(
  state: IncursionState,
  currentTick: number,
  rng: ReturnType<typeof createRng>
): boolean {
  // Don't start if there's already an active incursion
  if (state.activeIncursions.length > 0) {
    return false;
  }

  // Check cooldown
  if (currentTick - state.lastIncursionTick < state.incursionCooldown) {
    return false;
  }

  // 10% chance per tick after cooldown
  return rng.next() < 0.10;
}

/**
 * Start a new incursion near the town gate.
 */
export function startIncursion(
  world: World,
  state: IncursionState,
  currentTick: number,
  rng: ReturnType<typeof createRng>
): IncursionEvent | null {
  // Pick a random raiding creature
  const templateId = rng.pick(RAIDING_CREATURES);
  const template = CREATURE_TEMPLATES[templateId];
  if (!template) return null;

  // Create temporary creature for the incursion
  const creatureId = `incursion_${templateId}_${currentTick}`;
  const level = template.baseLevel + rng.nextInt(0, 2);
  const maxHp = Math.floor(template.baseHp * (1 + (level - template.baseLevel) * 0.2));

  const creature: Creature = {
    id: creatureId,
    templateId,
    name: template.name,
    level,
    behavior: 'aggressive',
    mobility: 'roaming',
    currentHp: maxHp,
    maxHp,
    locationId: 'town_gate',
    homeLocationId: 'wilderness',
    spawnLocationId: 'wilderness',
    inCombat: true,
    description: template.descriptions.idle[0] ?? 'A hostile creature.',
  };

  // Add creature to world and location
  world.creatures[creatureId] = creature;
  const spawnLocation = world.locations['town_gate'];
  if (spawnLocation) {
    spawnLocation.creatures.push(creatureId);
  }

  // Create incursion state
  const incursion: ActiveIncursion = {
    creatureId,
    creatureName: template.name,
    locationId: 'town_gate',
    ticksRemaining: 10, // 10 ticks to resolve
    guardsFighting: [],
  };

  state.activeIncursions.push(incursion);
  state.lastIncursionTick = currentTick;

  const messages = INCURSION_MESSAGES[templateId as keyof typeof INCURSION_MESSAGES];

  return {
    type: 'incursion_start',
    locationId: 'town_gate',
    creatureId,
    messages: [
      { text: '', style: 'normal' },
      { text: '⚔️ TOWN ALERT! ⚔️', style: 'combat' },
      { text: messages?.arrive ?? `A ${template.name} approaches the town gate!`, style: 'combat' },
    ],
  };
}

/**
 * Process NPC combat against incursion creatures.
 * All NPCs with combat stats (guards, shopkeepers, trainers, etc.) will defend.
 */
export function processIncursionCombat(
  world: World,
  state: IncursionState,
  rng: ReturnType<typeof createRng>
): IncursionEvent[] {
  const events: IncursionEvent[] = [];

  for (const incursion of state.activeIncursions) {
    const creature = world.creatures[incursion.creatureId];
    if (!creature || creature.currentHp <= 0) {
      continue;
    }

    // Get all combat-capable NPCs at the incursion location
    const location = world.locations[incursion.locationId];
    if (!location) continue;

    const defenders = getCombatNpcsAtLocation(
      world.npcs,
      location.npcs ?? [],
      incursion.locationId,
      world.time.timeOfDay
    );

    if (defenders.length === 0) {
      incursion.ticksRemaining--;
      continue;
    }

    // Each defender attacks
    for (const defender of defenders) {
      if (!defender.combat) continue;

      // Defender attacks creature
      const damage = Math.floor(defender.combat.damage * (0.8 + rng.next() * 0.4));
      creature.currentHp -= damage;

      const messages = INCURSION_MESSAGES[creature.templateId as keyof typeof INCURSION_MESSAGES];

      events.push({
        type: 'guard_attack',
        locationId: incursion.locationId,
        creatureId: incursion.creatureId,
        guardId: defender.id,
        messages: [
          { text: `${defender.title ?? ''} ${defender.name} strikes the ${creature.name} for ${damage} damage!`.trim(), style: 'combat' },
        ],
      });

      // Check if creature died
      if (creature.currentHp <= 0) {
        events.push({
          type: 'creature_death',
          locationId: incursion.locationId,
          creatureId: incursion.creatureId,
          messages: [
            { text: messages?.death ?? `The ${creature.name} has been slain!`, style: 'success' },
          ],
        });
        break;
      }

      // Creature attacks back
      const creatureDamage = Math.floor(creature.level * 3 * (0.7 + rng.next() * 0.6));
      defender.combat.currentHp -= creatureDamage;

      events.push({
        type: 'guard_attack',
        locationId: incursion.locationId,
        creatureId: incursion.creatureId,
        guardId: defender.id,
        messages: [
          { text: `The ${creature.name} strikes ${defender.name} for ${creatureDamage} damage!`, style: 'combat' },
        ],
      });

      // NPCs don't die from incursion combat, they just get injured
      if (defender.combat.currentHp <= 0) {
        defender.combat.currentHp = 1;
        events.push({
          type: 'guard_attack',
          locationId: incursion.locationId,
          guardId: defender.id,
          messages: [
            { text: `${defender.name} is badly wounded but continues fighting!`, style: 'combat' },
          ],
        });
      }
    }

    incursion.ticksRemaining--;
  }

  // Clean up finished incursions
  const finishedIncursions = state.activeIncursions.filter(inc => {
    const creature = world.creatures[inc.creatureId];
    return !creature || creature.currentHp <= 0 || inc.ticksRemaining <= 0;
  });

  for (const finished of finishedIncursions) {
    const creature = world.creatures[finished.creatureId];

    if (creature && creature.currentHp > 0) {
      // Creature fled - remove from location and world
      const fleeLocation = world.locations[creature.locationId];
      if (fleeLocation) {
        const idx = fleeLocation.creatures.indexOf(creature.id);
        if (idx !== -1) fleeLocation.creatures.splice(idx, 1);
      }
      delete world.creatures[finished.creatureId];

      const messages = INCURSION_MESSAGES[creature.templateId as keyof typeof INCURSION_MESSAGES];
      events.push({
        type: 'incursion_repelled',
        locationId: finished.locationId,
        messages: [
          { text: messages?.flee ?? `The ${creature.name} retreats!`, style: 'success' },
        ],
      });
    } else if (creature) {
      // Creature was killed - create corpse with loot
      // Determine creature tier based on level
      const tier: CreatureTier = creature.level <= 3 ? 'common' : creature.level <= 6 ? 'dangerous' : 'apex';

      // Handle creature death properly - creates corpse and queues respawn
      // Note: loot is empty for guard kills, but corpse can still be examined
      handleCreatureDeath(world, creature, 'player', tier, []);

      events.push({
        type: 'guard_victory',
        locationId: finished.locationId,
        messages: [
          { text: 'The townsfolk have defended against the threat!', style: 'success' },
          { text: `The ${finished.creatureName}'s corpse can be looted.`, style: 'system' },
          { text: '', style: 'normal' },
        ],
      });
    }

    // Heal defenders over time
    const location = world.locations[finished.locationId];
    if (location) {
      const defenders = getCombatNpcsAtLocation(
        world.npcs,
        location.npcs ?? [],
        finished.locationId,
        world.time.timeOfDay
      );
      for (const defender of defenders) {
        if (defender.combat) {
          // Heal 25% of max HP
          defender.combat.currentHp = Math.min(
            defender.combat.maxHp,
            defender.combat.currentHp + Math.floor(defender.combat.maxHp * 0.25)
          );
        }
      }
    }
  }

  // Remove finished incursions from state
  state.activeIncursions = state.activeIncursions.filter(inc => {
    const creature = world.creatures[inc.creatureId];
    return creature && creature.currentHp > 0 && inc.ticksRemaining > 0;
  });

  return events;
}

/**
 * Main incursion tick - call this from the game loop.
 */
export function tickIncursion(
  world: World,
  state: IncursionState,
  currentTick: number,
  seed: string
): IncursionEvent[] {
  const rng = createRng(`incursion_${seed}_${currentTick}`);
  const events: IncursionEvent[] = [];

  // Check for new incursion
  if (shouldStartIncursion(state, currentTick, rng)) {
    const startEvent = startIncursion(world, state, currentTick, rng);
    if (startEvent) {
      events.push(startEvent);
    }
  }

  // Process combat for active incursions
  const combatEvents = processIncursionCombat(world, state, rng);
  events.push(...combatEvents);

  return events;
}
