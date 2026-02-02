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

export const WOODS_SETS: SetDefinition[] = [];

export function getSetDefinition(setId: string): SetDefinition | undefined {
  return WOODS_SETS.find(s => s.id === setId);
}

export function getItemSet(itemBaseId: string): SetDefinition | undefined {
  return WOODS_SETS.find(s => s.pieceIds.includes(itemBaseId));
}
