/**
 * Whispering Woods location definitions.
 */
import type { Location, Exit } from '../../types';
import { TOWN_EAST_ROAD } from '../easthollow';

// ============ Location IDs ============
// Transition Zone
export const WOODS_FARMHOUSE = 'woods_farmhouse';
export const WOODS_FIELDS = 'woods_fields';
export const WOODS_EAST_GATE = 'woods_east_gate';
export const WOODS_OLD_ROAD_1 = 'woods_old_road_1';
export const WOODS_OLD_ROAD_2 = 'woods_old_road_2';
export const WOODS_OLD_ROAD_3 = 'woods_old_road_3';
export const WOODS_OLD_ROAD_4 = 'woods_old_road_4';
export const WOODS_OLD_ROAD_5 = 'woods_old_road_5';
export const WOODS_CLEARING = 'woods_clearing';

// Pixie Dell
export const WOODS_PIXIE_ENTRANCE = 'woods_pixie_entrance';
export const WOODS_PIXIE_GLADE = 'woods_pixie_glade';
export const WOODS_PIXIE_MAZE_1 = 'woods_pixie_maze_1';
export const WOODS_PIXIE_MAZE_2 = 'woods_pixie_maze_2';
export const WOODS_PIXIE_MAZE_3 = 'woods_pixie_maze_3';
export const WOODS_PIXIE_TRAPPED = 'woods_pixie_trapped';
export const WOODS_PIXIE_COURT = 'woods_pixie_court';

// Murky Fen
export const WOODS_FEN_ENTRANCE = 'woods_fen_entrance';
export const WOODS_FEN_BOG_PATH = 'woods_fen_bog_path';
export const WOODS_FEN_RUINS_1 = 'woods_fen_ruins_1';
export const WOODS_FEN_RUINS_2 = 'woods_fen_ruins_2';
export const WOODS_FEN_CAMP = 'woods_fen_camp';
export const WOODS_FEN_MOUND = 'woods_fen_mound';

// Standing Stones
export const WOODS_STONES_ENTRANCE = 'woods_stones_entrance';
export const WOODS_STONES_OLD_PATH = 'woods_stones_old_path';
export const WOODS_STONES_CIRCLE = 'woods_stones_circle';
export const WOODS_STONES_RITUAL_1 = 'woods_stones_ritual_1';
export const WOODS_STONES_RITUAL_2 = 'woods_stones_ritual_2';
export const WOODS_STONES_ALTAR = 'woods_stones_altar';

// Spider Hollow
export const WOODS_SPIDER_ENTRANCE = 'woods_spider_entrance';
export const WOODS_SPIDER_TRAIL = 'woods_spider_trail';
export const WOODS_SPIDER_COCOON = 'woods_spider_cocoon';
export const WOODS_SPIDER_NEST_1 = 'woods_spider_nest_1';
export const WOODS_SPIDER_NEST_2 = 'woods_spider_nest_2';
export const WOODS_SPIDER_NEST_3 = 'woods_spider_nest_3';
export const WOODS_SPIDER_LAIR = 'woods_spider_lair';

// Thornwood Maze
export const WOODS_THORN_ENTRANCE = 'woods_thorn_entrance';
export const WOODS_THORN_PATH = 'woods_thorn_path';
export const WOODS_THORN_DEAD_1 = 'woods_thorn_dead_1';
export const WOODS_THORN_DEAD_2 = 'woods_thorn_dead_2';
export const WOODS_THORN_DEAD_3 = 'woods_thorn_dead_3';
export const WOODS_THORN_GARDEN = 'woods_thorn_garden';
export const WOODS_THORN_DEN = 'woods_thorn_den';

// Matriarch's Sanctum
export const WOODS_SANCTUM_ALTAR = 'woods_sanctum_altar';
export const WOODS_SANCTUM_GROVE = 'woods_sanctum_grove';
export const WOODS_SANCTUM_APPROACH = 'woods_sanctum_approach';
export const WOODS_SANCTUM_HEART = 'woods_sanctum_heart';

