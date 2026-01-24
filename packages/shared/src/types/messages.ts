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

/** Client submits character creation */
export interface CreateCharacterMessage {
  type: 'create_character';
  name: string;
  className: 'warrior' | 'rogue' | 'mage' | 'cleric' | 'ranger';
}

/** Client loads an existing character */
export interface LoadCharacterMessage {
  type: 'load_character';
  characterId: string;
}

/** Client deletes a character */
export interface DeleteCharacterMessage {
  type: 'delete_character';
  characterId: string;
  confirmName: string;
}

/** Client links a player code (for cross-device access) */
export interface LinkPlayerCodeMessage {
  type: 'link_player_code';
  code: string;
}

/** Client sends their stored player ID on connect */
export interface IdentifyPlayerMessage {
  type: 'identify_player';
  playerId: string | null;
}

/** Client -> Server message union */
export type ClientMessage =
  | CommandMessage
  | SyncRequestMessage
  | CreateCharacterMessage
  | LoadCharacterMessage
  | DeleteCharacterMessage
  | LinkPlayerCodeMessage
  | IdentifyPlayerMessage;

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

/** Server requests character creation from client */
export interface CharacterCreationMessage {
  type: 'character_creation';
  classes: ClassOption[];
}

/** Class option for character creation */
export interface ClassOption {
  id: string;
  name: string;
  description: string;
  primaryStats: [string, string];
}

/** Character summary for character selection screen */
export interface CharacterSummary {
  id: string;
  name: string;
  class: string;
  level: number;
  lastPlayed: number;
}

/** Server sends welcome with player info and saved characters */
export interface WelcomeMessage {
  type: 'welcome';
  playerId: string;
  playerCode: string;
  characters: CharacterSummary[];
  maxCharacters: number;
  classes: ClassOption[];
}

/** Server confirms character deletion */
export interface CharacterDeletedMessage {
  type: 'character_deleted';
  characterId: string;
  characters: CharacterSummary[];
}

/** Server -> Client message union */
export type ServerMessage =
  | OutputMessage
  | RoomMessage
  | PlayerUpdateMessage
  | CombatMessage
  | TimeMessage
  | ErrorMessage
  | SyncMessage
  | CharacterCreationMessage
  | WelcomeMessage
  | CharacterDeletedMessage;

// ============ Event Names ============

export const CLIENT_EVENTS = {
  COMMAND: 'command',
  SYNC_REQUEST: 'sync_request',
  CREATE_CHARACTER: 'create_character',
  LOAD_CHARACTER: 'load_character',
  DELETE_CHARACTER: 'delete_character',
  LINK_PLAYER_CODE: 'link_player_code',
  IDENTIFY_PLAYER: 'identify_player',
} as const;

export const SERVER_EVENTS = {
  OUTPUT: 'output',
  ROOM: 'room',
  PLAYER_UPDATE: 'player_update',
  COMBAT: 'combat',
  TIME: 'time',
  ERROR: 'error',
  SYNC: 'sync',
  CHARACTER_CREATION: 'character_creation',
  WELCOME: 'welcome',
  CHARACTER_DELETED: 'character_deleted',
} as const;
