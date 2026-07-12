import type { HotTopic } from '@solo-mud/shared';

// Event types the simulation listens for
export type SimulationEventType =
  | 'creature_killed'
  | 'player_death'
  | 'player_levelup'
  | 'boss_defeated'
  | 'npc_death'
  | 'player_enter_location'
  | 'player_leave_location'
  | 'shop_shortage'
  | 'time_changed';

export interface SimulationEventData {
  creature_killed: { creatureId: string; killerId: string; locationId: string };
  player_death: { playerId: string; playerName?: string; locationId: string; cause?: string };
  player_levelup: { playerId: string; playerName: string; newLevel: number; locationId: string };
  boss_defeated: { bossName: string; playerName: string; locationId: string };
  npc_death: { npcId: string; npcName: string; locationId: string; cause?: string };
  player_enter_location: { playerId: string; playerName: string; locationId: string; fromLocationId?: string };
  player_leave_location: { playerId: string; playerName: string; locationId: string; toLocationId: string };
  shop_shortage: { merchantId: string; merchantName: string; itemName: string; quantity: number; locationId: string };
  time_changed: { newTime: string; oldTime: string };
}

type EventHandler<T extends SimulationEventType> = (data: SimulationEventData[T]) => void;

export class SimulationEventBus {
  private listeners = new Map<SimulationEventType, Set<(data: unknown) => void>>();

  on<T extends SimulationEventType>(event: T, handler: EventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as (data: unknown) => void);
  }

  off<T extends SimulationEventType>(event: T, handler: EventHandler<T>): void {
    this.listeners.get(event)?.delete(handler as (data: unknown) => void);
  }

  emit<T extends SimulationEventType>(event: T, data: SimulationEventData[T]): void {
    this.listeners.get(event)?.forEach(handler => handler(data));
  }
}

// Hot topic templates for different event types
export function createHotTopic(
  eventType: 'boss_defeated' | 'player_death' | 'npc_death' | 'player_levelup' | 'shop_shortage',
  data: Record<string, string | number>
): HotTopic {
  const now = Date.now();
  const id = `${eventType}_${now}`;

  switch (eventType) {
    case 'boss_defeated':
      return {
        id,
        headline: `the defeat of ${data.bossName}`,
        severity: 'major',
        decayHours: 72,
        createdAt: now,
        reactions: {
          shocked: [
            `Someone actually killed ${data.bossName}!`,
            `Did you hear? ${data.bossName} is dead!`,
            `I can't believe it... ${data.bossName}, gone.`,
          ],
          curious: [
            `I heard ${data.bossName} was big as a horse...`,
            `Wonder what treasure it was guarding.`,
            `They say ${data.playerName} did it alone.`,
          ],
          amused: [
            'Good riddance to bad rubbish, I say.',
            'One less monster to worry about.',
            "Maybe now the sewers will be safer. ...Probably not.",
          ],
        },
      };

    case 'player_death':
      return {
        id,
        headline: `the death of an adventurer`,
        severity: 'minor',
        decayHours: 24,
        createdAt: now,
        reactions: {
          sad: [
            'Another adventurer fell... such a shame.',
            "The sewers claim another one.",
            "They tried their best, I'm sure.",
          ],
          curious: [
            'Wonder what got them.',
            'Did anyone see what happened?',
          ],
        },
      };

    case 'npc_death':
      return {
        id,
        headline: `the death of ${data.npcName}`,
        severity: 'major',
        decayHours: 168, // 1 week
        createdAt: now,
        reactions: {
          shocked: [
            `Gods preserve us... ${data.npcName}? Dead?`,
            `I can't believe it...`,
            `${data.npcName} is gone? This can't be real.`,
          ],
          angry: [
            'Who would do such a thing?!',
            'Find whoever did this!',
            "There'll be justice for this.",
          ],
          sad: [
            `${data.npcName} was always so kind...`,
            "The town won't be the same.",
            'I just saw them yesterday...',
          ],
        },
      };

    case 'player_levelup':
      return {
        id,
        headline: `${data.playerName}'s growing strength`,
        severity: 'minor',
        decayHours: 12,
        createdAt: now,
        reactions: {
          curious: [
            `That adventurer ${data.playerName} is getting stronger.`,
            `Level ${data.newLevel} already? Impressive.`,
          ],
          amused: [
            'Another hero in the making, perhaps.',
            "Let's hope they use that strength wisely.",
          ],
        },
      };

    case 'shop_shortage':
      return {
        id,
        headline: `${data.merchantName}'s shortage of ${data.itemName}`,
        severity: 'minor',
        decayHours: 24,
        createdAt: now,
        reactions: {
          curious: [
            `${data.merchantName} is paying well for ${data.itemName}.`,
            `The work board says the shops need ${data.itemName}.`,
          ],
          amused: [
            `Another shortage? Easthollow eats supplies faster than adventurers eat rations.`,
          ],
        },
      };

    default:
      throw new Error(`Unknown event type: ${eventType}`);
  }
}

// Global event bus instance
export const simulationEventBus = new SimulationEventBus();
