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

/** Client -> Server message union */
export type ClientMessage = CommandMessage | SyncRequestMessage;

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

/** Server -> Client message union */
export type ServerMessage =
  | OutputMessage
  | RoomMessage
  | PlayerUpdateMessage
  | CombatMessage
  | TimeMessage
  | ErrorMessage
  | SyncMessage;

// ============ Event Names ============

export const CLIENT_EVENTS = {
  COMMAND: 'command',
  SYNC_REQUEST: 'sync_request',
} as const;

export const SERVER_EVENTS = {
  OUTPUT: 'output',
  ROOM: 'room',
  PLAYER_UPDATE: 'player_update',
  COMBAT: 'combat',
  TIME: 'time',
  ERROR: 'error',
  SYNC: 'sync',
} as const;
