/**
 * Whispering Woods containers and their authored contents.
 */
import type { Container, Item } from '../../types';
import { WOODS_THORN_DEAD_3 } from './locations';

/** Items found inside Woods containers (merged into world.items at assembly) */
export const WOODS_CONTAINER_ITEMS: Record<string, Item> = {
  skeleton_tattered_map: {
    id: 'skeleton_tattered_map',
    baseId: 'skeleton_tattered_map',
    name: 'Tattered Map',
    tags: ['junk', 'document'],
    rarity: 'common',
    affixes: [],
  },
  skeleton_rusted_blade: {
    id: 'skeleton_rusted_blade',
    baseId: 'rusty_sword',
    name: 'Rust-Eaten Sword',
    tags: ['weapon', 'sword', 'melee'],
    rarity: 'junk',
    affixes: [],
  },
  skeleton_health_potion: {
    id: 'skeleton_health_potion',
    baseId: 'health_potion',
    name: 'Health Potion',
    tags: ['consumable', 'potion'],
    rarity: 'common',
    affixes: [],
  },
};

/** Containers placed in the Woods */
export const WOODS_CONTAINERS: Record<string, Container> = {
  container_thorn_skeleton: {
    id: 'container_thorn_skeleton',
    name: 'Slumped Skeleton',
    description:
      'A dead adventurer, picked clean by the thorns. Bony fingers still clutch a tattered map, and a few belongings lie tangled in the brambles around the body.',
    locationId: WOODS_THORN_DEAD_3,
    contents: ['skeleton_tattered_map', 'skeleton_rusted_blade', 'skeleton_health_potion'],
    locked: false,
    opened: false,
    respawns: false, // one dead adventurer, one set of belongings
  },
};
