/**
 * Data-driven sequence puzzles.
 *
 * A SequencePuzzle lives in world data (see WILD_PUZZLES); progress and
 * solved state are per-player session state, so each player solves puzzles
 * for themselves even in the shared world.
 */

import type { OutputLine, SequencePuzzle, World } from '@solo-mud/shared';
import type { GameSession } from './session';

/** Find the puzzle located in a given room, if any. */
export function findPuzzleAt(world: World, locationId: string): SequencePuzzle | undefined {
  return Object.values(world.puzzles ?? {}).find((p) => p.locationId === locationId);
}

/** Whether "use <target>" is aimed at this puzzle (keyword or element name). */
export function targetsPuzzle(puzzle: SequencePuzzle, targetLower: string): boolean {
  if (targetLower.includes(puzzle.keyword.toLowerCase())) return true;
  return puzzle.elements.some((e) => targetLower.includes(e.name.toLowerCase()));
}

/** Whether the player has solved a puzzle this session. */
export function isPuzzleSolved(session: GameSession, puzzleId: string): boolean {
  return session.puzzlesSolved?.includes(puzzleId) ?? false;
}

/**
 * Handle a "use" interaction aimed at a puzzle.
 * Mirrors the sewer valve conventions: elements activate in sequence; a
 * wrong order resets; solving opens the gated exit for this player.
 */
export function handlePuzzleUse(
  session: GameSession,
  puzzle: SequencePuzzle,
  targetLower: string
): OutputLine[] {
  if (isPuzzleSolved(session, puzzle.id)) {
    return [{ text: puzzle.alreadySolvedText, style: 'normal' }];
  }

  // Which element (if any) is the player activating?
  const element = puzzle.elements.find((e) => targetLower.includes(e.name.toLowerCase()))
    // Allow bare element ids too ("use sun")
    ?? puzzle.elements.find((e) => targetLower.includes(e.id.toLowerCase()));

  if (!element) {
    // Generic interaction — describe the puzzle and show the clue
    const output: OutputLine[] = [{ text: puzzle.prompt, style: 'normal' }];
    if (puzzle.hint) {
      output.push({ text: puzzle.hint, style: 'system' });
    }
    output.push({
      text: `Try "use ${puzzle.elements[0]?.name ?? puzzle.keyword}".`,
      style: 'system',
    });
    return output;
  }

  const progress = (session.puzzleProgress ??= {});
  const sequence = (progress[puzzle.id] ??= []);

  if (sequence.includes(element.id)) {
    return [{ text: `The ${element.name} has already been activated. Nothing more happens.`, style: 'normal' }];
  }

  sequence.push(element.id);
  const output: OutputLine[] = [{
    text: (puzzle.activateText ?? 'You activate the {name}.').replace('{name}', element.name),
    style: 'normal',
  }];

  if (sequence.length === puzzle.solution.length) {
    const correct = sequence.every((id, i) => id === puzzle.solution[i]);
    delete progress[puzzle.id];

    if (correct) {
      (session.puzzlesSolved ??= []).push(puzzle.id);
      output.push({ text: '', style: 'normal' });
      output.push({ text: puzzle.solvedText, style: 'success' });
    } else {
      output.push({ text: '', style: 'normal' });
      output.push({ text: puzzle.failText, style: 'normal' });
    }
    return output;
  }

  const remaining = puzzle.solution.length - sequence.length;
  output.push({ text: `${remaining} remain${remaining > 1 ? '' : 's'}.`, style: 'system' });
  return output;
}

/**
 * Reset puzzles whose resetOnLeavePrefix area the player just left.
 * Call after the player moves.
 */
export function resetPuzzlesOnMove(
  session: GameSession,
  world: World,
  fromId: string,
  toId: string
): void {
  for (const puzzle of Object.values(world.puzzles ?? {})) {
    const prefix = puzzle.resetOnLeavePrefix;
    if (!prefix) continue;
    if (fromId.startsWith(prefix) && !toId.startsWith(prefix)) {
      if (session.puzzlesSolved) {
        session.puzzlesSolved = session.puzzlesSolved.filter((id) => id !== puzzle.id);
      }
      if (session.puzzleProgress) {
        delete session.puzzleProgress[puzzle.id];
      }
    }
  }
}
