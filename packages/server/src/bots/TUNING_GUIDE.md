# Bot System Tuning Guide

This guide explains how to adjust bot behaviors for different gameplay experiences.

## Quick Reference

| Want to...                    | File                  | Constants to change               |
|-------------------------------|-----------------------|-----------------------------------|
| Make bots more aggressive     | goals.ts              | Lower `survive` priority formula  |
| Make bots flee more often     | actions.ts            | Lower flee base cost              |
| Change AI speed               | bot-executor.ts       | `MIN_TICK_INTERVAL`               |
| Adjust conversation frequency | bot-executor.ts       | Greeting/idle chance values       |
| Change death penalties        | death-handler.ts      | `XP_LOSS_PERCENT`, `GOLD_LOSS_PERCENT` |
| Adjust population             | BotSpawnConfig        | `minPopulation`, `maxPopulation`  |

## Adjusting Bot Aggression/Passivity

Bot combat behavior is controlled by the interplay between goals and actions.

### Making Bots More Aggressive

1. **Lower survival goal priority** in `goals.ts`:
   ```typescript
   // In survive goal getPriority():
   // Change: if (hpPercent < 30) { priority = 100 - braveryMod * 30; }
   // To:     if (hpPercent < 20) { priority = 80 - braveryMod * 30; }
   ```
   This makes bots fight until 20% HP instead of 30%.

2. **Increase flee action cost** in `actions.ts`:
   ```typescript
   // In flee action getCost():
   // Change: let cost = 20 + bot.botProfile.personality.bravery / 5;
   // To:     let cost = 30 + bot.botProfile.personality.bravery / 5;
   ```
   This makes fleeing less attractive, even for cowardly bots.

3. **Reduce death trauma effect** in `actions.ts`:
   ```typescript
   // In flee action getCost():
   // Change: cost -= 10; (after recent death)
   // To:     cost -= 5;
   ```
   Bots recover from death trauma faster.

### Making Bots More Passive

1. **Raise survival goal priority**:
   ```typescript
   // In survive goal getPriority():
   // Change: if (hpPercent < 30) { ... }
   // To:     if (hpPercent < 50) { ... }
   ```
   Bots start worrying about survival at 50% HP.

2. **Decrease flee action cost**:
   ```typescript
   // In flee action getCost():
   // Change: let cost = 20 + ...
   // To:     let cost = 10 + ...
   ```
   Fleeing becomes more attractive.

3. **Increase death trauma duration** in `goals.ts`:
   ```typescript
   // In survive goal getPriority():
   // Change: d.timestamp < 300000 (5 minutes)
   // To:     d.timestamp < 600000 (10 minutes)
   ```
   Death trauma lasts longer, making bots more cautious.

## Changing Population Density

Population is managed by `BotSpawnConfig` in your game setup.

### Low Population (Sparse World)

```typescript
const config: BotSpawnConfig = {
  minPopulation: 3,     // Very few bots required
  maxPopulation: 8,     // Cap total bots
  namedBotCount: 5,     // Fewer named characters
  spawnLocations: ['town_square'], // Single spawn point
  levelRange: [1, 5],
  namedBotRespawnDelay: 2880, // Longer respawn = fewer bots
};
```

### High Population (Busy World)

```typescript
const config: BotSpawnConfig = {
  minPopulation: 15,    // Many bots always present
  maxPopulation: 30,    // Allow large crowds
  namedBotCount: 20,    // More named characters
  spawnLocations: ['town_square', 'town_inn', 'town_market', 'town_gate'],
  levelRange: [1, 10],
  namedBotRespawnDelay: 720, // Quick respawn = more bots
};
```

### Performance Considerations

Each bot consumes:
- ~10KB memory for state
- CPU time every tick (3 seconds by default)
- Network bandwidth for position updates

Recommendations:
- Under 20 bots: No concerns
- 20-50 bots: Monitor server CPU
- 50+ bots: Consider increasing tick interval

## Modifying Conversation Frequency

Conversation triggers are in `bot-executor.ts`.

### Making Bots Chattier

```typescript
// In checkConversationTriggers():

// Increase greeting chance
if (Math.random() < 0.5) {  // Was 0.3 (30%), now 50%
  return { type: 'greeting', targetName: context.playerEntered };
}

// Increase idle chat chance
if (!bot.inCombat && Math.random() < 0.15) {  // Was 0.05 (5%), now 15%
  return { type: 'idle' };
}
```

### Making Bots Quieter

```typescript
// Decrease greeting chance
if (Math.random() < 0.1) {  // Was 0.3 (30%), now 10%
  return { type: 'greeting', targetName: context.playerEntered };
}

// Decrease idle chat chance
if (!bot.inCombat && Math.random() < 0.01) {  // Was 0.05 (5%), now 1%
  return { type: 'idle' };
}
```

