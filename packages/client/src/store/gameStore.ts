import { create } from 'zustand';
import type { OutputLine, Player, RoomMessage, GameTime, WeatherState } from '@solo-mud/shared';

interface GameState {
  // Connection state
  connected: boolean;
  connecting: boolean;

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
  lines: [],
  player: null,
  room: null,
  time: null,
  weather: null,

  // Actions
  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),

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
