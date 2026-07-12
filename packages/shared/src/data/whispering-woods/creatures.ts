/**
 * Whispering Woods creature templates.
 * A fey-themed dark forest zone for levels 7-20.
 */

import type { CreatureTemplate } from '../../types/world';

// ============ Pixie Dell (L7-10) ============

const MISCHIEVOUS_SPRITE: CreatureTemplate = {
  id: 'mischievous_sprite',
  name: 'Mischievous Sprite',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 7,
  maxDepth: 10,
  baseHp: 45,
  baseLevel: 7,
  spawnWeight: 8,
  damageType: 'arcane',
  descriptions: {
    idle: [
      'A tiny winged figure darts between the branches, giggling maliciously.',
      'Motes of light swirl around a small sprite hovering nearby.',
      'A mischievous sprite watches you with glittering, too-wide eyes.',
    ],
    alert: [
      'The sprite shrieks with laughter and hurls a bolt of crackling magic!',
      'Arcane energy swirls around the sprite as it attacks!',
    ],
  },
};

const QUICKLING: CreatureTemplate = {
  id: 'quickling',
  name: 'Quickling',
  behavior: 'aggressive',
  mobility: 'roaming',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 7,
  maxDepth: 10,
  baseHp: 35,
  baseLevel: 8,
  spawnWeight: 6,
  damageType: 'physical',
  descriptions: {
    idle: [
      'A blur of movement catches your eye - something fast is nearby.',
      'You glimpse a tiny humanoid moving at impossible speed.',
      'The undergrowth rustles as something zips past too quickly to see.',
    ],
    alert: [
      'The quickling appears in a blur, daggers flashing!',
      'A high-pitched cackle precedes a flurry of tiny blade strikes!',
    ],
  },
};

const HOSTILE_PIXIE: CreatureTemplate = {
  id: 'hostile_pixie',
  name: 'Hostile Pixie',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 8,
  maxDepth: 11,
  baseHp: 55,
  baseLevel: 9,
  spawnWeight: 5,
  damageType: 'arcane',
  descriptions: {
    idle: [
      'A pixie with dark, twisted wings hovers menacingly before you.',
      'Malevolent violet light emanates from a corrupted pixie.',
      'A pixie bares needle-sharp teeth, its eyes glowing with spite.',
    ],
    alert: [
      'The pixie unleashes a barrage of stinging arcane bolts!',
      'With a shriek of rage, the pixie attacks in a whirlwind of dark magic!',
    ],
  },
};

const SPRITE_TRICKSTER: CreatureTemplate = {
  id: 'sprite_trickster',
  name: 'Sprite Trickster',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['forest'],
  minDepth: 9,
  maxDepth: 12,
  baseHp: 180,
  baseLevel: 10,
  spawnWeight: 0, // Boss
  damageType: 'arcane',
  descriptions: {
    idle: [
      'The Sprite Trickster lounges on a throne of twisted branches, surrounded by dancing lights.',
      'A larger sprite wearing a crown of thorns regards you with cruel amusement.',
    ],
    alert: [
      'The Sprite Trickster rises, reality warping around it as it prepares devastating magic!',
      '"Playtime!" the Trickster cackles, conjuring storms of arcane energy!',
    ],
  },
};

// ============ Murky Fen (L9-12) ============

const SHADOW_HOUND: CreatureTemplate = {
  id: 'shadow_hound',
  name: 'Shadow Hound',
  behavior: 'aggressive',
  mobility: 'roaming',
  tier: 'common',
  biomes: ['forest', 'swamp'],
  minDepth: 9,
  maxDepth: 13,
  baseHp: 65,
  baseLevel: 9,
  spawnWeight: 5,
  damageType: 'shadow',
  descriptions: {
    idle: [
      'A hound made of living shadow prowls through the mist.',
      'Red eyes gleam from a mass of darkness that moves like a wolf.',
      'The shadow hound paces silently, leaving no tracks in the mud.',
    ],
    alert: [
      'The shadow hound lunges, its form flickering between solid and ethereal!',
      'Darkness trails behind the hound as it charges with a soundless snarl!',
    ],
  },
};

