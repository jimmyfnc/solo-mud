// packages/server/src/town/town.test.ts
/**
 * Integration tests for Easthollow town functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateWorld } from '../world/generate';
import { createPlayer } from '../character';
import { executeCommand } from '../commands/handlers';
import type { GameSession } from '../game/session';

function createTestSession(): GameSession {
  const world = generateWorld({
    seed: 'test-town-integration',
    nodeCount: 10,
    extraEdges: 2,
    lockedEdges: 1,
  });

  const player = createPlayer({
    id: 'test-player',
    name: 'Tester',
    className: 'warrior',
    startLocationId: world.startId,
  });

  return {
    id: 'test-session',
    playerId: 'test-player',
    player,
    combatStats: { attackPower: 10, spellPower: 5, defense: 5, magicResist: 5, hitChance: 0.9, dodgeChance: 0.1, critChance: 0.1, critDamage: 1.5, attackSpeed: 2 },
    world,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
}

describe('Easthollow town integration', () => {
  let session: GameSession;

  beforeEach(() => {
    session = createTestSession();
  });

  it('should spawn player in town inn', () => {
    expect(session.player.locationId).toBe('town_inn');
  });

  it('should show NPC in look output', () => {
    const result = executeCommand(session, 'look');
    const text = result.output.map(o => o.text).join(' ');
    expect(text).toContain('Mira');
  });

  it('should allow talking to NPC', () => {
    const result = executeCommand(session, 'talk mira');
    const text = result.output.map(o => o.text).join(' ');
    expect(text).toContain('Mira');
    expect(text).toContain('1.');
  });

  it('should track tutorial progress', () => {
    expect(session.player.tutorial.completedSteps).toHaveLength(0);

    executeCommand(session, 'talk mira');
    executeCommand(session, 'say 3'); // "How do I look around?" (option 3, teaches talk_mira)

    expect(session.player.tutorial.completedSteps).toContain('talk_mira');
  });

  it('should navigate to training yard', () => {
    // Inn -> go out -> Eastern Road -> west -> Town Square -> north -> Training Yard
    executeCommand(session, 'go out');
    expect(session.player.locationId).toBe('town_east_road');

    executeCommand(session, 'west');
    expect(session.player.locationId).toBe('town_square');

    executeCommand(session, 'north');
    expect(session.player.locationId).toBe('town_training');
  });

  it('should show tutorial progress', () => {
    const result = executeCommand(session, 'tutorial');
    const text = result.output.map(o => o.text).join(' ');
    expect(text).toContain('Tutorial Progress');
    expect(text).toContain('[ ]'); // Uncompleted steps
  });
});
