import { create } from 'zustand';
import type { OutputLine, Player, RoomMessage, GameTime, WeatherState, ClassOption } from '@solo-mud/shared';

interface GameState {
  // Connection state
  connected: boolean;
  connecting: boolean;

  // Character creation state
  needsCharacterCreation: boolean;
  classOptions: ClassOption[];

  // Output buffer
  lines: OutputLine[];

  // Player state
  player: Player | null;

  // Room state
  room: RoomMessage | null;

  // Time and weather
  time: GameTime | null;
  weather: WeatherState | null;

  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setNeedsCharacterCreation: (needs: boolean) => void;
  setClassOptions: (options: ClassOption[]) => void;
  addLines: (newLines: OutputLine[]) => void;
  clearLines: () => void;
  setPlayer: (player: Player | null) => void;
  updatePlayer: (update: Partial<Player>) => void;
  setRoom: (room: RoomMessage | null) => void;
  setTime: (time: GameTime) => void;
  setWeather: (weather: WeatherState) => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  connected: false,
  connecting: false,
  needsCharacterCreation: false,
  classOptions: [],
  lines: [],
  player: null,
  room: null,
  time: null,
  weather: null,

  // Actions
  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  setNeedsCharacterCreation: (needs) => set({ needsCharacterCreation: needs }),
  setClassOptions: (options) => set({ classOptions: options }),

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
}));
