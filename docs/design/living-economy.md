# Living Economy — Design Notes

Future system: real supply chains. Shops run dry, craftsmen need materials,
NPCs run errands and post work orders, and players can step into any link of
the chain — including "go mine the ore yourself." Between towns, caravans
move goods and prices diverge. This doc is the roadmap.

**Current status (2026-07-10):** the single-town economy vertical slice is implemented across all Easthollow merchants. Finite stock, merchant cash, recipes, shared gathering nodes, work orders, shortage gossip, cold-tick production, and basic bot suppliers are live. Visible shopkeeper errands and inter-town caravans remain future stages.

## The core loop (the blacksmith story)

1. Players buy swords → the smith's **stock depletes** (finite stock is
   already supported: `ShopItem.stock`).
2. To restock, the smith needs materials (iron ore, coal) per a simple
   **recipe map** (sword = 2 ore + 1 coal).
3. The smith first tries to **buy locally** — walks down the street to the
   general store on a schedule-driven errand (NPC schedules already move
   NPCs by time of day; an errand is just a temporary schedule override).
4. No ore in town? The smith **posts a work order** on the notice board:
   *"WANTED: 5 iron ore — 30c each — Grimshaw the smith."*
5. The order can be fulfilled by:
   - **NPC/bot miners** — a `fulfill_request` GOAP goal: travel to a
     resource node, gather, walk it back, get paid.
   - **Players** — read the board, mine the ore, `turn in` at the smith
     for coin and merchant reputation. Organic, systemic quests — no quest
     scripting needed.
6. Shortages become **gossip** (hot topics): *"Grimshaw's out of iron
   again. Third time this month."* The world tells you where the
   opportunities are.

## What already exists to build on

| Piece | Where | Role in the economy |
|---|---|---|
| Finite shop stock | `ShopItem.stock` | Depletion already representable |
| Buy/sell multipliers | `ShopInventory` | Per-town price differentials |
| NPC schedules | `NpcSchedule` | Errands = schedule overrides |
| Respawning containers | `Container.respawns` | Resource nodes (ore veins) are just containers with a `mine` verb |
| Crafting materials | wolf pelts, fey essence, gossamer silk, living thorn... | Already dropping; currently vendor trash — give them buyers |
| Bot GOAP goals | `bots/goap/` | Miner/hauler/caravan-guard occupations |
| Hot topics | `npc/simulation/events.ts` | Shortage/glut gossip |
| Notice board props | `square_notice_board`, `gate_wanted_posters` | The request board UI already has a diegetic home |
| Zone hubs | `BotZonePopulation` | Towns as economic units |

## Stages

### Stage 1 — Stock & recipes (single town) ✅
- Shops consume stock on sale; restock requires materials, not timers.
- `CraftRecipe` map: what each shopkeeper consumes to produce what.
- NPC merchant gold pools: shops can run out of money to buy player loot
  (a natural sink/faucet regulator).

### Stage 2 — Local procurement & the request board (work orders/resources ✅; visible errands pending)
- Errand behavior: shopkeeper walks to another shop and transfers goods
  (visible to players — the world does things off-screen).
- `WorkOrder` registry on the world: { itemBaseId, qty, unitPrice,
  requesterNpcId, expiresAt }. `read board` lists orders; `turn in` pays.
- Resource nodes: ore veins in the Western Reaches hills (containers +
  `mine` verb + pickaxe tool item), herb patches in the marsh, timber
  stands in the woods. All zone-authorable via the Cartographer's
  container designer.

### Stage 3 — NPC labor (basic bot suppliers ✅; occupations/polish pending)
- Miner/gatherer bots: `fulfill_request` goal claims an open work order,
  travels to a node, gathers, returns, gets paid. Bots visibly carrying
  ore through town = the living world selling itself.
- Failure modes make stories: the miner bot dies to wolves en route →
  gossip → the order stays open → a player takes it.

### Stage 4 — Inter-town trade (needs hub #2)
- Per-town price tables: ore cheap near the mines, dear in the city;
  fey essence cheap near the Woods, exotic elsewhere. Player trading runs
  on price differentials — buying low and hauling.
- **Caravans**: scheduled NPC wagon trains between hubs carrying real
  cargo manifests. Ambush events (ties into the incursion system),
  escort work for players and guard-bots, and cargo loss actually
  affecting destination stock/prices.
- Traveling merchants at the Crossroads (already in the backlog) become
  the informal arbitrage layer.

## Design guardrails

- **Everything visible**: no invisible spreadsheet economy. Restocks
  arrive by NPC hands; shortages are spoken about; caravans physically
  travel the roads (players can follow one end to end).
- **Player-optional**: the economy must self-run on NPC labor (slowly,
  imperfectly) — players accelerate it for profit, never unblock it.
- **Prices move slowly** and within bands; no hyperinflation from a
  player dumping 200 wolf pelts (per-shop gold pools cap absorption).
- Start with ONE material chain (iron ore → smith) end-to-end before
  generalizing. The blacksmith story is the vertical slice.

## Rough build order (when picked up)

1. Ore veins + `mine` verb + pickaxe (content + one command)
2. Smith stock depletion + recipe restock from inventory
3. Work-order registry + `read board` / `turn in`
4. Shortage gossip + errand walking
5. Miner bot goal
6. (Hub #2 exists) price tables + caravans
