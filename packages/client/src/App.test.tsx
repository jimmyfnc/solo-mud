import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useGameStore } from './store/gameStore';

vi.mock('./hooks', () => ({
  useSocket: () => ({
    sendCommand: vi.fn(),
    createCharacter: vi.fn(),
    loadCharacter: vi.fn(),
    deleteCharacter: vi.fn(),
    linkPlayerCode: vi.fn(),
  }),
}));

describe('App', () => {
  beforeEach(() => {
    useGameStore.setState({
      connected: false,
      connecting: false,
      showCharacterSelect: true,
      showCharacterCreation: false,
      player: null,
      playerCode: null,
      savedCharacters: [],
      classOptions: [],
    });
  });

  afterEach(cleanup);

  it('renders the character welcome screen while disconnected', () => {
    render(<App />);

    expect(screen.getAllByRole('heading', { name: 'Solo MUD' })).toHaveLength(2);
    expect(screen.getByText('Disconnected')).toBeTruthy();
    expect(screen.getByText(/Create New Character/)).toBeTruthy();
  });
});
