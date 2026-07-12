import {
  formatPrice,
  getNpcsAtLocation,
  type NPC,
  type OutputLine,
} from '@solo-mud/shared';
import type { CommandContext, CommandResult } from './handlers';
import {
  fulfillWorkOrder,
  gatherResource,
  getItemDisplayName,
  getOpenWorkOrders,
} from '../economy/economy-manager';

function merchantAtPlayer(ctx: CommandContext): NPC | undefined {
  const { world, player } = ctx.session;
  const location = world.locations[player.locationId];
  if (!location) return undefined;
  return getNpcsAtLocation(
    world.npcs,
    location.npcs ?? [],
    location.id,
    world.time.timeOfDay
  ).find(npc => npc.shop);
}

export function handleWorkOrders(ctx: CommandContext): CommandResult {
  const { world, player } = ctx.session;
  if (player.locationId !== 'town_square') {
    return {
      output: [{ text: 'The town work-order board is in Easthollow Square.', style: 'system' }],
    };
  }

  const orders = getOpenWorkOrders(world);
  if (orders.length === 0) {
    return { output: [{ text: 'The work-order board is empty.', style: 'normal' }] };
  }

  const output: OutputLine[] = [
    { text: 'Easthollow Work Orders', style: 'system' },
    { text: '', style: 'normal' },
  ];
  for (const order of orders) {
    const merchant = world.npcs[order.merchantId];
    output.push({
      text: `  ${merchant?.name ?? order.merchantId}: ${order.quantityRemaining} ${getItemDisplayName(order.materialBaseId)} at ${formatPrice(order.unitPrice)} each`,
      style: 'normal',
    });
  }
  output.push({ text: '', style: 'normal' });
  output.push({ text: "Deliver materials with 'turnin <material> [quantity]' at the requesting shop.", style: 'system' });
  return { output };
}

export function handleGatherResource(ctx: CommandContext): CommandResult {
  const query = ctx.parsed.args.join(' ') || ctx.parsed.command;
  const result = gatherResource(ctx.session.world, ctx.session.player, query);
  return {
    output: [{ text: result.message, style: result.success ? 'success' : 'error' }],
    updatePlayer: result.success,
  };
}

export function handleTurnIn(ctx: CommandContext): CommandResult {
  const merchant = merchantAtPlayer(ctx);
  if (!merchant?.shop) {
    return { output: [{ text: 'There is no merchant here accepting deliveries.', style: 'error' }] };
  }

  const args = [...ctx.parsed.args];
  const lastArg = args.at(-1);
  const parsedQuantity = lastArg ? Number.parseInt(lastArg, 10) : Number.NaN;
  const quantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : undefined;
  if (quantity !== undefined) args.pop();
  const query = args.join(' ');
  if (!query) {
    return { output: [{ text: 'Turn in what? Use "turnin <material> [quantity]".', style: 'error' }] };
  }

  const result = fulfillWorkOrder(
    ctx.session.world,
    ctx.session.player,
    merchant.id,
    query,
    quantity
  );
  return {
    output: [{ text: result.message, style: result.success ? 'success' : 'error' }],
    updatePlayer: result.success,
  };
}
