import type { PropDefinition } from './types';

export const MARKET_PROPS: Record<string, PropDefinition> = {
  // === INTERACTIVE PROPS ===
  market_stalls: {
    id: 'market_stalls',
    name: 'market stalls',
    tier: 'interactive',
    verbs: ['browse', 'examine', 'explore', 'visit'],
    defaultInteraction: {
      text: [
        'You wander between stalls, admiring wares from across the region.',
        'Each stall offers something different - vegetables here, cloth there, tools beyond.',
        'Vendors call out their prices, competing for your attention.',
        'You find stalls selling everything from fresh bread to secondhand swords.',
        'The variety is impressive for a town this size. Trade routes serve Easthollow well.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Wooden stalls line both sides of Market Street, selling goods of every description.',
      'The stalls are temporary but well-maintained, easily assembled for market days.',
    ],
  },

  market_lanterns: {
    id: 'market_lanterns',
    name: 'street lanterns',
    tier: 'interactive',
    verbs: ['examine', 'look', 'light'],
    defaultInteraction: {
      text: [
        'The lanterns hang from iron hooks, ready to illuminate evening shopping.',
        'Oil lanterns wait for dusk. The lamplighter will be along soon.',
        'You examine the craftsmanship - simple but functional.',
        'Some lanterns have colored glass, casting interesting shadows when lit.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Iron lanterns hung along the street, providing light for evening commerce.',
      'The lanterns are lit each evening at dusk by the town\'s lamplighter.',
    ],
  },

  market_meat_skewers: {
    id: 'market_meat_skewers',
    name: 'meat skewers',
    tier: 'interactive',
    verbs: ['smell', 'buy', 'examine', 'taste'],
    defaultInteraction: {
      text: [
        'The sizzling meat makes your mouth water. Spiced and charred just right.',
        'You watch the vendor turn skewers over hot coals, grease dripping and flaring.',
        'The smell is irresistible. Your stomach growls in response.',
        '"Best in town!" the vendor claims. Based on the crowd, he might be right.',
        'You buy a skewer. Hot, juicy, and perfectly seasoned.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A street vendor grilling meat skewers over hot coals, drawing hungry customers.',
      'The smoke carries mouthwatering aromas through the market.',
    ],
  },

  market_spice_aromas: {
    id: 'market_spice_aromas',
    name: 'spice stall',
    tier: 'interactive',
    verbs: ['smell', 'browse', 'examine'],
    defaultInteraction: {
      text: [
        'The spice merchant\'s stall is an assault on the senses. Dozens of aromas compete.',
        'You lean in to smell cinnamon, then recoil from pepper that makes your eyes water.',
        'Colors range from turmeric gold to paprika red. A palette of flavors.',
        '"Smell anything you like," the merchant offers. "Just don\'t sneeze."',
        'Some spices you recognize. Others are exotic mysteries from distant lands.',
      ],
      cooldown: 5,
    },
    examineText: [
      'A stall covered with pouches and jars of colorful, aromatic spices.',
      'The merchant has traveled far to collect this variety.',
    ],
  },

  market_flower_girl: {
    id: 'market_flower_girl',
    name: 'flower girl',
    tier: 'interactive',
    verbs: ['talk', 'buy', 'watch'],
    defaultInteraction: {
      text: [
        'A young girl sells wildflowers from a basket. "Flowers for your sweetheart, sir?"',
        'You buy a small bouquet. The girl beams and curtsies.',
        'The flower girl weaves between shoppers, offering her wares with a bright smile.',
        '"Fresh picked this morning!" she calls. Her basket overflows with color.',
        'You watch her make a sale to a blushing young man. Love blooms in the market.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A young girl selling wildflowers from a woven basket, working the crowd.',
      'Her flowers are simple but fresh, gathered from the fields outside town.',
    ],
  },

  market_sampling_tray: {
    id: 'market_sampling_tray',
    name: 'sampling tray',
    tier: 'interactive',
    verbs: ['sample', 'taste', 'try'],
    defaultInteraction: {
      text: [
        'You sample a bit of cheese. Sharp and tangy - quite good.',
        'The vendor offers tastes of her wares. You try dried fruit, nuts, and honey.',
        'Free samples are a good way to decide what to buy. You sample liberally.',
        '"Like it?" the vendor asks. "I make it myself."',
        'You try a bit of everything. The honey is exceptional.',
      ],
      cooldown: 15,
    },
    examineText: [
      'A wooden tray offering small samples of various foods for potential customers.',
      'The vendor knows that a taste is worth more than a thousand words.',
    ],
  },

  market_donkey: {
    id: 'market_donkey',
    name: 'merchant\'s donkey',
    tier: 'interactive',
    verbs: ['pet', 'feed', 'approach'],
    defaultInteraction: {
      text: [
        'The donkey brays at your approach, hoping for a treat.',
        'You pat the donkey\'s nose. It nuzzles your hand, disappointed by the lack of food.',
        'This beast has carried goods for years. Its owner treats it well.',
        'The donkey\'s ears swivel toward the sound of crinkling paper. Food wrapper detection.',
        'You scratch behind its ears. The donkey sighs contentedly.',
      ],
      cooldown: 10,
    },
    examineText: [
      'A patient donkey tied to a post, waiting while its owner sells goods.',
      'The beast is well-groomed and clearly loved, despite its working life.',
    ],
  },

  market_chickens: {
    id: 'market_chickens',
    name: 'caged chickens',
    tier: 'interactive',
    verbs: ['examine', 'watch', 'poke'],
    defaultInteraction: {
      text: [
        'The chickens cluck nervously, aware of their likely fate.',
        'You watch a customer haggle for a fat hen. The chickens seem to understand.',
        'One rooster puffs himself up, determined to look impressive.',
        'The poultry seller takes good care of his birds. They\'re healthy and plump.',
      ],
      cooldown: 5,
    },
    examineText: [
      'Cages of live chickens for sale, clucking and scratching at their confinement.',
      'Fresh poultry is a market staple. These will be someone\'s dinner.',
    ],
  },

  market_fat_cat: {
    id: 'market_fat_cat',
    name: 'fat market cat',
    tier: 'interactive',
    verbs: ['pet', 'approach', 'watch'],
    defaultInteraction: {
      text: [
        'The cat yawns, displaying impressive fangs, then returns to its nap.',
        'You reach down to pet it. The cat tolerates your attention with regal indifference.',
        'This cat has grown fat on scraps from generous vendors. It wants for nothing.',
        'The cat watches a passing mouse but doesn\'t bother to chase. Too well-fed.',
        'It purrs loudly as you scratch under its chin. Okay, you\'re approved.',
      ],
      cooldown: 10,
    },
    examineText: [
      'An enormously fat cat lounging in a patch of sunlight, the market\'s unofficial mascot.',
      'Every vendor feeds it scraps. The cat has learned that cuteness pays.',
    ],
  },

  market_dropped_coin: {
    id: 'market_dropped_coin',
    name: 'glinting coin',
    tier: 'interactive',
    verbs: ['pick', 'take', 'grab'],
    hidden: true,
    discoverVerb: 'search',
    defaultInteraction: {
      text: [
        'You snatch up the dropped coin before anyone else notices. Lucky find!',
        'A copper glints between the cobblestones. You pocket it quickly.',
        'Someone\'s loss is your gain. A single copper, but it\'s something.',
      ],
      cooldown: 60,
      rewards: {
        currency: 1,
      },
    },
    examineText: [
      'A coin dropped by some careless shopper, glinting between the cobblestones.',
      'Easy to miss unless you\'re looking for it.',
    ],
  },

  // === FLAVOR PROPS ===
  market_cobblestones: {
    id: 'market_cobblestones',
    name: 'worn cobblestones',
    tier: 'flavor',
    verbs: ['examine', 'look'],
    defaultInteraction: {
      text: [
        'The cobblestones are worn smooth by generations of shoppers.',
        'Generations of feet have polished these stones to a dull shine.',
        'The street has been here longer than most buildings in town.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Ancient cobblestones worn smooth by countless feet over the centuries.',
    ],
  },

  market_shouting: {
    id: 'market_shouting',
    name: 'vendor calls',
    tier: 'flavor',
    verbs: ['listen', 'hear'],
    defaultInteraction: {
      text: [
        '"Fresh fish! Get your fresh fish!" "Apples, apples, three for a copper!"',
        'The vendors compete in a chorus of promotion. Each voice fights to be heard.',
        'The shouting is overwhelming at first, then fades to background noise.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The constant calls of vendors hawking their wares, the music of the market.',
    ],
  },

  market_fruit_colors: {
    id: 'market_fruit_colors',
    name: 'colorful fruit displays',
    tier: 'flavor',
    verbs: ['admire', 'look'],
    defaultInteraction: {
      text: [
        'Apples red as rubies, pears gold as coins, berries dark as night.',
        'The fruit vendor has arranged everything like art. It almost seems a shame to eat.',
        'Colors burst from every stall. The market is alive with produce.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Vibrant displays of fresh fruit arranged to catch the eye and tempt the palate.',
    ],
  },

  market_haggling: {
    id: 'market_haggling',
    name: 'haggling voices',
    tier: 'flavor',
    verbs: ['listen', 'watch'],
    defaultInteraction: {
      text: [
        '"Three silver? That\'s robbery!" "Final offer, take it or leave it."',
        'You watch a skilled haggler work a vendor down by half. Impressive.',
        'The back and forth of bargaining is an art form here.',
      ],
      cooldown: 2,
    },
    examineText: [
      'The eternal dance of negotiation between buyers and sellers.',
    ],
  },

  market_chalked_prices: {
    id: 'market_chalked_prices',
    name: 'chalked prices',
    tier: 'flavor',
    verbs: ['read', 'examine'],
    defaultInteraction: {
      text: [
        'Prices are scrawled on slate boards. They change with the day\'s demand.',
        'You read the prices. Fair for the most part, with room to bargain.',
        'Some boards show prices scratched out and rewritten. Supply and demand.',
      ],
      cooldown: 2,
    },
    examineText: [
      'Slate boards displaying prices in chalk, easily erased and updated.',
    ],
  },
};
