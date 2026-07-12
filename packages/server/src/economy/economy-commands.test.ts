import { beforeEach, describe, expect, it } from 'vitest';
import { createPlayer, computePlayerCombatStats } from '../character';
import { executeCommand } from '../commands/handlers';
import type { GameSession } from '../game/session';
import { generateWorld } from '../world/generate';
import { processEconomyTick } from './economy-manager';
import { createBotPlayer, createBotSession } from '../bots/bot-factory';
import { BotExecutor } from '../bots/bot-executor';

describe('economy commands', () => {
  let session: GameSession;

  beforeEach(() => {
    const world = generateWorld({ seed: 'economy-command-test', nodeCount: 1, extraEdges: 0, lockedEdges: 0 });
    const player = createPlayer({ id: 'player', name: 'Trader', className: 'warrior', startLocationId: 'town_general' });
    player.currency = { copper: 0, silver: 20, gold: 0 };
    session = {
      id: 'session',
      playerId: 'player',
      player,
      world,
      combatStats: computePlayerCombatStats(player, world.items),
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
  });

  it('moves money and finite stock when purchasing', () => {
    const shop = session.world.npcs['npc_thom']!.shop!;
    const pick = shop.items.find(item => item.baseId === 'mining_pick')!;
    const stockBefore = pick.stock!;
    const cashBefore = shop.cash!;

    const result = executeCommand(session, 'buy mining pick');

    expect(result.output[0]?.style).toBe('success');
    expect(pick.stock).toBe(stockBefore - 1);
    expect(shop.cash).toBe(cashBefore + 30);
    expect(session.player.inventory.some(slot => session.world.items[slot.itemId]?.baseId === 'mining_pick')).toBe(true);
  });

  it('shows shared work orders on the town board', () => {
    const shop = session.world.npcs['npc_elwin']!.shop!;
    shop.items.find(item => item.baseId === 'health_potion')!.stock = 0;
    shop.materials = { ...shop.materials, medicinal_herb: 0 };
    processEconomyTick(session.world);
    session.player.locationId = 'town_square';

    const result = executeCommand(session, 'orders');

    expect(result.output.some(line => line.text.includes('Medicinal Herb'))).toBe(true);
    expect(result.output.some(line => line.text.includes('Elwin'))).toBe(true);
  });

  it('gathers resources and fulfills a merchant order', () => {
    executeCommand(session, 'buy mining pick');
    session.player.locationId = 'wild_foothills';
    const mineResult = executeCommand(session, 'mine iron ore');
    expect(mineResult.output[0]?.style).toBe('success');

    const shop = session.world.npcs['npc_kira']!.shop!;
    shop.items.find(item => item.baseId === 'iron_sword')!.stock = 0;
    shop.materials = { ...shop.materials, iron_ore: 0 };
    processEconomyTick(session.world);
    session.player.locationId = 'town_blacksmith';
    const currencyBefore = session.player.currency;

    const turnInResult = executeCommand(session, 'turnin iron ore 2');

    expect(turnInResult.output[0]?.style).toBe('success');
    const beforeCopper = currencyBefore.copper + currencyBefore.silver * 10 + currencyBefore.gold * 100;
    const afterCopper = session.player.currency.copper + session.player.currency.silver * 10 + session.player.currency.gold * 100;
    expect(afterCopper).toBeGreaterThan(beforeCopper);
    expect(shop.materials['iron_ore']).toBe(2);
  });

  it('assigns suitable bots to deliver materials for open orders', () => {
    const shop = session.world.npcs['npc_kira']!.shop!;
    shop.items.find(item => item.baseId === 'iron_sword')!.stock = 0;
    shop.materials = { ...shop.materials, iron_ore: 0 };
    processEconomyTick(session.world);

    const bot = createBotPlayer({
      id: 'worker',
      name: 'Worker',
      className: 'warrior',
      startLocationId: 'town_blacksmith',
      isNamed: false,
    });
    bot.botProfile.personality.greed = 80;
    session.world.items['bot_ore'] = {
      id: 'bot_ore',
      baseId: 'iron_ore',
      name: 'Iron Ore',
      tags: ['material', 'ore'],
      rarity: 'common',
      affixes: [],
    };
    bot.inventory.push({ itemId: 'bot_ore', quantity: 1 });
    const botSession = createBotSession(bot, session.world);

    expect(new BotExecutor().getEconomyCommand(botSession)).toBe('turnin Iron Ore');
  });
});