const REDCAP: CreatureTemplate = {
  id: 'redcap',
  name: 'Redcap',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest', 'swamp'],
  minDepth: 9,
  maxDepth: 13,
  baseHp: 75,
  baseLevel: 10,
  spawnWeight: 5,
  damageType: 'physical',
  descriptions: {
    idle: [
      'A gnarled, wicked-looking fey creature adjusts its blood-soaked cap.',
      'A redcap sharpens its iron boots, humming a tuneless dirge.',
      "The redcap's namesake cap drips with old, dark blood.",
    ],
    alert: [
      'The redcap lunges with its iron pike, cackling with murderous glee!',
      '"MORE BLOOD FOR THE CAP!" the redcap shrieks, attacking savagely!',
    ],
  },
};

const BOG_LURKER: CreatureTemplate = {
  id: 'bog_lurker',
  name: 'Bog Lurker',
  behavior: 'territorial',
  mobility: 'static',
  tier: 'common',
  biomes: ['swamp'],
  minDepth: 10,
  maxDepth: 14,
  baseHp: 90,
  baseLevel: 11,
  spawnWeight: 4,
  damageType: 'nature',
  descriptions: {
    idle: [
      'The murky water bubbles as something massive shifts beneath.',
      'A shape of rotting vegetation and mud rises partially from the bog.',
      'Reeds and debris cling to a creature barely distinguishable from the swamp itself.',
    ],
    alert: [
      'The bog lurker erupts from the water, flailing with moss-covered limbs!',
      'A wave of fetid swamp water crashes toward you as the lurker attacks!',
    ],
  },
};

const REDCAP_CHIEFTAIN: CreatureTemplate = {
  id: 'redcap_chieftain',
  name: 'Redcap Chieftain',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['forest', 'swamp'],
  minDepth: 11,
  maxDepth: 14,
  baseHp: 250,
  baseLevel: 12,
  spawnWeight: 0, // Boss
  damageType: 'physical',
  descriptions: {
    idle: [
      'The Redcap Chieftain sits upon a throne of bones, its cap drenched in fresh blood.',
      'A massive redcap draped in trophies from fallen adventurers surveys its territory.',
    ],
    alert: [
      "The Chieftain hefts a wicked executioner's axe and charges with a battle cry!",
      '"YOUR BLOOD WILL REFRESH MY CAP!" the Chieftain roars, attacking with brutal fury!',
    ],
  },
};

// ============ Standing Stones (L11-14) ============

const WILL_O_WISP: CreatureTemplate = {
  id: 'will_o_wisp',
  name: "Will-o'-Wisp",
  behavior: 'aggressive',
  mobility: 'roaming',
  tier: 'common',
  biomes: ['forest', 'swamp'],
  minDepth: 11,
  maxDepth: 15,
  baseHp: 50,
  baseLevel: 11,
  spawnWeight: 5,
  damageType: 'arcane',
  descriptions: {
    idle: [
      'A ghostly light bobs and weaves through the mist.',
      'An eerie glow pulses in the darkness, beckoning you closer.',
      "The will-o'-wisp flickers hypnotically, luring the unwary.",
    ],
    alert: [
      'The wisp flares bright and channels searing energy toward you!',
      'Lightning crackles from the wisp as it attacks with malicious intent!',
    ],
  },
};

const DARK_SATYR: CreatureTemplate = {
  id: 'dark_satyr',
  name: 'Dark Satyr',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 11,
  maxDepth: 15,
  baseHp: 95,
  baseLevel: 12,
  spawnWeight: 4,
  damageType: 'shadow',
  descriptions: {
    idle: [
      'A satyr wreathed in shadow plays a discordant tune on its pipes.',
      "The dark satyr's eyes gleam with malevolence from the gloom.",
      'A corrupted satyr stamps its hooves, darkness pooling at its feet.',
    ],
    alert: [
      "The satyr's music shifts to a cacophony of pain and shadow magic!",
      'Dark energy swirls as the satyr charges with lowered horns!',
    ],
  },
};

