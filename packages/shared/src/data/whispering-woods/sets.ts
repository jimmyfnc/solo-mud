/**
 * Whispering Woods set bonus definitions.
 */

export interface SetBonus {
  pieces: number;
  description: string;
  stats?: Record<string, number>;
  special?: string;
}

export interface SetDefinition {
  id: string;
  name: string;
  class: string;
  bonuses: SetBonus[];
  pieceIds: string[];
}

export const WOODS_SETS: SetDefinition[] = [
  // Warrior - Thornguard Set
  {
    id: 'thornguard',
    name: 'Thornguard Set',
    class: 'warrior',
    bonuses: [
      { pieces: 2, description: '+50 Max HP', stats: { maxHp: 50 } },
      { pieces: 4, description: '+10% Physical Resistance', stats: { physicalResistance: 10 } },
      { pieces: 6, description: 'Thorns Aura - Attackers take damage when they hit you', special: 'thorns_aura' },
    ],
    pieceIds: [
      'thornguard_gloves', 'thornguard_boots', 'thornguard_belt',
      'thornguard_shoulders', 'thornguard_helm', 'thornguard_chest',
    ],
  },
  // Mage - Veilweave Set
  {
    id: 'veilweave',
    name: 'Veilweave Set',
    class: 'mage',
    bonuses: [
      { pieces: 2, description: '+30 Max MP', stats: { maxMp: 30 } },
      { pieces: 4, description: '+15% Spell Power', stats: { spellPower: 15 } },
      { pieces: 6, description: 'Veil of Shadows - 10% chance to avoid damage entirely', special: 'veil_of_shadows' },
    ],
    pieceIds: [
      'veilweave_gloves', 'veilweave_boots', 'veilweave_belt',
      'veilweave_shoulders', 'veilweave_helm', 'veilweave_chest',
    ],
  },
  // Rogue - Shadowthorn Set
  {
    id: 'shadowthorn',
    name: 'Shadowthorn Set',
    class: 'rogue',
    bonuses: [
      { pieces: 2, description: '+10% Crit Chance', stats: { critChance: 10 } },
      { pieces: 4, description: '+20% Crit Damage', stats: { critDamage: 20 } },
      { pieces: 6, description: 'Fey Step - First attack after entering combat always crits', special: 'fey_step' },
    ],
    pieceIds: [
      'shadowthorn_gloves', 'shadowthorn_boots', 'shadowthorn_belt',
      'shadowthorn_shoulders', 'shadowthorn_helm', 'shadowthorn_chest',
    ],
  },
  // Cleric - Spiritwood Set
  {
    id: 'spiritwood',
    name: 'Spiritwood Set',
    class: 'cleric',
    bonuses: [
      { pieces: 2, description: '+20% Healing Power', stats: { healingPower: 20 } },
      { pieces: 4, description: '+25 Max MP, +5 MP Regen', stats: { maxMp: 25, mpRegen: 5 } },
      { pieces: 6, description: "Nature's Grace - Heals have 15% chance to cost no mana", special: 'natures_grace' },
    ],
    pieceIds: [
      'spiritwood_gloves', 'spiritwood_boots', 'spiritwood_belt',
      'spiritwood_shoulders', 'spiritwood_helm', 'spiritwood_chest',
    ],
  },
  // Ranger - Wildwood Set
  {
    id: 'wildwood',
    name: 'Wildwood Set',
    class: 'ranger',
    bonuses: [
      { pieces: 2, description: '+15% Ranged Damage', stats: { rangedDamage: 15 } },
      { pieces: 4, description: '+10% Dodge Chance', stats: { dodgeChance: 10 } },
      { pieces: 6, description: "Predator's Mark - Attacks against same target deal stacking damage", special: 'predators_mark' },
    ],
    pieceIds: [
      'wildwood_gloves', 'wildwood_boots', 'wildwood_belt',
      'wildwood_shoulders', 'wildwood_helm', 'wildwood_chest',
    ],
  },
];

export function getSetDefinition(setId: string): SetDefinition | undefined {
  return WOODS_SETS.find(s => s.id === setId);
}

export function getItemSet(itemBaseId: string): SetDefinition | undefined {
  return WOODS_SETS.find(s => s.pieceIds.includes(itemBaseId));
}
