# Interactive Props System Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Easthollow from a static backdrop into a living, breathing town where every corner rewards exploration and interaction.

**Architecture:** Data-driven prop system with tiered interactions (signature/interactive/flavor), context-sensitive verbs, tag-based item matching, and per-player cooldowns.

**Tech Stack:** TypeScript, shared prop definitions, server-side interaction handlers.

---

## Table of Contents

1. [Overview](#overview)
2. [Data Structures](#data-structures)
3. [Tiered Prop System](#tiered-prop-system)
4. [Verb Handling](#verb-handling)
5. [Item Interactions](#item-interactions)
6. [Cooldown System](#cooldown-system)
7. [Props by Location](#props-by-location)
8. [File Structure](#file-structure)
9. [Future Integration Points](#future-integration-points)

---

## Overview

### Current State
- Props are simple strings in location definitions
- Only 4 hardcoded interactions (well, marker/statue, fire, valve)
- Most props return "nothing special happens"

### Target State
- ~230 props across 13 town locations
- Rich, varied responses for every interaction
- Meaningful rewards for exploration
- Animals, sensory details, hidden discoveries, dynamic elements
- Data-driven system that's easy to extend

### Design Principles
- **Reward curiosity** - Players should want to interact with everything
- **Layered depth** - Signature props are memorable, flavor props add atmosphere
- **No dead ends** - Every interaction gives *something* (even just good flavor text)
- **Discoverable** - Hidden props reward thorough exploration

---

## Data Structures

### Core Types

```typescript
// packages/shared/src/data/props/types.ts

/** Prop interaction tier - determines reward complexity */
export type PropTier = 'signature' | 'interactive' | 'flavor';

/** Reward granted by a prop interaction */
export interface PropReward {
  /** XP amount (small, usually 1-5) */
  xp?: number;
  /** Buff to apply */
  buff?: {
    id: string;
    duration: number;  // minutes
  };
  /** Item base ID to give player */
  item?: string;
  /** Copper amount to give */
  currency?: number;
  /** Lore text to display (separate from interaction text) */
  lore?: string;
  /** Quest flag to set on player */
  unlock?: string;
  /** Remove an item from player inventory */
  consumeItem?: string;
}

/** A single interaction definition */
export interface PropInteraction {
  /** Response message(s) - randomly selected if array */
  text: string | string[];
  /** Cooldown in minutes until this interaction can be used again */
  cooldown?: number;
  /** Rewards granted */
  rewards?: PropReward;
  /** Required item in inventory (not consumed unless in rewards.consumeItem) */
  requiresItem?: string;
  /** Condition function name for special checks */
  condition?: string;
}

/** Tag-based item interaction */
export interface TagInteraction {
  /** Item tags that trigger this interaction */
  itemTags: string[];
  /** Verb that triggers this (optional, defaults to 'use') */
  verb?: string;
  /** Response text (supports ${item} and ${prop} placeholders) */
  text: string;
  /** Result item to give (supports ${item.baseId} placeholder) */
  resultItem?: string;
  /** Effect to apply */
  effect?: string;
  /** Consume the item used */
  consumeItem?: boolean;
}

/** Complete prop definition */
export interface PropDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Interaction tier */
  tier: PropTier;
  /** Verbs that work on this prop */
  verbs: string[];
  /** Tags for item matching (e.g., 'water_source', 'fire') */
  tags?: string[];
  /** Specific item interactions (keyed by item baseId) */
  itemInteractions?: Record<string, PropInteraction>;
  /** Default interaction when no item used */
  defaultInteraction: PropInteraction;
  /** Text for 'examine' command - always available */
  examineText: string[];
  /** If true, prop is hidden until discovered */
  hidden?: boolean;
  /** How to discover hidden prop (e.g., 'search', 'examine wall') */
  discoverVerb?: string;
}
```

### Location Integration

Locations reference props by ID:

```typescript
// In easthollow.ts
[TOWN_INN]: {
  id: TOWN_INN,
  name: 'The Rusty Blade Inn',
  props: [
    'inn_fireplace',
    'inn_ginger_cat',
    'inn_bar_counter',
    'inn_tip_jar',
    'inn_loose_floorboard',  // hidden
    // ... etc
  ],
  // ...
}
```

---

## Tiered Prop System

### Signature Props (~15)
Major interactions with meaningful rewards. These are memorable moments.

| Location | Prop | Primary Interaction |
|----------|------|---------------------|
| Inn | Ginger Tabby Cat | Pet for mood buff, rare mouse gift |
| Inn | Loose Floorboard | Find hidden coins (weekly reset) |
| Square | Wishing Well | Toss coin for fortune + luck buff |
| Square | Street Musician | Tip for song + mood buff |
| Square | Loose Cobblestone | Find coins, rare gem |
| Square | Notice Board | Quest hints, rumors (future: job board) |
| Training | Training Dummy | Practice attacks for XP |
| Training | Buried Practice Coin | Trade to Holt for tip |
| Temple | Offering Bowl | Donate for scaling blessing |
| Temple | Holy Fountain | Cure ailments, fill holy water |
| Temple | Loose Tile | Find holy symbol, show to Anna |
| Blacksmith | Ring of Hammer | Meditative XP for patience |
| Alchemist | Elwin's Journal | Recipe hints (when distracted) |
| General | False Bottom Barrel | Thom's emergency stash |
| Eastern Road | Buried Treasure Map | Wilderness cache location |
| Alley | Loose Brick | Thieves' guild hint + coins |

### Interactive Props (~60)
Light mechanics - small rewards, minor effects, lore reveals.

Examples:
- **Sitting props** (benches, stools): +1 MP regen buff
- **Fire props**: Light torches, warm up
- **Water props**: Fill containers, drink
- **Readable props**: Lore, hints, flavor
- **Animals**: Pet for reactions, feed for follows
- **Sensory props**: Atmosphere, hints at nearby features

### Flavor Props (~155)
Rich randomized text, no mechanical rewards. Still reactive and interesting.

- 3-5 text variants each
- Time-of-day variations where appropriate
- Weather references for outdoor props
- NPC references for world-building
- Occasional humor

---

## Verb Handling

### Supported Verbs

```typescript
// packages/server/src/commands/parser.ts
export const PROP_VERBS = [
  // Universal
  'use', 'examine', 'look',
  // Positional
  'sit', 'lean', 'kneel', 'stand',
  // Physical
  'push', 'pull', 'lift', 'pry', 'kick', 'dig',
  // Combat
  'attack', 'hit', 'shoot',
  // Social
  'pet', 'feed', 'tip', 'talk', 'wave', 'greet',
  // Sensory
  'smell', 'sniff', 'listen', 'taste', 'feel',
  // Object manipulation
  'light', 'ring', 'blow', 'fill', 'drink', 'read',
  // Special
  'toss', 'throw', 'offer', 'donate', 'pray',
  'warm', 'cool', 'stir', 'pump', 'weigh',
  'scatter', 'shoo', 'whistle', 'watch',
  'search', 'take', 'leave',
];
```

### Command Parsing

```typescript
// Verb + target: "sit bench" → { verb: 'sit', target: 'bench' }
// Verb + item + target: "toss coin well" → { verb: 'toss', target: 'well', item: 'coin' }
// Use shorthand: "use bench" → { verb: 'use', target: 'bench' }

interface ParsedPropCommand {
  verb: string;
  target: string;
  item?: string;  // From inventory
}
```

### Verb Validation

```typescript
function handlePropInteraction(ctx: CommandContext): CommandResult {
  const { verb, target, item } = parsed;

  // Find prop in location
  const prop = findPropByName(location, target);
  if (!prop) {
    return { text: `You don't see a "${target}" here.` };
  }

  // 'examine' always works
  if (verb === 'examine' || verb === 'look') {
    return { text: pickRandom(prop.examineText) };
  }

  // Check if verb is valid for this prop
  if (!prop.verbs.includes(verb)) {
    return { text: `You can't ${verb} the ${prop.name}.` };
  }

  // Continue with interaction...
}
```

---

## Item Interactions

### Tag-Based Matching

Common interactions use tags for flexibility:

```typescript
// packages/shared/src/data/props/tags.ts
export const TAG_INTERACTIONS: Record<string, TagInteraction> = {
  'water_source': {
    itemTags: ['fillable'],
    verb: 'fill',
    text: 'You fill your ${item} from the ${prop}. Cool water sloshes inside.',
    resultItem: '${item.baseId}_filled',
    consumeItem: true,
  },
  'fire': {
    itemTags: ['lightable'],
    verb: 'light',
    text: 'You hold the ${item} to the flames until it catches, casting dancing shadows.',
    effect: 'light_source',
  },
  'heat_source': {
    itemTags: ['cookable'],
    verb: 'cook',
    text: 'You carefully cook the ${item} over the ${prop}. The smell is enticing.',
    resultItem: '${item.baseId}_cooked',
    consumeItem: true,
  },
  'holy_water_source': {
    itemTags: ['fillable'],
    verb: 'fill',
    text: 'You reverently fill your ${item} with blessed water. It seems to glow faintly.',
    resultItem: 'holy_water',
    consumeItem: true,
  },
};
```

### Item Tags

```typescript
// Add to item definitions
'waterskin': { tags: ['fillable', 'drink'] },
'torch': { tags: ['lightable', 'light'] },
'lantern': { tags: ['lightable', 'light'] },
'candle': { tags: ['lightable'] },
'raw_meat': { tags: ['cookable', 'food'] },
'bottle': { tags: ['fillable'] },
```

### Prop Tags

```typescript
'square_well': { tags: ['water_source'] },
'inn_fireplace': { tags: ['fire', 'heat_source'] },
'temple_fountain': { tags: ['water_source', 'holy_water_source'] },
'blacksmith_forge': { tags: ['fire', 'heat_source'] },
'blacksmith_water_barrel': { tags: ['water_source'] },
```

### Specific Pairings

Unique interactions override tag matching:

```typescript
'square_wishing_well': {
  // ...
  itemInteractions: {
    'coin': {
      text: [
        'You toss the coin into the well. It glints as it falls... "Your wish shall find you when you least expect it."',
        'The coin spirals down into darkness. A voice whispers: "Fortune favors the generous."',
        'Plop! The coin vanishes. You feel slightly luckier.',
      ],
      cooldown: 60,
      rewards: {
        buff: { id: 'lucky', duration: 60 },
        consumeItem: 'coin',
      },
    },
  },
}
```

### Resolution Order

1. Check specific `itemInteractions[item.baseId]`
2. Check tag-based matching
3. Fall back to default interaction (if no item) or error (if item provided)

---

## Cooldown System

### Storage

```typescript
// Add to Player interface in packages/shared/src/types/character.ts
interface Player {
  // ... existing fields

  /** Prop interaction cooldowns - prop ID → game time when usable again */
  propCooldowns: Record<string, number>;
}
```

### Helper Functions

```typescript
// packages/server/src/commands/prop-helpers.ts

export function isPropOnCooldown(
  player: Player,
  propId: string,
  gameTime: number
): boolean {
  const cooldownEnd = player.propCooldowns[propId];
  return cooldownEnd !== undefined && gameTime < cooldownEnd;
}

export function getRemainingCooldown(
  player: Player,
  propId: string,
  gameTime: number
): number {
  const cooldownEnd = player.propCooldowns[propId];
  if (!cooldownEnd) return 0;
  return Math.max(0, cooldownEnd - gameTime);
}

export function setPropCooldown(
  player: Player,
  propId: string,
  gameTime: number,
  durationMinutes: number
): void {
  if (durationMinutes > 0) {
    player.propCooldowns[propId] = gameTime + durationMinutes;
  }
}

export function formatCooldownMessage(remainingMinutes: number): string {
  if (remainingMinutes < 1) {
    return "You've done that very recently. Try again in a moment.";
  } else if (remainingMinutes === 1) {
    return "You've done that recently. Try again in about a minute.";
  } else if (remainingMinutes < 60) {
    return `You've done that recently. Try again in about ${remainingMinutes} minutes.`;
  } else {
    const hours = Math.floor(remainingMinutes / 60);
    return `You've done that recently. Try again in about ${hours} hour${hours > 1 ? 's' : ''}.`;
  }
}
```

### Cooldown Values by Tier

| Tier | Typical Cooldown |
|------|------------------|
| Signature | 30-60 minutes |
| Interactive | 5-15 minutes |
| Flavor | None (or 1-2 min to prevent spam) |

---

## Props by Location

### The Rusty Blade Inn

**Signature:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `inn_ginger_cat` | Ginger Tabby Cat | pet, feed | Mood buff, rare mouse gift |
| `inn_loose_floorboard` | Loose Floorboard | lift, examine | 5-15c hidden stash (weekly) |

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `inn_fireplace` | Crackling Fireplace | use, warm, sit by | Warmed buff, light torch |
| `inn_bar_counter` | Polished Bar Counter | lean, sit | Mira notices, flavor |
| `inn_wooden_stools` | Row of Wooden Stools | sit | Rest, +1 MP regen 5 min |
| `inn_tip_jar` | Mira's Tip Jar | tip | 1-10c, scaled reactions |
| `inn_dusty_mugs` | Collection of Dusty Mugs | examine | Sometimes find copper |
| `inn_lazy_hound` | Lazy Hound by Fire | pet, wake | Tail thump, hunting dog lore |
| `inn_dart_board` | Dart Board | throw, play | 1c cost, win 2-5c or nothing |
| `inn_stew_smell` | Smell of Stew | smell, sniff | Hunger descriptions, food hints |
| `inn_drunk_patron` | Drunk Patron | talk, buy drink | Slurred rumors |

**Flavor:**
| ID | Name |
|----|------|
| `inn_tapestry` | Faded Tapestry on the Wall |
| `inn_chandelier` | Iron Chandelier with Candles |
| `inn_hunting_trophy` | Old Hunting Trophy |
| `inn_empty_plates` | Stack of Empty Plates |
| `inn_ale_keg` | Keg of Ale Behind the Bar |
| `inn_carved_initials` | Carved Initials on Table |
| `inn_ceiling_stain` | Stain on Ceiling |
| `inn_fire_sounds` | Crackling Fire Sounds |
| `inn_clinking_mugs` | Clinking Mugs |

---

### Town Square

**Signature:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `square_wishing_well` | Weathered Stone Well | use, toss coin | Fortune + luck buff (1hr) |
| `square_notice_board` | Wooden Notice Board | read, examine | Rumors, quest hints |
| `square_loose_cobblestone` | Loose Cobblestone | lift, pry | 1-5c, rare small gem |
| `square_street_musician` | Street Musician | tip, listen, request | Song + mood buff |

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `square_old_bench` | Old Wooden Bench | sit, rest | Watch townfolk, +1 MP regen |
| `square_dry_fountain` | Stone Fountain (dry) | examine | Sad lore about when it worked |
| `square_street_lamp` | Iron Street Lamp | light (night) | Help light the square |
| `square_pigeons` | Flock of Pigeons | feed, scatter | Gather around or fly away |
| `square_stray_mutt` | Stray Mutt | pet, feed | Follows you one room if fed |
| `square_town_crier` | Town Crier | listen | Game events, news |
| `square_children` | Children Playing | watch, wave | Wave back, lost ball quest? |
| `square_fountain_coin` | Coin in Fountain | take, examine | Moral choice, 1c |
| `square_bread_smell` | Smell of Fresh Bread | smell, follow | Points to market |

**Flavor:**
| ID | Name |
|----|------|
| `square_cobblestones` | Worn Cobblestones |
| `square_cart_wheel` | Merchant Cart Wheel |
| `square_town_banner` | Faded Town Banner |
| `square_autumn_leaves` | Pile of Autumn Leaves |
| `square_flower_boxes` | Flowering Window Boxes |
| `square_crowd_bustle` | Bustle of Crowd |
| `square_town_bell` | Town Bell |
| `square_chalk_drawing` | Faded Chalk Drawing |

---

### Training Yard

**Signature:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `training_dummy` | Straw-Stuffed Training Dummy | attack, hit, use | 1-3 XP (10 min cooldown) |
| `training_buried_coin` | Buried Practice Coin | dig | Trade to Holt for combat tip |

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `training_weapon_racks` | Wooden Weapon Racks | examine | Class/weapon hints |
| `training_archery_targets` | Archery Targets | shoot | 1 XP for rangers (cooldown) |
| `training_sand_pit` | Sand Pit for Sparring | examine | Footwork lore |
| `training_water_bucket` | Water Bucket | drink, splash | Refresh after training |
| `training_sparring_recruits` | Sparring Recruits | watch, cheer | Combat tips |
| `training_yard_raven` | Yard Raven | examine, feed | Sera's pet? Ominous |
| `training_notch_marks` | Notch Marks on Post | examine, count | Win tallies, Holt leads |

**Flavor:**
| ID | Name |
|----|------|
| `training_sword_clash` | Clash of Practice Swords |
| `training_sweat_smell` | Smell of Sweat and Leather |
| `training_arrow_thud` | Thud of Arrows |

---

### Temple of the Light

**Signature:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `temple_offering_bowl` | Offering Bowl | offer, donate | Blessing scales with donation |
| `temple_holy_fountain` | Small Stone Fountain | drink, fill | Cure ailments, holy water |
| `temple_loose_tile` | Loose Tile Near Altar | lift, examine | Holy symbol, show to Anna |

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `temple_prayer_benches` | Wooden Prayer Benches | sit, pray, kneel | Small MP restore |
| `temple_stained_glass` | Stained Glass Windows | examine | Lore, changes by time |
| `temple_altar_candles` | Stone Altar with Candles | light | Add to the vigil |
| `temple_white_dove` | White Dove | watch, feed | Symbol of Light |
| `temple_worn_prayer_book` | Worn Prayer Book | read | Hidden confession note |
| `temple_memorial_wall` | Names on Memorial Wall | read, trace | Fallen heroes lore |
| `temple_flickering_candle` | Flickering Candle | relight, watch | Superstition |
| `temple_alms_box` | Alms Box | donate | Smaller than altar |

**Flavor:**
| ID | Name |
|----|------|
| `temple_incense` | Incense Smoke |
| `temple_choir_echo` | Choir Echo |
| `temple_candleglow` | Warm Candleglow |
| `temple_silence` | Sacred Silence |
| `temple_mice` | Temple Mice |
| `temple_kneeling_pilgrim` | Kneeling Pilgrim |

---

### The Iron Anvil (Blacksmith)

**Signature:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `blacksmith_hammer_ring` | Ring of Hammer on Anvil | listen, watch | Meditative XP |

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `blacksmith_forge` | Roaring Coal Forge | use, warm | Heat items, light torch |
| `blacksmith_anvil` | Heavy Iron Anvil | examine | Smithing lore |
| `blacksmith_water_barrel` | Water Barrel | use, fill, cool | Fill waterskin, extinguish |
| `blacksmith_blades` | Rack of Finished Blades | examine | Kira's craftsmanship |
| `blacksmith_bellows` | Bellows | pump, use | Help forge, Kira approves |
| `blacksmith_grinding_wheel` | Grinding Wheel | use (weapon) | Tiny damage buff? |
| `blacksmith_mastiff` | Smith's Mastiff | pet, approach | Guards shop, wary |
| `blacksmith_failed_blade` | Kira's Failed Blade | examine | Lore, imperfection |

**Flavor:**
| ID | Name |
|----|------|
| `blacksmith_forge_heat` | Blast of Forge Heat |
| `blacksmith_hot_metal_smell` | Smell of Hot Metal |
| `blacksmith_quench_hiss` | Hiss of Quenching |
| `blacksmith_tongs` | Heavy Tongs |
| `blacksmith_coal_pile` | Pile of Coal |
| `blacksmith_red_iron` | Red-Hot Iron |
| `blacksmith_wrapped_package` | Wrapped Package |
| `blacksmith_tally` | Scratched Tally |

---

### Elwin's Remedies (Alchemist)

**Signature:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `alchemist_journal` | Elwin's Private Journal | read | Recipe hints (distracted) |
| `alchemist_ingredient_board` | Ingredient Request Board | read | Fetch quest hooks |

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `alchemist_cauldron` | Bubbling Copper Cauldron | examine, stir | Random hint or buff |
| `alchemist_herbs` | Shelves of Dried Herbs | examine, smell | Learn herb names |
| `alchemist_vials` | Rack of Glass Vials | examine | Potion hints |
| `alchemist_workbench` | Cluttered Workbench | examine | Experiment notes |
| `alchemist_glowing_moths` | Cage of Glowing Moths | examine, release | Beautiful, ingredients |
| `alchemist_toad` | Toad in Terrarium | poke, examine | Grumpy assistant |
| `alchemist_colorful_smoke` | Colorful Smoke | inhale, examine | Mild random effects |
| `alchemist_mislabeled_bottle` | Mislabeled Bottle | examine | Comedy, suspicion |
| `alchemist_experiment` | Simmering Experiment | stir, watch | Help or hinder |

**Flavor:**
| ID | Name |
|----|------|
| `alchemist_chemical_smell` | Acrid Chemical Smell |
| `alchemist_bubbling` | Bubbling Sounds |
| `alchemist_pungent_herbs` | Pungent Herb Smell |
| `alchemist_mortar` | Mortar and Pestle |
| `alchemist_burn_marks` | Burn Marks on Table |
| `alchemist_spider` | Spider in Corner |

---

### Thom's Supplies (General Store)

**Signature:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `general_false_barrel` | False Bottom Barrel | examine closely | 20c stash (monthly) |

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `general_shelves` | Tall Wooden Shelves | examine | Browse wares |
| `general_grain_barrels` | Barrels of Grain | examine | Quality, Thom's pride |
| `general_crates` | Stack of Supply Crates | examine | Shipping labels (lore) |
| `general_scales` | Weighing Scales | weigh, use | Show item sell value |
| `general_shop_bell` | Shop Bell | ring | Thom greets you |
| `general_penny_dish` | "Take a Penny" Dish | take, leave | Community copper |
| `general_sample_basket` | Sample Basket | taste | Dried fruit, Thom watches |
| `general_complaint_box` | Complaint Box | read, write | Funny complaints |
| `general_canary` | Caged Canary | listen, whistle | Sings back, miner tradition |
| `general_shopping_list` | Faded Shopping List | read | Previous customer's needs |

**Flavor:**
| ID | Name |
|----|------|
| `general_musty_smell` | Musty Storage Smell |
| `general_floorboards` | Creaking Floorboards |
| `general_dust_motes` | Dust Motes in Light |
| `general_carved_heart` | Carved Heart Under Counter |
| `general_shop_mouse` | Shop Mouse |

---

### Town Gate

**Signature:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `gate_guard_bell` | Guard Signal Bell | ring, use | Summons guard briefly |
| `gate_wanted_posters` | Wanted Posters | read, examine | Bounties, hunt hints |

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `gate_guard_post` | Wooden Guard Post | examine | Duty roster, schedules |
| `gate_iron_gates` | Heavy Iron Gates | examine | Defensive lore |
| `gate_archway` | Towering Stone Archway | examine | Town motto, founding |
| `gate_guard_dog` | Guard Dog | pet, approach | Alert, trained, sniffs |
| `gate_falcon` | Perched Falcon | examine, whistle | Marcus's message bird |
| `gate_traveler_tally` | Tally of Travelers | read | Today's count, names |
| `gate_loose_stone` | Loose Stone in Wall | examine, pull | Guard's secret flask |
| `gate_carved_warning` | Carved Warning | read | "Beyond here, the wilds remember" |

**Flavor:**
| ID | Name |
|----|------|
| `gate_wind` | Wind Through Gate |
| `gate_distant_howl` | Distant Howl |
| `gate_road_dust` | Smell of Road Dust |
| `gate_notice_board` | Notice Board |
| `gate_arriving_merchant` | Arriving Merchant |
| `gate_guard_inspection` | Guard Inspection |
| `gate_signal_horn` | Signal Horn |

---

### Market Street

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `market_stalls` | Market Stalls | examine | Vendor wares, bustle |
| `market_lanterns` | Hanging Lanterns | light (dusk) | Help light market |
| `market_meat_skewers` | Sizzling Meat Skewers | smell, buy | Food vendor |
| `market_spice_aromas` | Spice Vendor Aromas | smell | Exotic lands lore |
| `market_flower_girl` | Flower Girl | buy flower | 1c flower, give to NPCs |
| `market_sampling_tray` | Sampling Tray | taste, sample | Cheese, vendor watches |
| `market_donkey` | Merchant's Donkey | pet, feed | Patient pack animal |
| `market_chickens` | Pecking Chickens | scatter, feed | Cluck around stalls |
| `market_fat_cat` | Fat Market Cat | pet | Lazy mouser |
| `market_dropped_coin` | Dropped Coin | pick up, take | 1c, keep or find owner |

**Flavor:**
| ID | Name |
|----|------|
| `market_cobblestones` | Cobblestone Path |
| `market_shouting` | Shouting Merchants |
| `market_fruit_colors` | Fruit Stall Colors |
| `market_haggling` | Haggling Customers |
| `market_chalked_prices` | Chalked Prices on Crate |

---

### Eastern Road

**Signature:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `eastroad_treasure_map` | Buried Treasure Map | dig | Wilderness cache location |
| `eastroad_love_letter` | Love Letter in Tree Knot | search, examine | Mystery letter |

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `eastroad_signpost` | Wooden Signpost | read, examine | Directions |
| `eastroad_street_lamp` | Iron Street Lamp | light (night) | Help light road |
| `eastroad_milestone` | Milestone Marker | read | Distances to places |
| `eastroad_sparrows` | Sparrows on Signpost | watch, scatter | Chirping, fly away |
| `eastroad_wandering_goose` | Wandering Goose | shoo, feed | Honks angrily |

**Flavor:**
| ID | Name |
|----|------|
| `eastroad_cobblestones` | Worn Cobblestone Path |
| `eastroad_flower_planters` | Flower Planters |
| `eastroad_temple_bells` | Temple Bells (distant) |
| `eastroad_inn_laughter` | Inn Laughter |
| `eastroad_cooking_smells` | Evening Cooking Smells |
| `eastroad_scratched_post` | Scratched Directions |
| `eastroad_sweeping_shopkeeper` | Sweeping Shopkeeper |
| `eastroad_delivery_cart` | Delivery Cart |

---

### Outside Walls

**Signature:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `outside_buried_gear` | Buried Gear | dig | Adventurer's stash |

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `outside_palisade` | Tall Wooden Palisade | examine | Defensive lore |
| `outside_hitching_post` | Hitching Post | use | "For when you have a mount" |
| `outside_milestone` | Milestone Marker | read | "Easthollow - 0 leagues" |
| `outside_campfire_ring` | Old Campfire Ring | examine | Rest spot |
| `outside_trail_marker` | Trail Marker | examine | Ranger signs, hints |
| `outside_sheep` | Grazing Sheep | pet, count | Counting sheep joke |
| `outside_distant_wilderness` | Distant Wilderness | look, examine | Forest edge, mountains |

**Flavor:**
| ID | Name |
|----|------|
| `outside_dirt_road` | Worn Dirt Road |
| `outside_town_gates` | Town Gates Behind You |
| `outside_open_sky` | Open Sky |
| `outside_grass_rustling` | Grass Rustling |
| `outside_hawk` | Circling Hawk |
| `outside_field_mice` | Field Mice |
| `outside_departing_adventurer` | Departing Adventurer |
| `outside_returning_wounded` | Returning Wounded |

---

### Northern Alley

**Signature:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `alley_loose_brick` | Loose Brick | pull, examine | 10c + thieves' guild hint |
| `alley_scratched_map` | Scratched Map | examine | Crude sewer layout |

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `alley_crates` | Stacked Wooden Crates | examine | Smuggler marks? |
| `alley_sewer_grate` | Rusty Sewer Grate | examine, listen | Sounds from below |
| `alley_thieves_mark` | Thieves' Mark | examine | "Easy mark" symbol |
| `alley_rats` | Alley Rats | kick, watch | Foreshadow sewer |
| `alley_mangy_cat` | Mangy Cat | pet, feed | Hisses, warms up |
| `alley_dropped_goods` | Dropped Goods | examine | Suspicious crate |

**Flavor:**
| ID | Name |
|----|------|
| `alley_cobblestones` | Narrow Cobblestone Passage |
| `alley_sewer_stench` | Sewer Stench |
| `alley_dripping_water` | Dripping Water |
| `alley_hushed_whispers` | Hushed Whispers |
| `alley_cockroaches` | Cockroaches |
| `alley_shadowy_figure` | Shadowy Figure |

---

### Bank

**Interactive:**
| ID | Name | Verbs | Effect |
|----|------|-------|--------|
| `bank_lockboxes` | Rows of Lockboxes | examine | Bank services hint |
| `bank_coin_scales` | Coin Scales | use, weigh | "Your gold weighs true" |
| `bank_wanted_poster` | Faded Wanted Poster | read | Old bounty |
| `bank_deposit_record` | Deposit Record | peek | Rich people exist |

**Flavor:**
| ID | Name |
|----|------|
| `bank_stone_walls` | Heavy Stone Walls |
| `bank_iron_door` | Reinforced Iron Door |
| `bank_clinking_coins` | Clinking Coins |
| `bank_old_paper_smell` | Smell of Old Paper |
| `bank_heavy_silence` | Heavy Silence |
| `bank_scuff_marks` | Scuff Marks |
| `bank_guard_dog` | Guard Dog (chained) |
| `bank_nervous_depositor` | Nervous Depositor |
| `bank_stern_clerk` | Stern Clerk |

---

## File Structure

```
packages/shared/src/
├── data/
│   └── props/
│       ├── index.ts              # Re-exports, PROP_REGISTRY
│       ├── types.ts              # PropDefinition, PropInteraction, PropReward
│       ├── tags.ts               # TAG_INTERACTIONS
│       ├── inn-props.ts          # Inn props
│       ├── square-props.ts       # Town Square props
│       ├── temple-props.ts       # Temple props
│       ├── training-props.ts     # Training Yard props
│       ├── blacksmith-props.ts   # Blacksmith props
│       ├── alchemist-props.ts    # Alchemist props
│       ├── general-props.ts      # General Store props
│       ├── gate-props.ts         # Town Gate props
│       ├── market-props.ts       # Market Street props
│       ├── eastroad-props.ts     # Eastern Road props
│       ├── outside-props.ts      # Outside Walls props
│       ├── alley-props.ts        # Northern Alley props
│       └── bank-props.ts         # Bank props
├── types/
│   └── character.ts              # Add propCooldowns to Player

packages/server/src/
├── commands/
│   ├── handlers.ts               # Add handlePropInteraction
│   ├── parser.ts                 # Add PROP_VERBS routing
│   └── prop-helpers.ts           # Cooldown helpers, reward application
```

---

## Future Integration Points

### Quest System
The **Notice Board** prop is designed to integrate with a future quest/job system:
- Currently shows flavor rumors and hints
- Can be upgraded to display available quests
- Structure: `{ id, title, description, reward, location }`

### Mount System
The **Hitching Post** outside walls hints at a future mount system:
- Currently returns "For when you have a mount"
- Can be upgraded to stable/summon mounts

### Thieves' Guild
Several props hint at a thieves' guild storyline:
- `alley_loose_brick` - Guild stash
- `alley_thieves_mark` - Guild symbol
- `alley_scratched_map` - Guild knowledge

### Reputation System
Props like `temple_offering_bowl` and `general_penny_dish` could tie into reputation:
- Donations improve standing with factions
- Could unlock NPC dialogue or shop discounts

---

## Summary

- **~230 total props** across 13 town locations
- **~15 signature** props with meaningful rewards
- **~60 interactive** props with light mechanics
- **~155 flavor** props with rich randomized text
- **Animals, sensory details, hidden discoveries, dynamic elements**
- **Tag-based** item matching + specific unique pairings
- **Per-player cooldowns** in game time
- **Extensible** data-driven architecture