const CORRUPTED_DRUID: CreatureTemplate = {
  id: 'corrupted_druid',
  name: 'Corrupted Druid',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 12,
  maxDepth: 15,
  baseHp: 85,
  baseLevel: 13,
  spawnWeight: 3,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A druid wrapped in rotting vines mutters dark incantations.',
      "The corrupted druid's wooden staff pulses with sickly green light.",
      "Twisted thorns grow from the druid's flesh where skin should be.",
    ],
    alert: [
      'The corrupted druid calls upon dark nature magic, summoning grasping roots!',
      'Poisonous spores erupt as the druid channels corrupted natural energy!',
    ],
  },
};

const SATYR_SHAMAN: CreatureTemplate = {
  id: 'satyr_shaman',
  name: 'Satyr Shaman',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['forest'],
  minDepth: 13,
  maxDepth: 16,
  baseHp: 300,
  baseLevel: 14,
  spawnWeight: 0, // Boss
  damageType: 'shadow',
  descriptions: {
    idle: [
      'The Satyr Shaman stands before a defiled altar, channeling dark rituals.',
      'Ancient symbols of corruption glow around the powerful satyr shaman.',
    ],
    alert: [
      "The Shaman's eyes blaze with shadow as it unleashes devastating dark magic!",
      '"The old ways serve the darkness now!" the Shaman bellows, attacking with corrupted power!',
    ],
  },
};

// ============ Spider Hollow (L13-16) ============

const WOODS_GIANT_SPIDER: CreatureTemplate = {
  id: 'woods_giant_spider',
  name: 'Giant Spider',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 13,
  maxDepth: 17,
  baseHp: 100,
  baseLevel: 13,
  spawnWeight: 5,
  damageType: 'nature',
  descriptions: {
    idle: [
      'Thick webs stretch between the ancient trees, a massive spider lurking within.',
      'A giant spider the size of a horse waits motionlessly in its web.',
      'Multiple eyes gleam from the shadows as a giant spider watches you.',
    ],
    alert: [
      'The spider drops from its web, fangs dripping with venom!',
      'Chitin scrapes against bark as the giant spider scuttles toward you!',
    ],
  },
};

const ETTERCAP: CreatureTemplate = {
  id: 'ettercap',
  name: 'Ettercap',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 13,
  maxDepth: 17,
  baseHp: 120,
  baseLevel: 14,
  spawnWeight: 4,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A spider-like humanoid tends to a web filled with cocooned victims.',
      'The ettercap clicks its mandibles as it weaves more silk traps.',
      'A grotesque fusion of spider and humanoid lurks among the webs.',
    ],
    alert: [
      'The ettercap hisses and flings strands of sticky webbing at you!',
      'Venomous claws slash the air as the ettercap attacks!',
    ],
  },
};

const BROODMOTHER_SPIDER: CreatureTemplate = {
  id: 'broodmother_spider',
  name: 'Broodmother Spider',
  behavior: 'territorial',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 14,
  maxDepth: 17,
  baseHp: 140,
  baseLevel: 15,
  spawnWeight: 3,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A bloated spider guards countless egg sacs with maternal fury.',
      "The broodmother spider's abdomen pulses as tiny spiderlings crawl across her.",
      'Hundreds of baby spiders scatter as the broodmother shifts in her nest.',
    ],
    alert: [
      'The broodmother rears up with a screech, defending her brood!',
      'A swarm of spiderlings pours forth as their mother attacks!',
    ],
  },
};

const SPIDER_QUEEN: CreatureTemplate = {
  id: 'spider_queen',
  name: 'Spider Queen',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['forest'],
  minDepth: 15,
  maxDepth: 18,
  baseHp: 380,
  baseLevel: 16,
  spawnWeight: 0, // Boss
  damageType: 'nature',
  descriptions: {
    idle: [
      'The Spider Queen sits upon a throne of silk and bones at the heart of her domain.',
      'A colossal spider adorned with crown-like markings dominates the hollow.',
    ],
    alert: [
      'The Spider Queen shrieks, summoning her children and striking with devastating force!',
      'Poison mist fills the air as the Queen descends upon you with terrible fury!',
    ],
  },
};

// ============ Thornwood Maze (L16-18) ============