// ============ Transition Zone Locations ============
export const WOODS_LOCATIONS: Record<string, Location> = {
  [WOODS_FARMHOUSE]: {
    id: WOODS_FARMHOUSE,
    name: 'Weathered Farmhouse',
    biome: { plains: 1 },
    props: [
      'small stone farmhouse with thatched roof',
      'vegetable garden with rows of cabbages',
      'wooden chicken coop with clucking hens',
      'stone well with rope and bucket',
      'dark treeline visible to the east',
      'worn wooden fence around the yard',
      'smoke rising from the chimney',
      'muddy boots by the door',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_farmer_tom'],
  },
  [WOODS_FIELDS]: {
    id: WOODS_FIELDS,
    name: 'Eastern Fields',
    biome: { plains: 1 },
    props: [
      'rows of golden wheat swaying in the breeze',
      'weathered scarecrow with tattered clothes',
      'dirt path winding through the fields',
      'old hay cart with broken wheel',
      'patches of wildflowers among the grain',
      'dark forest looming on the horizon',
      'crows circling overhead',
      'wooden irrigation channels',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: [],
  },
  [WOODS_EAST_GATE]: {
    id: WOODS_EAST_GATE,
    name: 'East Guard Gate',
    biome: { plains: 1 },
    props: [
      'wooden gatehouse with watchtower',
      'iron gate standing open',
      'guard tower overlooking the road',
      'warning signs nailed to posts',
      'weapon rack with spare spears',
      'lantern hooks on the gate pillars',
      'worn path through the archway',
      'notice board with bounty postings',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 0,
    isSafeZone: true,
    npcs: ['npc_guard_east_1', 'npc_guard_east_2'],
  },
  [WOODS_OLD_ROAD_1]: {
    id: WOODS_OLD_ROAD_1,
    name: 'Old Farm Road',
    biome: { plains: 1 },
    props: [
      'overgrown cobblestones barely visible',
      'abandoned cart with rotting wood',
      'untended fields gone to seed',
      'rusted farming tools half-buried',
      'crows perched on broken fence posts',
      'weeds pushing through the stones',
      'collapsed wooden shed',
      'eerie silence broken only by wind',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 1,
    isSafeZone: false,
    npcs: [],
  },
  [WOODS_OLD_ROAD_2]: {
    id: WOODS_OLD_ROAD_2,
    name: 'Abandoned Homestead',
    biome: { plains: 1 },
    props: [
      'collapsed foundation of a farmhouse',
      'overgrown garden with wild herbs',
      'broken fence posts scattered about',
      'old well filled with debris and leaves',
      'faded wooden toy half-buried in dirt',
      'stone chimney standing alone',
      'wild roses claiming the ruins',
      'sense of long-forgotten tragedy',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 2,
    npcs: [],
  },
  [WOODS_OLD_ROAD_3]: {
    id: WOODS_OLD_ROAD_3,
    name: 'Fog-Shrouded Path',
    biome: { plains: 0.5, forest: 0.5 },
    props: [
      'thick fog rolling across the ground',
      'gnarled trees appearing through the mist',
      'path becoming harder to follow',
      'whispers carried on the wind',
      'flickering lights in the distance',
      'cold dampness in the air',
      'shapes moving just out of sight',
      'strange mushrooms growing on logs',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 3,
    npcs: [],
  },
  [WOODS_OLD_ROAD_4]: {
    id: WOODS_OLD_ROAD_4,
    name: 'Edge of the Woods',
    biome: { forest: 1 },
    props: [
      'massive twisted trees blocking the sky',
      'road ending at a wall of brambles',
      'moss-covered warning stone with faded script',
      'animal bones scattered near the treeline',
      'cold air seeping from the forest',
      'roots breaking through the old road',
      'strange symbols carved into bark',
      'darkness seeming to move between trees',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 4,
    npcs: [],
  },
  [WOODS_OLD_ROAD_5]: {
    id: WOODS_OLD_ROAD_5,
    name: 'Forest Threshold',
    biome: { forest: 1 },
    props: [
      'ancient stone archway covered in vines',
      'faded runes glowing faintly on the stones',
      'forest seeming to breathe around you',
      'white stone path leading into darkness',
      'prickling sensation of magic in the air',
      'dead leaves swirling without wind',
      'distant sound of something watching',
      'old offerings left at the arch base',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 5,
    npcs: [],
  },
  [WOODS_CLEARING]: {
    id: WOODS_CLEARING,
    name: 'Whispering Clearing',
    biome: { forest: 1 },
    props: [
      'ancient tree stumps arranged in a circle',
      'bioluminescent moss glowing softly',
      'five dark paths leading into the woods',
      'stone pedestal with worn inscriptions',
      'constant whispers from all directions',
      'strange glowing flowers in patches',
      'unnatural stillness in the air',
      'sense of being watched from every shadow',
    ],
    items: [],
    enemies: [],
    creatures: [],
    visitState: { visitCount: 0 },
    depth: 6,
    npcs: [],
  },

  // ============ Pixie Dell ============
  [WOODS_PIXIE_ENTRANCE]: {
    id: WOODS_PIXIE_ENTRANCE,
    name: 'Dell Entrance',
    description:
      'An archway of flowering vines marks the entrance to a hidden dell. The air carries a sweet, intoxicating scent that makes your head swim pleasantly. Bioluminescent mushrooms line the path ahead, pulsing with soft blue light. Tiny footprints dot the soft earth, and distant laughter echoes from somewhere deeper within.',
    depth: 7,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_PIXIE_GLADE]: {
    id: WOODS_PIXIE_GLADE,
    name: 'Glittering Glade',
    description:
      'Flowers of impossible varieties bloom here, their petals glowing in shifting colors that cycle through the rainbow. Butterflies made of pure light flit between blossoms, leaving trails of sparkles in their wake. The grass is soft as the finest cushion, inviting rest. A ring of spotted toadstools forms a perfect circle in the center of the glade.',
    depth: 7,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_PIXIE_MAZE_1]: {
    id: WOODS_PIXIE_MAZE_1,
    name: 'Flower Maze',
    description:
      'Towering flowers rise above your head, their thick stems forming walls that block sight and sound. Some petals snap open and closed like hungry mouths as you pass. The paths seem to shift when you look away, and giggling echoes from all directions at once.',
    depth: 8,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_PIXIE_MAZE_2]: {
    id: WOODS_PIXIE_MAZE_2,
    name: 'Flower Maze',
    description:
      'Every path looks identical here - the same flowers, the same bends, the same dancing lights. Your footprints disappear moments after you make them. The flowers seem to be watching you with something like anticipation. Something fast darts between the stems just at the edge of vision.',
    depth: 8,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_PIXIE_MAZE_3]: {
    id: WOODS_PIXIE_MAZE_3,
    name: 'Flower Maze',
    description:
      'A dead end - or is it? A suspiciously clear space opens before you, with something glinting like treasure in the center. The flowers lean inward, closing ranks behind you. Too late, you realize the trap as the ground gives way beneath your feet.',
    depth: 8,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_PIXIE_TRAPPED]: {
    id: WOODS_PIXIE_TRAPPED,
    name: 'Trapped Grove',
    description:
      'Pixie snares hang from every branch - delicate things of spider silk and malice, designed to catch the unwary. Bones of small animals litter the ground, still tangled in their traps. Cruel laughter rings out as corrupted pixies circle above, their once-beautiful wings now tattered and dark.',
    depth: 9,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_PIXIE_COURT]: {
    id: WOODS_PIXIE_COURT,
    name: "Trickster's Court",
    description:
      'A throne of woven flowers and stolen gold dominates this clearing. Piles of trinkets and treasures surround it - coins, jewelry, and stranger things taken from unwary travelers. Mischievous sprites attend to their sovereign, while wild magic crackles through the air like visible lightning.',
    depth: 10,
    biome: { forest: 1 },
    isSafeZone: false,
    isBossRoom: true,
    creatures: [],
    items: [],
    npcs: [],
  },

  // ============ Murky Fen ============
  [WOODS_FEN_ENTRANCE]: {
    id: WOODS_FEN_ENTRANCE,
    name: 'Fen Entrance',
    description:
      'The path descends into a thick mist that clings to the ground like a living thing. The earth becomes soft and spongy beneath your feet, water seeping up with each step. Pools of stagnant water reflect nothing, their surfaces covered with green scum. Frogs croak from hidden perches, their calls echoing eerily through the fog. The smell of decay hangs heavy in the air - rotting vegetation and something worse lurking beneath.',
    depth: 7,
    biome: { swamp: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_FEN_BOG_PATH]: {
    id: WOODS_FEN_BOG_PATH,
    name: 'Bog Path',
    description:
      'A narrow path of semi-solid ground winds between pools of murky water. Dead trees rise from the bog like skeletal hands reaching toward the sky, their bark blackened and peeling. In the distance, will-o-wisps dance and flicker, luring the unwary to watery graves. The mud sucks at your boots with each step, hungry to pull you down. Bones gleam pale beneath the dark water - some animal, some disturbingly humanoid.',
    depth: 8,
    biome: { swamp: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_FEN_RUINS_1]: {
    id: WOODS_FEN_RUINS_1,
    name: 'Sunken Ruins',
    description:
      'Crumbling stone walls rise from the swamp water, remnants of some ancient structure long claimed by the fen. Half-submerged doorways lead to flooded chambers, their dark interiors promising secrets and danger in equal measure. Ancient carvings adorn the weathered stone - spiraling patterns and figures too worn to identify. Something large moved beneath the water just now, sending ripples across the still surface.',
    depth: 9,
    biome: { swamp: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_FEN_RUINS_2]: {
    id: WOODS_FEN_RUINS_2,
    name: 'Sunken Ruins',
    description:
      'The collapsed ceiling of this ruined chamber reveals a circle of gray sky above, letting weak light filter down to illuminate the decay. A stone altar stands in the center, covered in thick moss that seems to pulse with unnatural life. Rusted chains hang from the walls, their original purpose best left unimagined. Red caps have been hung to dry from hooks and protrusions - the distinctive bloody headwear of the creatures that now claim these ruins.',
    depth: 9,
    biome: { swamp: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_FEN_CAMP]: {
    id: WOODS_FEN_CAMP,
    name: 'Redcap Camp',
    description:
      'Crude tents made of stretched skin and bone stand in a rough circle around a central fire pit. Weapons of all kinds - axes, knives, cleavers - are stuck into the ground or hung from racks, each one stained dark with old blood. Racks for drying the redcaps\' signature bloody caps line one edge of the camp, the crimson fabric dripping slowly. A cooking fire crackles nearby, something disturbingly familiar roasting over the flames.',
    depth: 10,
    biome: { swamp: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_FEN_MOUND]: {
    id: WOODS_FEN_MOUND,
    name: "Chieftain's Mound",
    description:
      'A raised mound of packed earth rises from the swamp, the only truly dry ground for miles. At its peak sits a throne assembled from the bones of countless victims, bleached white and arranged with disturbing artistry. Trophies hang from posts around the mound - skulls, weapons, pieces of armor from those foolish enough to challenge the chieftain. Other redcaps cower at the base of the mound, their usual bloodlust tempered by fear of their brutal leader.',
    depth: 11,
    biome: { swamp: 1 },
    isSafeZone: false,
    isBossRoom: true,
    creatures: [],
    items: [],
    npcs: [],
  },

  // ============ Spider Hollow ============
  [WOODS_SPIDER_ENTRANCE]: {
    id: WOODS_SPIDER_ENTRANCE,
    name: 'Hollow Entrance',
    description:
      'The trees here are wrapped in thick, glistening webbing that muffles all sound. A tunnel of silk stretches ahead into darkness, its strands swaying gently despite the still air. Skittering sounds echo from somewhere within. Husks of prey hang from nearby branches - deer, wolves, and things less identifiable - drained and discarded.',
    depth: 8,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_SPIDER_TRAIL]: {
    id: WOODS_SPIDER_TRAIL,
    name: 'Webbed Trail',
    description:
      'Webs cover everything here - the ground, the trees, the very air seems thick with silk. Each step pulls at sticky strands that cling to your boots. Cocooned animals hang from branches, some still twitching weakly. Eyes reflect the dim light from the darkness ahead, dozens of them, watching. The webs vibrate with every movement you make, signaling your presence.',
    depth: 9,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_SPIDER_COCOON]: {
    id: WOODS_SPIDER_COCOON,
    name: 'Cocoon Chamber',
    description:
      'A massive cavern formed entirely of layered webs opens before you. Dozens of cocoons hang from silk threads, swaying gently - some are terrifyingly human-sized, and a few still move with weak struggles. Pale, gangly ettercaps tend to the prey, injecting paralytic venom and wrapping fresh catches. The sweet smell of rot pervades everything.',
    depth: 10,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_SPIDER_NEST_1]: {
    id: WOODS_SPIDER_NEST_1,
    name: 'Nest Tunnels',
    description:
      'Narrow tunnels of compacted webbing branch off in multiple directions. Egg sacs line the walls, translucent enough to see the squirming forms within. Baby spiders carpet the floor, scrambling over each other in writhing masses. Larger shapes move in the tunnels ahead, their many legs clicking against the silk.',
    depth: 11,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_SPIDER_NEST_2]: {
    id: WOODS_SPIDER_NEST_2,
    name: 'Nest Tunnels',
    description:
      'The tunnel opens into a smaller chamber dominated by a massive broodmother spider. She tends to her countless offspring, her bloated abdomen pulsing as she produces more egg sacs. Thousands of tiny spiders swarm around her, and her many eyes fix on you with protective aggression.',
    depth: 11,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_SPIDER_NEST_3]: {
    id: WOODS_SPIDER_NEST_3,
    name: 'Nest Tunnels',
    description:
      'The deepest tunnel slopes downward, its walls reinforced with layer upon layer of ancient webbing. Royal guard spiders patrol here - massive specimens with armored carapaces and venomous fangs. The webs thrum constantly with vibrations, a form of communication that coordinates the entire colony. Ahead, the tunnel opens into something vast.',
    depth: 12,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_SPIDER_LAIR]: {
    id: WOODS_SPIDER_LAIR,
    name: "Queen's Lair",
    description:
      'A throne of woven silk dominates the center of this vast chamber, and upon it rests the Spider Queen herself. A crown of skulls adorns her head - trophies from adventurers who came before. Thousands of spiders attend to her every need, creating a living carpet that parts before her movements. She waits here in the heart of her domain, patient and eternal.',
    depth: 13,
    biome: { forest: 1 },
    isSafeZone: false,
    isBossRoom: true,
    creatures: [],
    items: [],
    npcs: [],
  },

  // ============ Standing Stones ============
  [WOODS_STONES_ENTRANCE]: {
    id: WOODS_STONES_ENTRANCE,
    name: 'Stone Path Entrance',
    description:
      'An ancient worn path stretches ahead, its stones smoothed by countless feet over untold ages. Standing stones are visible in the distance, their dark silhouettes piercing a strange mist that clings to the ground. Whispered voices seem to drift on the wind, speaking in tongues long forgotten. You cannot shake the sense of being watched by unseen eyes.',
    depth: 7,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_STONES_OLD_PATH]: {
    id: WOODS_STONES_OLD_PATH,
    name: 'Old Stone Path',
    description:
      'Moss-covered stepping stones form an ancient pathway, each one carved with runes that pulse faintly with residual power. Will-o-wisps dance between the stones, their cold blue flames casting strange shadows. The temperature drops noticeably here, your breath forming small clouds in the chill air.',
    depth: 8,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_STONES_CIRCLE]: {
    id: WOODS_STONES_CIRCLE,
    name: 'Stone Circle',
    description:
      'Massive standing stones rise from the earth in a perfect circle, each one carved with spiraling patterns that seem to move when viewed from the corner of your eye. A weathered altar stone stands in the center, stained with ages of offerings. Power hums in the air, making your skin tingle. From the shadows between the stones, satyrs watch your approach with knowing grins.',
    depth: 9,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_STONES_RITUAL_1]: {
    id: WOODS_STONES_RITUAL_1,
    name: 'Ritual Ground',
    description:
      'Scorch marks blacken the ground in ritualistic patterns, the earth still warm to the touch. Broken ritual implements - shattered bowls, snapped wands, torn robes - lie scattered about. Dark stains that can only be dried blood form symbols you dare not study too closely. From somewhere deeper in, the sound of chanting drifts on the wind.',
    depth: 10,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_STONES_RITUAL_2]: {
    id: WOODS_STONES_RITUAL_2,
    name: 'Ritual Ground',
    description:
      'A circle of skulls surrounds this clearing, their empty eye sockets facing inward as if bearing witness. Guttering candles of black wax burn with sickly green flames that give off no heat. Corruption seeps from the ground itself, the earth cracked and weeping dark ichor. Hooded druids move about the space, performing their terrible rites with practiced precision.',
    depth: 10,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_STONES_ALTAR]: {
    id: WOODS_STONES_ALTAR,
    name: "Shaman's Altar",
    description:
      'A massive altar stone dominates this unholy place, its surface carved with profane symbols that hurt to look upon. Dark energy swirls around the altar in visible currents, crackling with malevolent power. The Satyr Shaman presides over this place of corruption, its twisted form wreathed in shadow. Spirits of the dead hang in chains of ethereal light, their silent screams visible on their tortured faces.',
    depth: 11,
    biome: { forest: 1 },
    isSafeZone: false,
    isBossRoom: true,
    creatures: [],
    items: [],
    npcs: [],
  },

  // ============ Thornwood Maze ============
  [WOODS_THORN_ENTRANCE]: {
    id: WOODS_THORN_ENTRANCE,
    name: 'Maze Entrance',
    description:
      'A wall of brambles rises before you, impenetrable save for a single narrow gap barely wide enough to squeeze through. The thorns drip with red sap that smells of copper and regret. A path is barely visible through the opening, winding into darkness. Beautiful roses bloom on the deadly vines, their petals the color of fresh blood.',
    depth: 9,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_THORN_PATH]: {
    id: WOODS_THORN_PATH,
    name: 'Bramble Path',
    description:
      'The thorns close in on both sides, scratching and tearing at your clothes and skin with every step. The path twists confusingly, doubling back on itself in ways that defy logic. Small cuts weep blood that the brambles seem to drink eagerly. You cannot shake the feeling that the maze is herding you somewhere.',
    depth: 10,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_THORN_DEAD_1]: {
    id: WOODS_THORN_DEAD_1,
    name: 'Dead End',
    description:
      'The path ends abruptly in a wall of thorns so thick no light passes through. You must backtrack, but which way did you come? Something rustles in the brambles behind you. You could swear the maze shifted while you stood here.',
    depth: 11,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_THORN_DEAD_2]: {
    id: WOODS_THORN_DEAD_2,
    name: 'Dead End',
    description:
      'Another dead end. The thorns are thicker here, the roses larger and more menacing. Bones are tangled in the brambles - some animal, some not. The vines shift and writhe almost imperceptibly. The maze is alive, and it is hungry.',
    depth: 11,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_THORN_DEAD_3]: {
    id: WOODS_THORN_DEAD_3,
    name: 'Dead End',
    description:
      'A skeleton slumps against the thorn wall, bony fingers still clutching a tattered map. You pry it free and examine it, but the paths it shows do not match reality. Desperate scratches mark the thorns where the dead adventurer tried to claw their way free. Their fate awaits any who linger too long.',
    depth: 11,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_THORN_GARDEN]: {
    id: WOODS_THORN_GARDEN,
    name: 'Thorn Garden',
    description:
      'A garden of terrible beauty opens before you. Roses of every color bloom in perfect arrangements, their thorns gleaming like daggers. Some flowers snap at passing insects with teeth hidden in their petals. Treants stand motionless among the growth, indistinguishable from dead trees until you look too closely. Beauty and death are woven together here.',
    depth: 12,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_THORN_DEN]: {
    id: WOODS_THORN_DEN,
    name: "Thornlord's Den",
    description:
      'The heart of the maze pulses with dark life. Here the Thornlord holds court, a being of wood and thorn that has become one with the walls themselves. Vines bow and part at their lord\'s will. The roses turn their faces toward you like a hungry audience. Escape seems impossible - the maze will not release its prey easily.',
    depth: 13,
    biome: { forest: 1 },
    isSafeZone: false,
    isBossRoom: true,
    creatures: [],
    items: [],
    npcs: [],
  },

  // ============ Matriarch's Sanctum ============
  [WOODS_SANCTUM_ALTAR]: {
    id: WOODS_SANCTUM_ALTAR,
    name: 'Blighted Altar',
    description:
      'An ancient altar of weathered stone stands at the center of a dying glade. Five slots are carved into its surface, each shaped to hold a fragment of something once whole. Corruption pulses from the altar in visible waves, and a locked gate of twisted roots blocks the path beyond. The key must be assembled here.',
    depth: 14,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_SANCTUM_GROVE]: {
    id: WOODS_SANCTUM_GROVE,
    name: 'Blighted Grove',
    description:
      'The trees here are twisted in agony, their bark blackened and weeping dark sap. Corruption hangs visible in the air like a sickly mist, and corrupted dryads patrol between the tortured trunks. The source of the blight is near - you can feel it pulling at your very essence. Nature itself screams silently in this forsaken place.',
    depth: 15,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_SANCTUM_APPROACH]: {
    id: WOODS_SANCTUM_APPROACH,
    name: 'Sanctum Approach',
    description:
      "A path of dead flowers leads toward the heart of corruption. The Matriarch's handmaidens guard the way, their once-beautiful forms now terrible to behold. The presence of the Dryad Matriarch weighs heavy upon your soul - her power is unmistakable. This is the point of no return.",
    depth: 16,
    biome: { forest: 1 },
    isSafeZone: false,
    creatures: [],
    items: [],
    npcs: [],
  },
  [WOODS_SANCTUM_HEART]: {
    id: WOODS_SANCTUM_HEART,
    name: 'Heart of the Grove',
    description:
      "A massive corrupted tree dominates the center of this accursed place, its trunk twisted into a throne of living wood. Upon it sits the Dryad Matriarch, her beauty terrible and her power absolute. The corruption's source is revealed at last - it flows from her very being, poisoning all the forest touches. She has been waiting for you.",
    depth: 17,
    biome: { forest: 1 },
    isSafeZone: false,
    isBossRoom: true,
    creatures: [],
    items: [],
    npcs: [],
  },
};
export const WOODS_EXITS: Record<string, Exit> = {
  // ============ Transition Zone Chain ============
  // town_east_road -> WOODS_FARMHOUSE
  exit_eastroad_farmhouse: {
    id: 'exit_eastroad_farmhouse',
    from: TOWN_EAST_ROAD,
    to: WOODS_FARMHOUSE,
    label: 'east',
    type: 'open',
  },
  exit_farmhouse_eastroad: {
    id: 'exit_farmhouse_eastroad',
    from: WOODS_FARMHOUSE,
    to: TOWN_EAST_ROAD,
    label: 'west',
    type: 'open',
  },
  // WOODS_FARMHOUSE -> WOODS_FIELDS
  exit_farmhouse_fields: {
    id: 'exit_farmhouse_fields',
    from: WOODS_FARMHOUSE,
    to: WOODS_FIELDS,
    label: 'east',
    type: 'open',
  },
  exit_fields_farmhouse: {
    id: 'exit_fields_farmhouse',
    from: WOODS_FIELDS,
    to: WOODS_FARMHOUSE,
    label: 'west',
    type: 'open',
  },
  // WOODS_FIELDS -> WOODS_EAST_GATE
  exit_fields_eastgate: {
    id: 'exit_fields_eastgate',
    from: WOODS_FIELDS,
    to: WOODS_EAST_GATE,
    label: 'east',
    type: 'open',
  },
  exit_eastgate_fields: {
    id: 'exit_eastgate_fields',
    from: WOODS_EAST_GATE,
    to: WOODS_FIELDS,
    label: 'west',
    type: 'open',
  },
  // WOODS_EAST_GATE -> WOODS_OLD_ROAD_1
  exit_eastgate_oldroad1: {
    id: 'exit_eastgate_oldroad1',
    from: WOODS_EAST_GATE,
    to: WOODS_OLD_ROAD_1,
    label: 'east',
    type: 'open',
  },
  exit_oldroad1_eastgate: {
    id: 'exit_oldroad1_eastgate',
    from: WOODS_OLD_ROAD_1,
    to: WOODS_EAST_GATE,
    label: 'west',
    type: 'open',
  },
  // WOODS_OLD_ROAD_1 -> WOODS_OLD_ROAD_2
  exit_oldroad1_oldroad2: {
    id: 'exit_oldroad1_oldroad2',
    from: WOODS_OLD_ROAD_1,
    to: WOODS_OLD_ROAD_2,
    label: 'east',
    type: 'open',
  },
  exit_oldroad2_oldroad1: {
    id: 'exit_oldroad2_oldroad1',
    from: WOODS_OLD_ROAD_2,
    to: WOODS_OLD_ROAD_1,
    label: 'west',
    type: 'open',
  },
  // WOODS_OLD_ROAD_2 -> WOODS_OLD_ROAD_3
  exit_oldroad2_oldroad3: {
    id: 'exit_oldroad2_oldroad3',
    from: WOODS_OLD_ROAD_2,
    to: WOODS_OLD_ROAD_3,
    label: 'east',
    type: 'open',
  },
  exit_oldroad3_oldroad2: {
    id: 'exit_oldroad3_oldroad2',
    from: WOODS_OLD_ROAD_3,
    to: WOODS_OLD_ROAD_2,
    label: 'west',
    type: 'open',
  },
  // WOODS_OLD_ROAD_3 -> WOODS_OLD_ROAD_4
  exit_oldroad3_oldroad4: {
    id: 'exit_oldroad3_oldroad4',
    from: WOODS_OLD_ROAD_3,
    to: WOODS_OLD_ROAD_4,
    label: 'east',
    type: 'open',
  },
  exit_oldroad4_oldroad3: {
    id: 'exit_oldroad4_oldroad3',
    from: WOODS_OLD_ROAD_4,
    to: WOODS_OLD_ROAD_3,
    label: 'west',
    type: 'open',
  },
  // WOODS_OLD_ROAD_4 -> WOODS_OLD_ROAD_5
  exit_oldroad4_oldroad5: {
    id: 'exit_oldroad4_oldroad5',
    from: WOODS_OLD_ROAD_4,
    to: WOODS_OLD_ROAD_5,
    label: 'east',
    type: 'open',
  },
  exit_oldroad5_oldroad4: {
    id: 'exit_oldroad5_oldroad4',
    from: WOODS_OLD_ROAD_5,
    to: WOODS_OLD_ROAD_4,
    label: 'west',
    type: 'open',
  },
  // WOODS_OLD_ROAD_5 -> WOODS_CLEARING
  exit_oldroad5_clearing: {
    id: 'exit_oldroad5_clearing',
    from: WOODS_OLD_ROAD_5,
    to: WOODS_CLEARING,
    label: 'east',
    type: 'open',
  },
  exit_clearing_oldroad5: {
    id: 'exit_clearing_oldroad5',
    from: WOODS_CLEARING,
    to: WOODS_OLD_ROAD_5,
    label: 'west',
    type: 'open',
  },

  // ============ Hub to Sub-Zones ============
  // WOODS_CLEARING -> WOODS_PIXIE_ENTRANCE (north/south)
  exit_clearing_pixie_entrance: {
    id: 'exit_clearing_pixie_entrance',
    from: WOODS_CLEARING,
    to: WOODS_PIXIE_ENTRANCE,
    label: 'north',
    type: 'open',
  },
  exit_pixie_entrance_clearing: {
    id: 'exit_pixie_entrance_clearing',
    from: WOODS_PIXIE_ENTRANCE,
    to: WOODS_CLEARING,
    label: 'south',
    type: 'open',
  },
  // WOODS_CLEARING -> WOODS_FEN_ENTRANCE (northwest/southeast)
  exit_clearing_fen_entrance: {
    id: 'exit_clearing_fen_entrance',
    from: WOODS_CLEARING,
    to: WOODS_FEN_ENTRANCE,
    label: 'northwest',
    type: 'open',
  },
  exit_fen_entrance_clearing: {
    id: 'exit_fen_entrance_clearing',
    from: WOODS_FEN_ENTRANCE,
    to: WOODS_CLEARING,
    label: 'southeast',
    type: 'open',
  },
  // WOODS_CLEARING -> WOODS_STONES_ENTRANCE (east/west)
  exit_clearing_stones_entrance: {
    id: 'exit_clearing_stones_entrance',
    from: WOODS_CLEARING,
    to: WOODS_STONES_ENTRANCE,
    label: 'east',
    type: 'open',
  },
  exit_stones_entrance_clearing: {
    id: 'exit_stones_entrance_clearing',
    from: WOODS_STONES_ENTRANCE,
    to: WOODS_CLEARING,
    label: 'west',
    type: 'open',
  },
  // WOODS_CLEARING -> WOODS_SPIDER_ENTRANCE (southeast/northwest)
  exit_clearing_spider_entrance: {
    id: 'exit_clearing_spider_entrance',
    from: WOODS_CLEARING,
    to: WOODS_SPIDER_ENTRANCE,
    label: 'southeast',
    type: 'open',
  },
  exit_spider_entrance_clearing: {
    id: 'exit_spider_entrance_clearing',
    from: WOODS_SPIDER_ENTRANCE,
    to: WOODS_CLEARING,
    label: 'northwest',
    type: 'open',
  },
  // WOODS_CLEARING -> WOODS_THORN_ENTRANCE (south/north)
  exit_clearing_thorn_entrance: {
    id: 'exit_clearing_thorn_entrance',
    from: WOODS_CLEARING,
    to: WOODS_THORN_ENTRANCE,
    label: 'south',
    type: 'open',
  },
  exit_thorn_entrance_clearing: {
    id: 'exit_thorn_entrance_clearing',
    from: WOODS_THORN_ENTRANCE,
    to: WOODS_CLEARING,
    label: 'north',
    type: 'open',
  },

  // ============ Pixie Dell Internal ============
  // PIXIE_ENTRANCE -> PIXIE_GLADE (north/south)
  exit_pixie_entrance_glade: {
    id: 'exit_pixie_entrance_glade',
    from: WOODS_PIXIE_ENTRANCE,
    to: WOODS_PIXIE_GLADE,
    label: 'north',
    type: 'open',
  },
  exit_pixie_glade_entrance: {
    id: 'exit_pixie_glade_entrance',
    from: WOODS_PIXIE_GLADE,
    to: WOODS_PIXIE_ENTRANCE,
    label: 'south',
    type: 'open',
  },
  // PIXIE_GLADE -> PIXIE_MAZE_1 (north/south)
  exit_pixie_glade_maze1: {
    id: 'exit_pixie_glade_maze1',
    from: WOODS_PIXIE_GLADE,
    to: WOODS_PIXIE_MAZE_1,
    label: 'north',
    type: 'open',
  },
  exit_pixie_maze1_glade: {
    id: 'exit_pixie_maze1_glade',
    from: WOODS_PIXIE_MAZE_1,
    to: WOODS_PIXIE_GLADE,
    label: 'south',
    type: 'open',
  },
  // PIXIE_MAZE_1 -> PIXIE_MAZE_2 (east/west)
  exit_pixie_maze1_maze2: {
    id: 'exit_pixie_maze1_maze2',
    from: WOODS_PIXIE_MAZE_1,
    to: WOODS_PIXIE_MAZE_2,
    label: 'east',
    type: 'open',
  },
  exit_pixie_maze2_maze1: {
    id: 'exit_pixie_maze2_maze1',
    from: WOODS_PIXIE_MAZE_2,
    to: WOODS_PIXIE_MAZE_1,
    label: 'west',
    type: 'open',
  },
  // PIXIE_MAZE_2 -> PIXIE_MAZE_3 (north/south)
  exit_pixie_maze2_maze3: {
    id: 'exit_pixie_maze2_maze3',
    from: WOODS_PIXIE_MAZE_2,
    to: WOODS_PIXIE_MAZE_3,
    label: 'north',
    type: 'open',
  },
  exit_pixie_maze3_maze2: {
    id: 'exit_pixie_maze3_maze2',
    from: WOODS_PIXIE_MAZE_3,
    to: WOODS_PIXIE_MAZE_2,
    label: 'south',
    type: 'open',
  },
  // PIXIE_MAZE_3 -> PIXIE_TRAPPED (east/west)
  exit_pixie_maze3_trapped: {
    id: 'exit_pixie_maze3_trapped',
    from: WOODS_PIXIE_MAZE_3,
    to: WOODS_PIXIE_TRAPPED,
    label: 'east',
    type: 'open',
  },
  exit_pixie_trapped_maze3: {
    id: 'exit_pixie_trapped_maze3',
    from: WOODS_PIXIE_TRAPPED,
    to: WOODS_PIXIE_MAZE_3,
    label: 'west',
    type: 'open',
  },
  // PIXIE_TRAPPED -> PIXIE_COURT (north/south)
  exit_pixie_trapped_court: {
    id: 'exit_pixie_trapped_court',
    from: WOODS_PIXIE_TRAPPED,
    to: WOODS_PIXIE_COURT,
    label: 'north',
    type: 'open',
  },
  exit_pixie_court_trapped: {
    id: 'exit_pixie_court_trapped',
    from: WOODS_PIXIE_COURT,
    to: WOODS_PIXIE_TRAPPED,
    label: 'south',
    type: 'open',
  },

  // ============ Murky Fen Internal ============
  // FEN_ENTRANCE -> FEN_BOG_PATH (north/south)
  exit_fen_entrance_bog: {
    id: 'exit_fen_entrance_bog',
    from: WOODS_FEN_ENTRANCE,
    to: WOODS_FEN_BOG_PATH,
    label: 'north',
    type: 'open',
  },
  exit_fen_bog_entrance: {
    id: 'exit_fen_bog_entrance',
    from: WOODS_FEN_BOG_PATH,
    to: WOODS_FEN_ENTRANCE,
    label: 'south',
    type: 'open',
  },
  // FEN_BOG_PATH -> FEN_RUINS_1 (north/south)
  exit_fen_bog_ruins1: {
    id: 'exit_fen_bog_ruins1',
    from: WOODS_FEN_BOG_PATH,
    to: WOODS_FEN_RUINS_1,
    label: 'north',
    type: 'open',
  },
  exit_fen_ruins1_bog: {
    id: 'exit_fen_ruins1_bog',
    from: WOODS_FEN_RUINS_1,
    to: WOODS_FEN_BOG_PATH,
    label: 'south',
    type: 'open',
  },
  // FEN_RUINS_1 -> FEN_RUINS_2 (east/west)
  exit_fen_ruins1_ruins2: {
    id: 'exit_fen_ruins1_ruins2',
    from: WOODS_FEN_RUINS_1,
    to: WOODS_FEN_RUINS_2,
    label: 'east',
    type: 'open',
  },
  exit_fen_ruins2_ruins1: {
    id: 'exit_fen_ruins2_ruins1',
    from: WOODS_FEN_RUINS_2,
    to: WOODS_FEN_RUINS_1,
    label: 'west',
    type: 'open',
  },
  // FEN_RUINS_2 -> FEN_CAMP (north/south)
  exit_fen_ruins2_camp: {
    id: 'exit_fen_ruins2_camp',
    from: WOODS_FEN_RUINS_2,
    to: WOODS_FEN_CAMP,
    label: 'north',
    type: 'open',
  },
  exit_fen_camp_ruins2: {
    id: 'exit_fen_camp_ruins2',
    from: WOODS_FEN_CAMP,
    to: WOODS_FEN_RUINS_2,
    label: 'south',
    type: 'open',
  },
  // FEN_CAMP -> FEN_MOUND (north/south)
  exit_fen_camp_mound: {
    id: 'exit_fen_camp_mound',
    from: WOODS_FEN_CAMP,
    to: WOODS_FEN_MOUND,
    label: 'north',
    type: 'open',
  },
  exit_fen_mound_camp: {
    id: 'exit_fen_mound_camp',
    from: WOODS_FEN_MOUND,
    to: WOODS_FEN_CAMP,
    label: 'south',
    type: 'open',
  },

  // ============ Standing Stones Internal ============
  // STONES_ENTRANCE -> STONES_OLD_PATH (east/west)
  exit_stones_entrance_oldpath: {
    id: 'exit_stones_entrance_oldpath',
    from: WOODS_STONES_ENTRANCE,
    to: WOODS_STONES_OLD_PATH,
    label: 'east',
    type: 'open',
  },
  exit_stones_oldpath_entrance: {
    id: 'exit_stones_oldpath_entrance',
    from: WOODS_STONES_OLD_PATH,
    to: WOODS_STONES_ENTRANCE,
    label: 'west',
    type: 'open',
  },
  // STONES_OLD_PATH -> STONES_CIRCLE (east/west)
  exit_stones_oldpath_circle: {
    id: 'exit_stones_oldpath_circle',
    from: WOODS_STONES_OLD_PATH,
    to: WOODS_STONES_CIRCLE,
    label: 'east',
    type: 'open',
  },
  exit_stones_circle_oldpath: {
    id: 'exit_stones_circle_oldpath',
    from: WOODS_STONES_CIRCLE,
    to: WOODS_STONES_OLD_PATH,
    label: 'west',
    type: 'open',
  },
  // STONES_CIRCLE -> STONES_RITUAL_1 (north/south)
  exit_stones_circle_ritual1: {
    id: 'exit_stones_circle_ritual1',
    from: WOODS_STONES_CIRCLE,
    to: WOODS_STONES_RITUAL_1,
    label: 'north',
    type: 'open',
  },
  exit_stones_ritual1_circle: {
    id: 'exit_stones_ritual1_circle',
    from: WOODS_STONES_RITUAL_1,
    to: WOODS_STONES_CIRCLE,
    label: 'south',
    type: 'open',
  },
  // STONES_RITUAL_1 -> STONES_RITUAL_2 (east/west)
  exit_stones_ritual1_ritual2: {
    id: 'exit_stones_ritual1_ritual2',
    from: WOODS_STONES_RITUAL_1,
    to: WOODS_STONES_RITUAL_2,
    label: 'east',
    type: 'open',
  },
  exit_stones_ritual2_ritual1: {
    id: 'exit_stones_ritual2_ritual1',
    from: WOODS_STONES_RITUAL_2,
    to: WOODS_STONES_RITUAL_1,
    label: 'west',
    type: 'open',
  },
  // STONES_RITUAL_2 -> STONES_ALTAR (north/south)
  exit_stones_ritual2_altar: {
    id: 'exit_stones_ritual2_altar',
    from: WOODS_STONES_RITUAL_2,
    to: WOODS_STONES_ALTAR,
    label: 'north',
    type: 'open',
  },
  exit_stones_altar_ritual2: {
    id: 'exit_stones_altar_ritual2',
    from: WOODS_STONES_ALTAR,
    to: WOODS_STONES_RITUAL_2,
    label: 'south',
    type: 'open',
  },

  // ============ Spider Hollow Internal ============
  // SPIDER_ENTRANCE -> SPIDER_TRAIL (south/north)
  exit_spider_entrance_trail: {
    id: 'exit_spider_entrance_trail',
    from: WOODS_SPIDER_ENTRANCE,
    to: WOODS_SPIDER_TRAIL,
    label: 'south',
    type: 'open',
  },
  exit_spider_trail_entrance: {
    id: 'exit_spider_trail_entrance',
    from: WOODS_SPIDER_TRAIL,
    to: WOODS_SPIDER_ENTRANCE,
    label: 'north',
    type: 'open',
  },
  // SPIDER_TRAIL -> SPIDER_COCOON (south/north)
  exit_spider_trail_cocoon: {
    id: 'exit_spider_trail_cocoon',
    from: WOODS_SPIDER_TRAIL,
    to: WOODS_SPIDER_COCOON,
    label: 'south',
    type: 'open',
  },
  exit_spider_cocoon_trail: {
    id: 'exit_spider_cocoon_trail',
    from: WOODS_SPIDER_COCOON,
    to: WOODS_SPIDER_TRAIL,
    label: 'north',
    type: 'open',
  },
  // SPIDER_COCOON -> SPIDER_NEST_1 (south/north)
  exit_spider_cocoon_nest1: {
    id: 'exit_spider_cocoon_nest1',
    from: WOODS_SPIDER_COCOON,
    to: WOODS_SPIDER_NEST_1,
    label: 'south',
    type: 'open',
  },
  exit_spider_nest1_cocoon: {
    id: 'exit_spider_nest1_cocoon',
    from: WOODS_SPIDER_NEST_1,
    to: WOODS_SPIDER_COCOON,
    label: 'north',
    type: 'open',
  },
  // SPIDER_NEST_1 -> SPIDER_NEST_2 (east/west)
  exit_spider_nest1_nest2: {
    id: 'exit_spider_nest1_nest2',
    from: WOODS_SPIDER_NEST_1,
    to: WOODS_SPIDER_NEST_2,
    label: 'east',
    type: 'open',
  },
  exit_spider_nest2_nest1: {
    id: 'exit_spider_nest2_nest1',
    from: WOODS_SPIDER_NEST_2,
    to: WOODS_SPIDER_NEST_1,
    label: 'west',
    type: 'open',
  },
  // SPIDER_NEST_2 -> SPIDER_NEST_3 (south/north)
  exit_spider_nest2_nest3: {
    id: 'exit_spider_nest2_nest3',
    from: WOODS_SPIDER_NEST_2,
    to: WOODS_SPIDER_NEST_3,
    label: 'south',
    type: 'open',
  },
  exit_spider_nest3_nest2: {
    id: 'exit_spider_nest3_nest2',
    from: WOODS_SPIDER_NEST_3,
    to: WOODS_SPIDER_NEST_2,
    label: 'north',
    type: 'open',
  },
  // SPIDER_NEST_3 -> SPIDER_LAIR (south/north)
  exit_spider_nest3_lair: {
    id: 'exit_spider_nest3_lair',
    from: WOODS_SPIDER_NEST_3,
    to: WOODS_SPIDER_LAIR,
    label: 'south',
    type: 'open',
  },
  exit_spider_lair_nest3: {
    id: 'exit_spider_lair_nest3',
    from: WOODS_SPIDER_LAIR,
    to: WOODS_SPIDER_NEST_3,
    label: 'north',
    type: 'open',
  },

  // ============ Thornwood Maze Internal ============
  // THORN_ENTRANCE -> THORN_PATH (south/north)
  exit_thorn_entrance_path: {
    id: 'exit_thorn_entrance_path',
    from: WOODS_THORN_ENTRANCE,
    to: WOODS_THORN_PATH,
    label: 'south',
    type: 'open',
  },
  exit_thorn_path_entrance: {
    id: 'exit_thorn_path_entrance',
    from: WOODS_THORN_PATH,
    to: WOODS_THORN_ENTRANCE,
    label: 'north',
    type: 'open',
  },
  // THORN_PATH -> THORN_DEAD_1 (east/west)
  exit_thorn_path_dead1: {
    id: 'exit_thorn_path_dead1',
    from: WOODS_THORN_PATH,
    to: WOODS_THORN_DEAD_1,
    label: 'east',
    type: 'open',
  },
  exit_thorn_dead1_path: {
    id: 'exit_thorn_dead1_path',
    from: WOODS_THORN_DEAD_1,
    to: WOODS_THORN_PATH,
    label: 'west',
    type: 'open',
  },
  // THORN_PATH -> THORN_DEAD_2 (west/east)
  exit_thorn_path_dead2: {
    id: 'exit_thorn_path_dead2',
    from: WOODS_THORN_PATH,
    to: WOODS_THORN_DEAD_2,
    label: 'west',
    type: 'open',
  },
  exit_thorn_dead2_path: {
    id: 'exit_thorn_dead2_path',
    from: WOODS_THORN_DEAD_2,
    to: WOODS_THORN_PATH,
    label: 'east',
    type: 'open',
  },
  // THORN_PATH -> THORN_GARDEN (south/north) - main path
  exit_thorn_path_garden: {
    id: 'exit_thorn_path_garden',
    from: WOODS_THORN_PATH,
    to: WOODS_THORN_GARDEN,
    label: 'south',
    type: 'open',
  },
  exit_thorn_garden_path: {
    id: 'exit_thorn_garden_path',
    from: WOODS_THORN_GARDEN,
    to: WOODS_THORN_PATH,
    label: 'north',
    type: 'open',
  },
  // THORN_DEAD_1 -> THORN_DEAD_3 (south/north) - connects dead ends
  exit_thorn_dead1_dead3: {
    id: 'exit_thorn_dead1_dead3',
    from: WOODS_THORN_DEAD_1,
    to: WOODS_THORN_DEAD_3,
    label: 'south',
    type: 'open',
  },
  exit_thorn_dead3_dead1: {
    id: 'exit_thorn_dead3_dead1',
    from: WOODS_THORN_DEAD_3,
    to: WOODS_THORN_DEAD_1,
    label: 'north',
    type: 'open',
  },
  // THORN_GARDEN -> THORN_DEN (south/north)
  exit_thorn_garden_den: {
    id: 'exit_thorn_garden_den',
    from: WOODS_THORN_GARDEN,
    to: WOODS_THORN_DEN,
    label: 'south',
    type: 'open',
  },
  exit_thorn_den_garden: {
    id: 'exit_thorn_den_garden',
    from: WOODS_THORN_DEN,
    to: WOODS_THORN_GARDEN,
    label: 'north',
    type: 'open',
  },

  // ============ Thornwood to Sanctum ============
  // THORN_DEN -> SANCTUM_ALTAR (south/north)
  exit_thorn_den_sanctum: {
    id: 'exit_thorn_den_sanctum',
    from: WOODS_THORN_DEN,
    to: WOODS_SANCTUM_ALTAR,
    label: 'south',
    type: 'open',
  },
  exit_sanctum_altar_den: {
    id: 'exit_sanctum_altar_den',
    from: WOODS_SANCTUM_ALTAR,
    to: WOODS_THORN_DEN,
    label: 'north',
    type: 'open',
  },

  // ============ Sanctum Internal ============
  // SANCTUM_ALTAR -> SANCTUM_GROVE (south/north) - LOCKED
  exit_sanctum_altar_grove: {
    id: 'exit_sanctum_altar_grove',
    from: WOODS_SANCTUM_ALTAR,
    to: WOODS_SANCTUM_GROVE,
    label: 'south',
    type: 'locked',
    requirement: { kind: 'quest', value: 'dryads_heart_key' },
  },
  exit_sanctum_grove_altar: {
    id: 'exit_sanctum_grove_altar',
    from: WOODS_SANCTUM_GROVE,
    to: WOODS_SANCTUM_ALTAR,
    label: 'north',
    type: 'open',
  },
  // SANCTUM_GROVE -> SANCTUM_APPROACH (south/north)
  exit_sanctum_grove_approach: {
    id: 'exit_sanctum_grove_approach',
    from: WOODS_SANCTUM_GROVE,
    to: WOODS_SANCTUM_APPROACH,
    label: 'south',
    type: 'open',
  },
  exit_sanctum_approach_grove: {
    id: 'exit_sanctum_approach_grove',
    from: WOODS_SANCTUM_APPROACH,
    to: WOODS_SANCTUM_GROVE,
    label: 'north',
    type: 'open',
  },
  // SANCTUM_APPROACH -> SANCTUM_HEART (south/north)
  exit_sanctum_approach_heart: {
    id: 'exit_sanctum_approach_heart',
    from: WOODS_SANCTUM_APPROACH,
    to: WOODS_SANCTUM_HEART,
    label: 'south',
    type: 'open',
  },
  exit_sanctum_heart_approach: {
    id: 'exit_sanctum_heart_approach',
    from: WOODS_SANCTUM_HEART,
    to: WOODS_SANCTUM_APPROACH,
    label: 'north',
    type: 'open',
  },
};
