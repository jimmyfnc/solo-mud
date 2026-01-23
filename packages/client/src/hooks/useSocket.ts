import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  SERVER_EVENTS,
  CLIENT_EVENTS,
  type OutputMessage,
  type RoomMessage,
  type PlayerUpdateMessage,
  type TimeMessage,
  type ErrorMessage,
  type SyncMessage,
} from '@solo-mud/shared';
import { useGameStore } from '../store/gameStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export interface UseSocketReturn {
  sendCommand: (input: string) => void;
  requestSync: () => void;
}

/**
 * Hook for managing Socket.io connection to the game server.
 */
export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const {
    setConnected,
    setConnecting,
    addLines,
    setPlayer,
    updatePlayer,
    setRoom,
    setTime,
    setWeather,
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
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [setConnected, setConnecting, addLines, setPlayer, updatePlayer, setRoom, setTime, setWeather]);

  // Send a command to the server
  const sendCommand = useCallback((input: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      addLines([{ text: 'Not connected to server.', style: 'error' }]);
      return;
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

  return {
    sendCommand,
    requestSync,
  };
}
