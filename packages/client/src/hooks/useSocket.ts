import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  SERVER_EVENTS,
  CLIENT_EVENTS,
  type OutputMessage,
  type OutputLine,
  type RoomMessage,
  type PlayerUpdateMessage,
  type TimeMessage,
  type ErrorMessage,
  type SyncMessage,
  type WelcomeMessage,
  type CharacterDeletedMessage,
  type SimulationMessage,
  type ClassName,
} from '@solo-mud/shared';
import { useGameStore } from '../store/gameStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export interface UseSocketReturn {
  sendCommand: (input: string) => void;
  requestSync: () => void;
  createCharacter: (name: string, className: ClassName) => void;
  loadCharacter: (characterId: string) => void;
  deleteCharacter: (characterId: string, confirmName: string) => void;
  linkPlayerCode: (code: string) => void;
}

/**
 * Hook for managing Socket.io connection to the game server.
 */
export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const {
    setConnected,
    setConnecting,
    setPlayerIdentity,
    setSavedCharacters,
    setClassOptions,
    setShowCharacterSelect,
    addLines,
    setPlayer,
    updatePlayer,
    setRoom,
    setTime,
    setWeather,
    getStoredPlayerId,
    getLastCharacterId,
    setLastCharacterId,
    enterGame,
  } = useGameStore();

  // Initialize socket connection
  useEffect(() => {
    setConnecting(true);

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      setConnected(true);
      setConnecting(false);

      // Send player identification with stored ID (if any)
      const storedPlayerId = getStoredPlayerId();
      socket.emit(CLIENT_EVENTS.IDENTIFY_PLAYER, {
        type: 'identify_player',
        playerId: storedPlayerId,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setConnected(false);
      addLines([{ text: `Disconnected from server: ${reason}`, style: 'error' }]);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnecting(false);
      addLines([{ text: `Connection error: ${error.message}`, style: 'error' }]);
    });

    // Welcome event - received after IDENTIFY_PLAYER
    socket.on(SERVER_EVENTS.WELCOME, (message: WelcomeMessage) => {
      setPlayerIdentity(message.playerId, message.playerCode);
      setSavedCharacters(message.characters, message.maxCharacters);
      setClassOptions(message.classes);

      // Auto-resume: if last character exists in the list, auto-load it
      const lastCharId = getLastCharacterId();
      if (lastCharId && message.characters.some(c => c.id === lastCharId)) {
        socket.emit(CLIENT_EVENTS.LOAD_CHARACTER, {
          type: 'load_character',
          characterId: lastCharId,
        });
        return;
      }

      setShowCharacterSelect(true);
    });

    // Game events
    socket.on(SERVER_EVENTS.OUTPUT, (message: OutputMessage) => {
      addLines(message.lines);
    });

    socket.on(SERVER_EVENTS.ROOM, (message: RoomMessage) => {
      setRoom(message);
    });

    socket.on(SERVER_EVENTS.PLAYER_UPDATE, (message: PlayerUpdateMessage) => {
      if (message.player) {
        updatePlayer(message.player);
      }
    });

    socket.on(SERVER_EVENTS.TIME, (message: TimeMessage) => {
      setTime(message.time);
      setWeather(message.weather);
    });

    socket.on(SERVER_EVENTS.ERROR, (message: ErrorMessage) => {
      addLines([{ text: `Error: ${message.message}`, style: 'error' }]);
    });

    socket.on(SERVER_EVENTS.SYNC, (message: SyncMessage) => {
      setPlayer(message.player);
      setRoom(message.room);
      setTime(message.time);
      setWeather(message.weather);
      if (message.characterId) {
        setLastCharacterId(message.characterId);
      }
      enterGame(); // Hide character select, show game
    });

    // Character deleted confirmation
    socket.on(SERVER_EVENTS.CHARACTER_DELETED, (message: CharacterDeletedMessage) => {
      setSavedCharacters(message.characters, useGameStore.getState().maxCharacters);
    });

    // Simulation messages (NPC ambient actions, conversations, reactions)
    socket.on(SERVER_EVENTS.SIMULATION, (message: SimulationMessage) => {
      // Convert simulation message to OutputLine format for terminal display
      const line: OutputLine = {
        text: '', // Will be rendered specially by Terminal
        style: 'simulation',
        simType: message.subtype,
        npcName: message.npcName,
        action: message.action,
        says: message.says,
        lines: message.lines?.map((l) => ({
          npcName: l.npcName,
          action: l.action,
          says: l.says,
        })),
      };
      addLines([line]);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    setConnected,
    setConnecting,
    setPlayerIdentity,
    setSavedCharacters,
    setClassOptions,
    setShowCharacterSelect,
    addLines,
    setPlayer,
    updatePlayer,
    setRoom,
    setTime,
    setWeather,
    getStoredPlayerId,
    getLastCharacterId,
    setLastCharacterId,
    enterGame,
  ]);

  // Send a command to the server
  const sendCommand = useCallback((input: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      addLines([{ text: 'Not connected to server.', style: 'error' }]);
      return;
    }

    // Clear auto-resume on explicit quit so WELCOME doesn't auto-load
    const cmd = input.trim().toLowerCase();
    if (cmd === 'quit' || cmd === 'logout' || cmd === 'exit') {
      useGameStore.getState().clearLastCharacterId();
    }

    socket.emit(CLIENT_EVENTS.COMMAND, { type: 'command', input });
  }, [addLines]);

  // Request a full state sync
  const requestSync = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      return;
    }

    socket.emit(CLIENT_EVENTS.SYNC_REQUEST, { type: 'sync_request' });
  }, []);

  // Create a new character
  const createCharacter = useCallback((name: string, className: ClassName) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      addLines([{ text: 'Not connected to server.', style: 'error' }]);
      return;
    }

    socket.emit(CLIENT_EVENTS.CREATE_CHARACTER, {
      type: 'create_character',
      name,
      className,
    });
  }, [addLines]);

  // Load an existing character
  const loadCharacter = useCallback((characterId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      addLines([{ text: 'Not connected to server.', style: 'error' }]);
      return;
    }

    socket.emit(CLIENT_EVENTS.LOAD_CHARACTER, {
      type: 'load_character',
      characterId,
    });
  }, [addLines]);

  // Delete a character
  const deleteCharacter = useCallback((characterId: string, confirmName: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      addLines([{ text: 'Not connected to server.', style: 'error' }]);
      return;
    }

    socket.emit(CLIENT_EVENTS.DELETE_CHARACTER, {
      type: 'delete_character',
      characterId,
      confirmName,
    });
  }, [addLines]);

  // Link a player code from another device
  const linkPlayerCode = useCallback((code: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      addLines([{ text: 'Not connected to server.', style: 'error' }]);
      return;
    }

    socket.emit(CLIENT_EVENTS.LINK_PLAYER_CODE, {
      type: 'link_player_code',
      code,
    });
  }, [addLines]);

  return {
    sendCommand,
    requestSync,
    createCharacter,
    loadCharacter,
    deleteCharacter,
    linkPlayerCode,
  };
}