const THORN_CRAWLER: CreatureTemplate = {
  id: 'thorn_crawler',
  name: 'Thorn Crawler',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 15,
  maxDepth: 19,
  baseHp: 130,
  baseLevel: 16,
  spawnWeight: 4,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A mass of thorny vines moves with predatory purpose.',
      "The thorn crawler's body bristles with razor-sharp barbs.",
      'Wicked thorns click and scrape as the creature shifts position.',
    ],
    alert: [
      'The thorn crawler lashes out with whip-like, barbed tendrils!',
      'Thorns fly through the air as the creature launches its attack!',
    ],
  },
};

const BRAMBLE_BEAST: CreatureTemplate = {
  id: 'bramble_beast',
  name: 'Bramble Beast',
  behavior: 'territorial',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 16,
  maxDepth: 19,
  baseHp: 160,
  baseLevel: 17,
  spawnWeight: 3,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A creature of interwoven thorns and branches lurks in the maze.',
      'The bramble beast is nearly invisible among the thorny walls.',
      'Malevolent eyes peer from a living mass of briar and bramble.',
    ],
    alert: [
      'The bramble beast erupts from the thorns, slashing with barbed limbs!',
      'The maze itself seems to attack as the bramble beast strikes!',
    ],
  },
};

const TWISTED_TREANT: CreatureTemplate = {
  id: 'twisted_treant',
  name: 'Twisted Treant',
  behavior: 'territorial',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 16,
  maxDepth: 19,
  baseHp: 180,
  baseLevel: 17,
  spawnWeight: 2,
  damageType: 'nature',
  descriptions: {
    idle: [
      'What appeared to be a dead tree shifts with malevolent awareness.',
      'A treant twisted by dark magic guards this section of the maze.',
      'Corrupted sap oozes from the gnarled bark of a twisted treant.',
    ],
    alert: [
      'The twisted treant groans with fury and swings massive branch-arms!',
      'Roots erupt from the ground as the corrupted treant attacks!',
    ],
  },
};

const THORNLORD: CreatureTemplate = {
  id: 'thornlord',
  name: 'Thornlord',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['forest'],
  minDepth: 17,
  maxDepth: 20,
  baseHp: 320,
  baseLevel: 18,
  spawnWeight: 0, // Boss
  damageType: 'nature',
  descriptions: {
    idle: [
      'The Thornlord, a massive entity of living briar, dominates the heart of the maze.',
      'Ancient and terrible, the Thornlord has grown from centuries of accumulated malice.',
    ],
    alert: [
      'The Thornlord roars, the entire maze trembling as it attacks!',
      'Countless thorns launch like arrows as the Thornlord unleashes its fury!',
    ],
  },
};

// ============ Matriarch's Sanctum (L18-20) ============

const CORRUPTED_DRYAD: CreatureTemplate = {
  id: 'corrupted_dryad',
  name: 'Corrupted Dryad',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'common',
  biomes: ['forest'],
  minDepth: 17,
  maxDepth: 20,
  baseHp: 170,
  baseLevel: 18,
  spawnWeight: 3,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A dryad twisted by dark magic regards you with hollow, bark-covered eyes.',
      "The corrupted dryad's beauty has turned to horror, thorns growing from her skin.",
      'What was once a guardian of nature now serves only corruption and decay.',
    ],
    alert: [
      'The corrupted dryad shrieks and unleashes a torrent of dark natural magic!',
      'Thorns and vines erupt around the dryad as she attacks with feral rage!',
    ],
  },
};

const MATRIARCHS_HANDMAIDEN: CreatureTemplate = {
  id: 'matriarchs_handmaiden',
  name: "Matriarch's Handmaiden",
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'dangerous',
  biomes: ['forest'],
  minDepth: 18,
  maxDepth: 20,
  baseHp: 220,
  baseLevel: 19,
  spawnWeight: 2,
  damageType: 'nature',
  descriptions: {
    idle: [
      'A handmaiden of the Matriarch stands guard, her form a fusion of beauty and horror.',
      'The handmaiden\'s eyes burn with devotion to her dark mistress.',
      'Corrupted vines writhe around the handmaiden like a living gown.',
    ],
    alert: [
      'The handmaiden attacks with supernatural speed and corrupted nature magic!',
      '"You shall not reach the Matriarch!" she screams, unleashing devastating power!',
    ],
  },
};