### Expected Chat Frequency

With default 3-second tick and 5% idle chance:
- ~1 idle chat per bot per minute
- ~0.3 greetings per player entry

## Adjusting Death Penalties

Death penalties are in `death-handler.ts`.

### Harsher Death (Hardcore Feel)

```typescript
export function calculateDeathPenalties(bot: BotPlayer, _info: BotDeathInfo): BotDeathPenalties {
  const XP_LOSS_PERCENT = 0.15;   // 15% XP loss (was 5%)
  const GOLD_LOSS_PERCENT = 0.25; // 25% gold loss (was 10%)
  // ...
}
```

### Lighter Death (Casual Feel)

```typescript
export function calculateDeathPenalties(bot: BotPlayer, _info: BotDeathInfo): BotDeathPenalties {
  const XP_LOSS_PERCENT = 0.02;   // 2% XP loss
  const GOLD_LOSS_PERCENT = 0.05; // 5% gold loss
  // ...
}
```

### Personality Thresholds

Adjust when bots fear vs. seek revenge:

```typescript
// More bots seek revenge (aggressive world)
const FEAR_THRESHOLD = 20;    // Only very cowardly bots fear
const REVENGE_THRESHOLD = 50; // Most bots seek revenge

// More bots are cautious (peaceful world)
const FEAR_THRESHOLD = 40;    // Many bots become fearful
const REVENGE_THRESHOLD = 80; // Only very brave seek revenge
```

## AI Tick Timing

The tick interval in `bot-executor.ts` controls overall pacing.

### Fast-Paced (Action Game Feel)

```typescript
const MIN_TICK_INTERVAL = 1500; // 1.5 seconds
```
- Bots react quickly
- Combat feels intense
- Higher server load

### Normal Pace (Default)

```typescript
const MIN_TICK_INTERVAL = 3000; // 3 seconds
```
- Human-like reaction time
- Balanced feel
- Moderate server load

### Slow Pace (Relaxed Feel)

```typescript
const MIN_TICK_INTERVAL = 5000; // 5 seconds
```
- Bots feel contemplative
- Less frantic combat
- Lower server load

### Variable Pacing

For different areas, you could extend the system:

```typescript
// Example: slower in towns, faster in dungeons
function getTickInterval(locationId: string): number {
  if (locationId.startsWith('town_')) return 5000;
  if (locationId.startsWith('sewer_')) return 2000;
  return 3000;
}
```

## Personality Trait Effects Summary

Each trait (0-100 scale) affects multiple behaviors:

### Bravery
| Value | Effect |
|-------|--------|
| 0-29  | Flees early, fears killers after death |
| 30-70 | Balanced, gains caution after death |
| 71-100| Fights to near-death, seeks revenge |

### Patience
| Value | Effect |
|-------|--------|
| 0-30  | Finds resting expensive, acts impulsively |
| 31-70 | Balanced |
| 71-100| Prioritizes leveling, doesn't mind resting |

### Greed
| Value | Effect |
|-------|--------|
| 0-30  | Doesn't prioritize wealth, spends freely |
| 31-70 | Balanced |
| 71-100| Strong wealth priority, dislikes buying |

### Sociability
| Value | Effect |
|-------|--------|
| 0-30  | Rarely talks, low social priority |
| 31-70 | Moderate social behavior |
| 71-100| Frequently talks, seeks company when lonely |

### Aggression
| Value | Effect |
|-------|--------|
| 0-30  | Very upset by death (opinion -50) |
| 31-70 | Moderate death reaction |
| 71-100| Accepts combat losses (opinion -30) |

## Testing Changes

After making tuning changes:

1. **Spawn test bots** with `/bot spawn test_bot`
2. **Observe behavior** in different scenarios:
   - Combat (do they flee appropriately?)
   - Social (are they too chatty/quiet?)
   - Movement (are they exploring or idle?)
3. **Check server load** with many bots
4. **Adjust iteratively** - small changes are easier to evaluate

## Common Issues

### Bots Never Flee
- Check if flee cost is too high
- Verify survival goal priority is activating
- Ensure bots aren't all high-bravery

### Bots Are Too Chatty
- Lower idle chat chance (currently 5%)
- Lower greeting chance (currently 30%)
- Increase tick interval

### Bots Cluster in One Location
- Add more spawn locations
- Increase explore goal priority
- Lower travel action cost

### Bots Die Too Often
- Lower their aggression via personality traits
- Increase heal_up goal priority
- Decrease the level of spawned creatures
