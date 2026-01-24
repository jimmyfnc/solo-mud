import { create } from 'zustand';
import type {
  OutputLine,
  Player,
  RoomMessage,
  GameTime,
  WeatherState,
  ClassOption,
  CharacterSummary,
} from '@solo-mud/shared';

// Local storage keys
const PLAYER_ID_KEY = 'solo-mud-player-id';

interface GameState {
  // Connection state
  connected: boolean;
  connecting: boolean;

  // Player identity (persisted)
  playerId: string | null;
  playerCode: string | null;
  savedCharacters: CharacterSummary[];
  maxCharacters: number;

  // UI state
  showCharacterSelect: boolean;
  showCharacterCreation: boolean;
  classOptions: ClassOption[];

  // Output buffer
  lines: OutputLine[];

  // Player state (active session)
  player: Player | null;

  // Room state
  room: RoomMessage | null;

  // Time and weather
  time: GameTime | null;
  weather: WeatherState | null;

  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setPlayerIdentity: (playerId: string, playerCode: string) => void;
  setSavedCharacters: (characters: CharacterSummary[], maxCharacters: number) => void;
  setClassOptions: (options: ClassOption[]) => void;
  setShowCharacterSelect: (show: boolean) => void;
  setShowCharacterCreation: (show: boolean) => void;
  addLines: (newLines: OutputLine[]) => void;
  clearLines: () => void;
  setPlayer: (player: Player | null) => void;
  updatePlayer: (update: Partial<Player>) => void;
  setRoom: (room: RoomMessage | null) => void;
  setTime: (time: GameTime) => void;
  setWeather: (weather: WeatherState) => void;
  getStoredPlayerId: () => string | null;
  enterGame: () => void;

  // Legacy compatibility (maps to new state)
  needsCharacterCreation: boolean;
  setNeedsCharacterCreation: (needs: boolean) => void;
}

/**
 * Get stored player ID from localStorage.
 */
function getStoredPlayerId(): string | null {
  try {
    return localStorage.getItem(PLAYER_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Store player ID in localStorage.
 */
function storePlayerId(playerId: string): void {
  try {
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  } catch {
    console.warn('Failed to store player ID in localStorage');
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  connected: false,
  connecting: false,
  playerId: null,
  playerCode: null,
  savedCharacters: [],
  maxCharacters: 10,
  showCharacterSelect: true,
  showCharacterCreation: false,
  classOptions: [],
  lines: [],
  player: null,
  room: null,
  time: null,
  weather: null,

  // Legacy compatibility
  needsCharacterCreation: false,

  // Actions
  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),

  setPlayerIdentity: (playerId, playerCode) => {
    storePlayerId(playerId);
    set({ playerId, playerCode });
  },

  setSavedCharacters: (characters, maxCharacters) =>
    set({ savedCharacters: characters, maxCharacters }),

  setClassOptions: (options) => set({ classOptions: options }),

  setShowCharacterSelect: (show) => set({ showCharacterSelect: show }),

  setShowCharacterCreation: (show) => set({ showCharacterCreation: show }),

  // Legacy: maps to showCharacterCreation
  setNeedsCharacterCreation: (needs) =>
    set({
      needsCharacterCreation: needs,
      showCharacterCreation: needs,
      showCharacterSelect: !needs && !get().player,
    }),

  addLines: (newLines) =>
    set((state) => ({
      lines: [...state.lines, ...newLines].slice(-1000), // Keep last 1000 lines
    })),

  clearLines: () => set({ lines: [] }),

  setPlayer: (player) => set({ player }),

  updatePlayer: (update) =>
    set((state) => ({
      player: state.player ? { ...state.player, ...update } : null,
    })),

  setRoom: (room) => set({ room }),

  setTime: (time) => set({ time }),

  setWeather: (weather) => set({ weather }),

  getStoredPlayerId: () => getStoredPlayerId(),

  // Called when entering the game (character selected/created)
  enterGame: () =>
    set({
      showCharacterSelect: false,
      showCharacterCreation: false,
      needsCharacterCreation: false,
    }),
}));