const CORRUPTED_DRYAD_MATRIARCH: CreatureTemplate = {
  id: 'corrupted_dryad_matriarch',
  name: 'Corrupted Dryad Matriarch',
  behavior: 'aggressive',
  mobility: 'static',
  tier: 'apex',
  biomes: ['forest'],
  minDepth: 19,
  maxDepth: 20,
  baseHp: 470,
  baseLevel: 20,
  spawnWeight: 0, // Final Boss
  damageType: 'nature',
  descriptions: {
    idle: [
      'The Corrupted Dryad Matriarch sits upon a throne of twisted roots at the heart of her sanctum.',
      "Once the most beautiful of forest spirits, the Matriarch now embodies nature's darkest aspect.",
    ],
    alert: [
      'The Matriarch rises in terrible majesty, the entire forest bending to her corrupted will!',
      '"YOU DARE ENTER MY SANCTUM?!" the Matriarch thunders, reality warping around her!',
    ],
  },
};

// ============ Export All Templates ============

export const WOODS_CREATURE_TEMPLATES: Record<string, CreatureTemplate> = {
  // Pixie Dell (L7-10)
  mischievous_sprite: MISCHIEVOUS_SPRITE,
  quickling: QUICKLING,
  hostile_pixie: HOSTILE_PIXIE,
  sprite_trickster: SPRITE_TRICKSTER,
  // Murky Fen (L9-12)
  shadow_hound: SHADOW_HOUND,
  redcap: REDCAP,
  bog_lurker: BOG_LURKER,
  redcap_chieftain: REDCAP_CHIEFTAIN,
  // Standing Stones (L11-14)
  will_o_wisp: WILL_O_WISP,
  dark_satyr: DARK_SATYR,
  corrupted_druid: CORRUPTED_DRUID,
  satyr_shaman: SATYR_SHAMAN,
  // Spider Hollow (L13-16)
  woods_giant_spider: WOODS_GIANT_SPIDER,
  ettercap: ETTERCAP,
  broodmother_spider: BROODMOTHER_SPIDER,
  spider_queen: SPIDER_QUEEN,
  // Thornwood Maze (L16-18)
  thorn_crawler: THORN_CRAWLER,
  bramble_beast: BRAMBLE_BEAST,
  twisted_treant: TWISTED_TREANT,
  thornlord: THORNLORD,
  // Matriarch's Sanctum (L18-20)
  corrupted_dryad: CORRUPTED_DRYAD,
  matriarchs_handmaiden: MATRIARCHS_HANDMAIDEN,
  corrupted_dryad_matriarch: CORRUPTED_DRYAD_MATRIARCH,
};

/** Boss creature IDs for special handling */
export const WOODS_BOSSES: string[] = [
  'sprite_trickster',
  'redcap_chieftain',
  'satyr_shaman',
  'spider_queen',
  'thornlord',
  'corrupted_dryad_matriarch',
];

// ============ Boss Anchors (hand-placed at world assembly) ============

import type { BossAnchor } from '../western-reaches';
import {
  WOODS_PIXIE_COURT,
  WOODS_FEN_MOUND,
  WOODS_STONES_ALTAR,
  WOODS_SPIDER_LAIR,
  WOODS_THORN_DEN,
  WOODS_SANCTUM_HEART,
} from './locations';

/** Woods bosses placed in their lairs at world assembly */
export const WOODS_BOSS_ANCHORS: readonly BossAnchor[] = [
  { templateId: 'sprite_trickster', level: 10, locationId: WOODS_PIXIE_COURT },
  { templateId: 'redcap_chieftain', level: 12, locationId: WOODS_FEN_MOUND },
  { templateId: 'satyr_shaman', level: 14, locationId: WOODS_STONES_ALTAR },
  { templateId: 'spider_queen', level: 16, locationId: WOODS_SPIDER_LAIR },
  { templateId: 'thornlord', level: 18, locationId: WOODS_THORN_DEN },
  { templateId: 'corrupted_dryad_matriarch', level: 20, locationId: WOODS_SANCTUM_HEART },
  // The Matriarch does not stand alone
  { templateId: 'matriarchs_handmaiden', level: 19, locationId: WOODS_SANCTUM_HEART },
  { templateId: 'matriarchs_handmaiden', level: 19, locationId: WOODS_SANCTUM_HEART },
];
