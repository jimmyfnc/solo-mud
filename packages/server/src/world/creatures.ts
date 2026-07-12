/**
 * Creature spawning system for world generation.
 */

import {
  type Rng,
  type Location,
  type Creature,
  type CreatureId,
  type BiomeWeights,
  CREATURE_TEMPLATES,
  getTemplatesForBiome,
  getTemplatesForDepth,
} from '@solo-mud/shared';

/** Configuration for creature spawning */
export interface SpawnConfig {
  /** Chance (0-1) that a location has any creatures */
  locationSpawnChance: number;
  /** Min creatures per populated location */
  minCreatures: number;
  /** Max creatures per populated location */
  maxCreatures: number;
  /** Reduce spawn chance near start (depth 0-1) */
  safeZoneDepth: number;
}

const DEFAULT_SPAWN_CONFIG: SpawnConfig = {
  locationSpawnChance: 0.6,
  minCreatures: 1,
  maxCreatures: 3,
  safeZoneDepth: 1,
};

/**
 * Get the dominant biome from weighted biomes.
 */
function getDominantBiome(biome: BiomeWeights): keyof BiomeWeights {
  const entries = Object.entries(biome) as [keyof BiomeWeights, number][];
  entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  return entries[0]?.[0] ?? 'plains';
}

/**
 * Perform weighted random selection from templates.
 */
function weightedRandomSelect<T extends { spawnWeight: number }>(
  items: T[],
  rng: Rng
): T | null {
  if (items.length === 0) return null;

  const totalWeight = items.reduce((sum, item) => sum + item.spawnWeight, 0);
  let roll = rng.next() * totalWeight;

  for (const item of items) {
    roll -= item.spawnWeight;
    if (roll <= 0) return item;
  }

  return items[items.length - 1] ?? null;
}

/**
 * Calculate creature level with variation based on depth.
 *
 * Formula:
 * - Base level from template
 * - Depth bonus: +1 level per 2 depths beyond creature's minDepth
 * - Random variation: -1 to +1
 * - Minimum level is always 1
 *
 * Example: Goblin (baseLevel 2, minDepth 2) at depth 5:
 *   Base: 2 + depthBonus: floor((5-2)/2) = 1 + random: -1 to +1
 *   Result: Level 2-4
 */
function calculateCreatureLevel(
  baseLevel: number,
  minDepth: number,
  locationDepth: number,
  rng: Rng
): number {
  // Depth bonus: +1 level for every 2 depths beyond minDepth
  const depthBonus = Math.floor(Math.max(0, locationDepth - minDepth) / 2);

  // Random variation: -1, 0, or +1
  const variation = rng.nextInt(-1, 1);

  // Calculate final level (minimum 1)
  return Math.max(1, baseLevel + depthBonus + variation);
}

/**
 * Calculate creature HP based on level scaling.
 * HP scales by 20% per level above base.
 */
function calculateCreatureHp(baseHp: number, baseLevel: number, actualLevel: number): number {
  const levelDiff = actualLevel - baseLevel;
  const hpMultiplier = 1 + (levelDiff * 0.2); // +20% HP per level
  return Math.floor(baseHp * hpMultiplier);
}

/**
 * Create a creature instance from a template.
 */
function createCreature(
  templateId: string,
  locationId: string,
  locationDepth: number,
  index: number,
  rng: Rng
): Creature {
  const template = CREATURE_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown creature template: ${templateId}`);
  }

  const id: CreatureId = `creature_${locationId}_${templateId}_${index}`;

  // Calculate level with variation
  const level = calculateCreatureLevel(
    template.baseLevel,
    template.minDepth,
    locationDepth,
    rng
  );

  // Scale HP based on level
  const maxHp = calculateCreatureHp(template.baseHp, template.baseLevel, level);

  // Pick a random idle description
  const description = rng.pick(template.descriptions.idle);

  return {
    id,
    templateId,
    name: template.name,
    level,
    behavior: template.behavior,
    mobility: template.mobility,
    currentHp: maxHp,
    maxHp,
    locationId,
    homeLocationId: locationId,
    spawnLocationId: locationId,
    inCombat: false,
    description,
  };
}

/**
 * Spawn creatures for a single location.
 */
export function spawnCreaturesForLocation(
  location: Location,
  rng: Rng,
  config: SpawnConfig = DEFAULT_SPAWN_CONFIG
): { creatures: Creature[]; creatureIds: CreatureId[] } {
  const creatures: Creature[] = [];
  const creatureIds: CreatureId[] = [];

  // Reduce spawn chance in safe zone
  const spawnChance =
    location.depth <= config.safeZoneDepth
      ? config.locationSpawnChance * 0.3
      : config.locationSpawnChance;

  // Check if this location gets creatures
  if (rng.next() > spawnChance) {
    return { creatures, creatureIds };
  }

  // Get valid templates for this location
  const dominantBiome = getDominantBiome(location.biome);
  const biomeTemplates = getTemplatesForBiome(dominantBiome);
  const validTemplates = getTemplatesForDepth(biomeTemplates, location.depth);

  if (validTemplates.length === 0) {
    return { creatures, creatureIds };
  }

  // Determine how many creatures to spawn
  const count = rng.nextInt(config.minCreatures, config.maxCreatures);

  // Spawn creatures
  for (let i = 0; i < count; i++) {
    const template = weightedRandomSelect(validTemplates, rng);
    if (!template) continue;

    const creature = createCreature(template.id, location.id, location.depth, i, rng);
    creatures.push(creature);
    creatureIds.push(creature.id);
  }

  return { creatures, creatureIds };
}

/**
 * Spawn creatures for all locations in the world.
 * Returns a record of all creatures and updates location creature arrays.
 */
export function spawnAllCreatures(
  locations: Record<string, Location>,
  rng: Rng,
  config: SpawnConfig = DEFAULT_SPAWN_CONFIG
): Record<CreatureId, Creature> {
  const allCreatures: Record<CreatureId, Creature> = {};

  for (const location of Object.values(locations)) {
    const { creatures, creatureIds } = spawnCreaturesForLocation(
      location,
      rng,
      config
    );

    // Add creatures to global record
    for (const creature of creatures) {
      allCreatures[creature.id] = creature;
    }

    // Update location's creature list
    location.creatures = creatureIds;
  }

  return allCreatures;
}
