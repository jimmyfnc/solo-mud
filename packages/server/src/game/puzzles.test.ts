/**
 * Tests for the data-driven sequence puzzle system.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WILD_RUNE_GATE_PUZZLE } from '@solo-mud/shared';
import { generateWorld } from '../world/generate';
import { sessionManager } from './session';
import { executeCommand } from '../commands/handlers';
import type { GameSession } from './session';
import { findPuzzleAt, handlePuzzleUse, isPuzzleSolved, resetPuzzlesOnMove } from './puzzles';

function makeSession(id: string): GameSession {
  const { session } = sessionManager.createSession(id, 'PuzzleTester', 'warrior');
  return session;
}

describe('sequence puzzles', () => {
  let session: GameSession;

  beforeEach(() => {
    session = makeSession(`puzzle-test-${Math.random().toString(36).slice(2)}`);
  });

  it('rune gate puzzle exists at the Ruined Gate', () => {
    const puzzle = findPuzzleAt(session.world, 'wild_ruins_gate');
    expect(puzzle).toBeDefined();
    expect(puzzle!.id).toBe(WILD_RUNE_GATE_PUZZLE);
    expect(puzzle!.solution).toEqual(['sun', 'moon', 'star']);
  });

  it('generic use shows prompt and hint', () => {
    const puzzle = findPuzzleAt(session.world, 'wild_ruins_gate')!;
    const output = handlePuzzleUse(session, puzzle, 'runes');
    const text = output.map(l => l.text).join(' ');
    expect(text).toContain('sun');
    expect(text).toContain('Day dies first');
  });

  it('correct sequence solves the puzzle', () => {
    const puzzle = findPuzzleAt(session.world, 'wild_ruins_gate')!;
    handlePuzzleUse(session, puzzle, 'sun rune');
    handlePuzzleUse(session, puzzle, 'moon rune');
    const output = handlePuzzleUse(session, puzzle, 'star rune');

    expect(isPuzzleSolved(session, WILD_RUNE_GATE_PUZZLE)).toBe(true);
    expect(output.some(l => l.text.includes('portcullis grinds upward'))).toBe(true);
  });

  it('wrong sequence resets progress without solving', () => {
    const puzzle = findPuzzleAt(session.world, 'wild_ruins_gate')!;
    handlePuzzleUse(session, puzzle, 'star rune');
    handlePuzzleUse(session, puzzle, 'moon rune');
    const output = handlePuzzleUse(session, puzzle, 'sun rune');

    expect(isPuzzleSolved(session, WILD_RUNE_GATE_PUZZLE)).toBe(false);
    expect(session.puzzleProgress?.[WILD_RUNE_GATE_PUZZLE]).toBeUndefined();
    expect(output.some(l => l.text.includes('mechanism resets'))).toBe(true);
  });

  it('repeating an element does not advance the sequence', () => {
    const puzzle = findPuzzleAt(session.world, 'wild_ruins_gate')!;
    handlePuzzleUse(session, puzzle, 'sun rune');
    const output = handlePuzzleUse(session, puzzle, 'sun rune');
    expect(output.some(l => l.text.includes('already been activated'))).toBe(true);
    expect(session.puzzleProgress?.[WILD_RUNE_GATE_PUZZLE]).toEqual(['sun']);
  });

  it('gated exit blocks movement until solved (via commands)', () => {
    session.player.locationId = 'wild_ruins_gate';

    // Try to walk west through the sealed gate
    const blocked = executeCommand(session, 'west');
    expect(blocked.output.some(l => l.text.includes('portcullis seals'))).toBe(true);
    expect(session.player.locationId).toBe('wild_ruins_gate');

    // Solve via the use command
    executeCommand(session, 'use sun rune');
    executeCommand(session, 'use moon rune');
    executeCommand(session, 'use star rune');
    expect(isPuzzleSolved(session, WILD_RUNE_GATE_PUZZLE)).toBe(true);

    // Now the way is open
    executeCommand(session, 'west');
    expect(session.player.locationId).toBe('wild_watchtower');
  });

  it('solved state is per-player', () => {
    const other = makeSession(`puzzle-test-other-${Math.random().toString(36).slice(2)}`);
    const puzzle = findPuzzleAt(session.world, 'wild_ruins_gate')!;
    handlePuzzleUse(session, puzzle, 'sun rune');
    handlePuzzleUse(session, puzzle, 'moon rune');
    handlePuzzleUse(session, puzzle, 'star rune');

    expect(isPuzzleSolved(session, WILD_RUNE_GATE_PUZZLE)).toBe(true);
    expect(isPuzzleSolved(other, WILD_RUNE_GATE_PUZZLE)).toBe(false);
  });

  it('resetOnLeavePrefix clears solved state when leaving the area', () => {
    const world = generateWorld({ seed: 'puzzle-reset-test', nodeCount: 1, extraEdges: 0, lockedEdges: 0 });
    world.puzzles!['test_reset'] = {
      id: 'test_reset',
      locationId: 'wild_marsh_hut',
      keyword: 'totem',
      elements: [{ id: 'a', name: 'bone totem' }],
      solution: ['a'],
      prompt: 'p', solvedText: 's', failText: 'f',
      alreadySolvedText: 'as', gateLockedText: 'g',
      resetOnLeavePrefix: 'wild_',
    };
    session.world = world;
    session.puzzlesSolved = ['test_reset'];

    resetPuzzlesOnMove(session, world, 'wild_road_1', 'town_outside_walls');
    expect(isPuzzleSolved(session, 'test_reset')).toBe(false);
  });
});
