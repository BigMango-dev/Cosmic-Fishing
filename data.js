/* ============================================================================
   GAME DATA — 10 BIOMES, 18 RODS, 12 BOATS, BAITS, UPGRADES, PETS & PRESTIGE
   ============================================================================ */
const LOCAL_SAVE_KEY = 'vf_cosmic_horizons_v3';

const BIOMES = [
  {
    id: 'river', name: 'Quiet River', icon: '🏞️', baseReq: 1, reqPrestige: 0,
    goldMult: 1, xpBase: 18, cdPenalty: 0,
    crate: 'wooden', gradient: 'linear-gradient(135deg, #0284c7, #0f172a)',
    desc: 'Calm freshwater currents. Ideal for mastering your cast rhythm and early Wooden Crates.',
    fish: [
      { id: 'f_raw', name: 'Raw Fish', rarity: 'Common', val: 12, weight: 45 },
      { id: 'f_salmon', name: 'Raw Salmon', rarity: 'Common', val: 20, weight: 30 },
      { id: 'f_cod', name: 'River Cod', rarity: 'Uncommon', val: 38, weight: 15 },
      { id: 'f_trop', name: 'Tropical Fish', rarity: 'Rare', val: 85, weight: 7 },
      { id: 'f_puff', name: 'Pufferfish', rarity: 'Epic', val: 210, weight: 2.5 },
      { id: 'f_rlev', name: 'River Leviathan', rarity: 'Mythic', val: 750, weight: 0.5 }
    ]
  },
  {
    id: 'reef', name: 'Coral Reef', icon: '🪸', baseReq: 20, reqPrestige: 0,
    goldMult: 3.5, xpBase: 40, cdPenalty: 0.04,
    crate: 'coral', gradient: 'linear-gradient(135deg, #0d9488, #164e63)',
    desc: 'Sunlit turquoise reefs shimmering with clownfish, rays, and pearl-encrusted chests.',
    fish: [
      { id: 'f_clown', name: 'Clownfish', rarity: 'Common', val: 14, weight: 44 },
      { id: 'f_tang', name: 'Regal Tang', rarity: 'Common', val: 23, weight: 30 },
      { id: 'f_moray', name: 'Coral Moray', rarity: 'Uncommon', val: 45, weight: 15.5 },
      { id: 'f_manta', name: 'Reef Manta', rarity: 'Rare', val: 100, weight: 7.2 },
      { id: 'f_naut', name: 'Pearl Nautilus', rarity: 'Epic', val: 250, weight: 2.7 },
      { id: 'f_rguard', name: 'Reef Guardian', rarity: 'Mythic', val: 920, weight: 0.6 }
    ]
  },
  {
    id: 'volcanic', name: 'Volcanic Caldera', icon: '🌋', baseReq: 50, reqPrestige: 0,
    goldMult: 14, xpBase: 85, cdPenalty: 0.08,
    crate: 'magma', gradient: 'linear-gradient(135deg, #dc2626, #1c1917)',
    desc: 'Boiling magma vents rich in gold-scaled fish and rare Lava Fish exotics.',
    fish: [
      { id: 'f_hcod', name: 'Hot Cod', rarity: 'Common', val: 16, weight: 44 },
      { id: 'f_fpuff', name: 'Fiery Pufferfish', rarity: 'Common', val: 26, weight: 30 },
      { id: 'f_meel', name: 'Magma Eel', rarity: 'Uncommon', val: 52, weight: 15 },
      { id: 'f_osnap', name: 'Obsidian Snapper', rarity: 'Rare', val: 120, weight: 7.5 },
      { id: 'f_cind', name: 'Cinder Ray', rarity: 'Epic', val: 300, weight: 2.8 },
      { id: 'f_ignis', name: 'Ignis Wyrm', rarity: 'Mythic', val: 1150, weight: 0.7 }
    ]
  },
  {
    id: 'ocean', name: 'Deep Ocean', icon: '🌊', baseReq: 100, reqPrestige: 0,
    goldMult: 60, xpBase: 175, cdPenalty: 0.12,
    crate: 'sunken', gradient: 'linear-gradient(135deg, #1d4ed8, #090d16)',
    desc: 'Pelagic trenches teeming with sharks, orcas, and Diamond Fish. Gateway to Prestige 1!',
    fish: [
      { id: 'f_squid', name: 'Deep Squid', rarity: 'Common', val: 18, weight: 43 },
      { id: 'f_turtle', name: 'Sea Turtle', rarity: 'Common', val: 30, weight: 30 },
      { id: 'f_dolphin', name: 'Bottlenose Dolphin', rarity: 'Uncommon', val: 62, weight: 16 },
      { id: 'f_shark', name: 'Great White Shark', rarity: 'Rare', val: 145, weight: 7.5 },
      { id: 'f_orca', name: 'Abyssal Orca', rarity: 'Epic', val: 360, weight: 2.8 },
      { id: 'f_kraken', name: 'Tidal Kraken', rarity: 'Mythic', val: 1400, weight: 0.7 }
    ]
  },
  {
    id: 'sky', name: 'Sky Islands', icon: '☁️', baseReq: 180, reqPrestige: 1,
    goldMult: 280, xpBase: 360, cdPenalty: 0.16,
    crate: 'cloud', gradient: 'linear-gradient(135deg, #0ea5e9, #312e81)',
    desc: 'Floating cloud seas above the stratosphere. Requires Prestige 1 to ascend here.',
    fish: [
      { id: 'f_guard', name: 'Sky Guardian', rarity: 'Common', val: 20, weight: 43 },
      { id: 'f_esquid', name: 'Emerald Squid', rarity: 'Common', val: 34, weight: 30 },
      { id: 'f_rain', name: 'Rainbow Fish', rarity: 'Uncommon', val: 70, weight: 16 },
      { id: 'f_cray', name: 'Cloud Manta', rarity: 'Rare', val: 165, weight: 7.5 },
      { id: 'f_seraph', name: 'Seraph Koi', rarity: 'Epic', val: 420, weight: 2.8 },
      { id: 'f_tdrag', name: 'Tempest Dragon', rarity: 'Mythic', val: 1650, weight: 0.7 }
    ]
  },
  {
    id: 'space', name: 'Outer Space', icon: '🪐', baseReq: 300, reqPrestige: 2,
    goldMult: 1400, xpBase: 720, cdPenalty: 0.20,
    crate: 'star', gradient: 'linear-gradient(135deg, #4f46e5, #09090b)',
    desc: 'Zero-gravity starlight currents filled with cosmic crabs and pulsar marlins.',
    fish: [
      { id: 'f_space', name: 'Space Fish', rarity: 'Common', val: 22, weight: 43 },
      { id: 'f_gcrab', name: 'Galactic Crab', rarity: 'Common', val: 38, weight: 30 },
      { id: 'f_njel', name: 'Nebula Jellyfish', rarity: 'Uncommon', val: 78, weight: 16 },
      { id: 'f_swhale', name: 'Starlight Whale', rarity: 'Rare', val: 190, weight: 7.5 },
      { id: 'f_pulsar', name: 'Pulsar Marlin', rarity: 'Epic', val: 490, weight: 2.8 },
      { id: 'f_vserp', name: 'Void Serpent', rarity: 'Mythic', val: 1950, weight: 0.7 }
    ]
  },
  {
    id: 'alien', name: 'Alien Exoplanet', icon: '🛸', baseReq: 500, reqPrestige: 4,
    goldMult: 7500, xpBase: 1450, cdPenalty: 0.24,
    crate: 'xenotech', gradient: 'linear-gradient(135deg, #059669, #1e1b4b)',
    desc: 'Bioluminescent extraterrestrial oceans humming with quantum energy.',
    fish: [
      { id: 'f_alien', name: 'Alien Fish', rarity: 'Common', val: 25, weight: 43 },
      { id: 'f_psting', name: 'Plasma Stingray', rarity: 'Common', val: 42, weight: 30 },
      { id: 'f_cshark', name: 'Cyber Shark', rarity: 'Uncommon', val: 88, weight: 16 },
      { id: 'f_qkoi', name: 'Quantum Koi', rarity: 'Rare', val: 215, weight: 7.5 },
      { id: 'f_xeno', name: 'Xenomorph Eel', rarity: 'Epic', val: 550, weight: 2.8 },
      { id: 'f_eld', name: 'Eldritch Nautilus', rarity: 'Mythic', val: 2250, weight: 0.7 }
    ]
  },
  {
    id: 'abyss', name: 'The Abyss', icon: '🕳️', baseReq: 850, reqPrestige: 6,
    goldMult: 42000, xpBase: 2900, cdPenalty: 0.28,
    crate: 'abyssal', gradient: 'linear-gradient(135deg, #7e22ce, #09090b)',
    desc: 'The crushing bottom of reality. Home to Dark Tuna and Primordial Titans.',
    fish: [
      { id: 'f_art', name: 'Artifact Fish', rarity: 'Common', val: 28, weight: 43 },
      { id: 'f_dpuff', name: 'Dark Puffer', rarity: 'Common', val: 48, weight: 30 },
      { id: 'f_dtuna', name: 'Dark Tuna', rarity: 'Uncommon', val: 100, weight: 16 },
      { id: 'f_tcol', name: 'Trench Colossus', rarity: 'Rare', val: 250, weight: 7.5 },
      { id: 'f_shad', name: 'Shadow Leviathan', rarity: 'Epic', val: 640, weight: 2.8 },
      { id: 'f_prim', name: 'Primordial Titan', rarity: 'Mythic', val: 2600, weight: 0.7 }
    ]
  },
  {
    id: 'nebula', name: 'Cosmic Nebula', icon: '🌌', baseReq: 1500, reqPrestige: 9,
    goldMult: 250000, xpBase: 5800, cdPenalty: 0.32,
    crate: 'nebula', gradient: 'linear-gradient(135deg, #db2777, #312e81)',
    desc: 'Ionized stardust oceans where antimatter leviathans swim through supernovas.',
    fish: [
      { id: 'f_stardust', name: 'Stardust Minnow', rarity: 'Common', val: 32, weight: 43 },
      { id: 'f_quasar', name: 'Quasar Trout', rarity: 'Common', val: 56, weight: 30 },
      { id: 'f_antimat', name: 'Antimatter Eel', rarity: 'Uncommon', val: 118, weight: 16 },
      { id: 'f_nova', name: 'Supernova Ray', rarity: 'Rare', val: 290, weight: 7.5 },
      { id: 'f_astral', name: 'Astral Whale', rarity: 'Epic', val: 760, weight: 2.8 },
      { id: 'f_celest', name: 'Celestial Phoenix Fish', rarity: 'Mythic', val: 3200, weight: 0.7 }
    ]
  },
  {
    id: 'multiverse', name: 'Multiverse Rift', icon: '🌀', baseReq: 3000, reqPrestige: 14,
    goldMult: 1800000, xpBase: 12000, cdPenalty: 0.36,
    crate: 'multiverse', gradient: 'linear-gradient(135deg, #9333ea, #0284c7, #09090b)',
    desc: 'Beyond space and time. Only veteran ascended anglers cast into the Multiverse Rift.',
    fish: [
      { id: 'f_chrono', name: 'Chrono Sardine', rarity: 'Common', val: 38, weight: 43 },
      { id: 'f_paradox', name: 'Paradox Salmon', rarity: 'Common', val: 66, weight: 30 },
      { id: 'f_rift', name: 'Riftwalker Shark', rarity: 'Uncommon', val: 140, weight: 16 },
      { id: 'f_infinity', name: 'Infinity Manta', rarity: 'Rare', val: 360, weight: 7.5 },
      { id: 'f_omega', name: 'Omega Kraken', rarity: 'Epic', val: 950, weight: 2.8 },
      { id: 'f_eternal', name: 'Eternal World-Eater', rarity: 'Mythic', val: 4500, weight: 0.7 }
    ]
  }
];

const RODS = [
  { id: 'r_plastic', name: 'Plastic Rod', cost: 0, mult: 1.0, rareBonus: 0, reqLv: 1, reqP: 0 },
  { id: 'r_improved', name: 'Improved Rod', cost: 500, mult: 1.4, rareBonus: 0.04, reqLv: 1, reqP: 0 },
  { id: 'r_steel', name: 'Steel Rod', cost: 4500, mult: 2.1, rareBonus: 0.08, reqLv: 8, reqP: 0 },
  { id: 'r_fiber', name: 'Fiberglass Rod', cost: 28000, mult: 3.2, rareBonus: 0.12, reqLv: 15, reqP: 0 },
  { id: 'r_coral', name: 'Coral Reef Rod', cost: 110000, mult: 4.8, rareBonus: 0.16, reqLv: 22, reqP: 0 },
  { id: 'r_heavy', name: 'Heavy Alloy Rod', cost: 480000, mult: 7.2, rareBonus: 0.21, reqLv: 35, reqP: 0 },
  { id: 'r_lava', name: 'Lava Rod', cost: 2500000, mult: 11.0, rareBonus: 0.26, reqLv: 50, reqP: 0 },
  { id: 'r_magma', name: 'Magma Core Rod', cost: 16000000, mult: 17.5, rareBonus: 0.32, reqLv: 75, reqP: 0 },
  { id: 'r_ocean', name: 'Oceanium Rod', cost: 110000000, mult: 28.0, rareBonus: 0.40, reqLv: 100, reqP: 0 },
  { id: 'r_golden', name: 'Golden Trident Rod', cost: 850000000, mult: 46.0, rareBonus: 0.48, reqLv: 140, reqP: 1 },
  { id: 'r_sky', name: 'Sky Tempest Rod', cost: 7500000000, mult: 78.0, rareBonus: 0.58, reqLv: 180, reqP: 1 },
  { id: 'r_meteor', name: 'Meteor Rod', cost: 8.5e10, mult: 135.0, rareBonus: 0.70, reqLv: 240, reqP: 2 },
  { id: 'r_space', name: 'Starlight Space Rod', cost: 1.2e12, mult: 240.0, rareBonus: 0.85, reqLv: 300, reqP: 2 },
  { id: 'r_alien', name: 'Xenotech Plasma Rod', cost: 2.5e13, mult: 440.0, rareBonus: 1.00, reqLv: 500, reqP: 4 },
  { id: 'r_abyss', name: 'Abyssal Dark Rod', cost: 6.5e14, mult: 820.0, rareBonus: 1.20, reqLv: 850, reqP: 6 },
  { id: 'r_nebula', name: 'Cosmic Nebula Rod', cost: 2.2e16, mult: 1600.0, rareBonus: 1.45, reqLv: 1500, reqP: 9 },
  { id: 'r_quantum', name: 'Quantum Singularity Rod', cost: 8.5e17, mult: 3200.0, rareBonus: 1.75, reqLv: 2200, reqP: 12 },
  { id: 'r_multiverse', name: 'Multiverse Chronos Rod', cost: 4.0e19, mult: 7000.0, rareBonus: 2.10, reqLv: 3000, reqP: 14 }
];

const BOATS = [
  { id: 'b_none', name: 'Shoreline Pier', cost: 0, fishMult: 1.0, cdCut: 0, workerMult: 1.0, reqLv: 1, reqP: 0 },
  { id: 'b_row', name: 'Rowboat', cost: 3000, fishMult: 1.18, cdCut: 0.04, workerMult: 1.2, reqLv: 6, reqP: 0 },
  { id: 'b_fish', name: 'Fishing Trawler', cost: 25000, fishMult: 1.4, cdCut: 0.08, workerMult: 1.5, reqLv: 18, reqP: 0 },
  { id: 'b_speed', name: 'Speedboat', cost: 180000, fishMult: 1.7, cdCut: 0.12, workerMult: 1.9, reqLv: 35, reqP: 0 },
  { id: 'b_sail', name: 'Volcanic Cutter', cost: 2200000, fishMult: 2.1, cdCut: 0.16, workerMult: 2.5, reqLv: 55, reqP: 0 },
  { id: 'b_yacht', name: 'Luxury Yacht', cost: 35000000, fishMult: 2.7, cdCut: 0.20, workerMult: 3.3, reqLv: 100, reqP: 0 },
  { id: 'b_sub', name: 'Abyssal Submarine', cost: 450000000, fishMult: 3.5, cdCut: 0.24, workerMult: 4.4, reqLv: 150, reqP: 1 },
  { id: 'b_sky', name: 'Sky Airship', cost: 8.0e9, fishMult: 4.8, cdCut: 0.28, workerMult: 6.0, reqLv: 200, reqP: 1 },
  { id: 'b_shuttle', name: 'Space Shuttle', cost: 2.5e11, fishMult: 6.8, cdCut: 0.34, workerMult: 8.5, reqLv: 320, reqP: 2 },
  { id: 'b_saucer', name: 'Xenotech Mothership', cost: 1.2e13, fishMult: 10.0, cdCut: 0.40, workerMult: 12.0, reqLv: 550, reqP: 4 },
  { id: 'b_dark', name: 'Nebula Cruiser', cost: 4.5e15, fishMult: 15.5, cdCut: 0.46, workerMult: 18.0, reqLv: 1500, reqP: 9 },
  { id: 'b_dread', name: 'Multiverse Dreadnought', cost: 9.0e18, fishMult: 25.0, cdCut: 0.52, workerMult: 28.0, reqLv: 3000, reqP: 14 }
];

const BAITS = [
  { id: 'worms', name: 'Worms', cost: 20, reqLv: 1, fishMult: 1.4, xpMult: 1.05, chestMult: 1.0, desc: '1.4x fish & +5% XP per cast.' },
  { id: 'leeches', name: 'Leeches', cost: 90, reqLv: 12, fishMult: 1.8, xpMult: 1.15, chestMult: 1.0, desc: '1.8x fish & +15% XP per cast.' },
  { id: 'magnet', name: 'Magnet Bait', cost: 260, reqLv: 22, fishMult: 1.3, xpMult: 1.1, chestMult: 2.2, desc: '2.2x Treasure Crate find chance!' },
  { id: 'wise', name: 'Wise Bait', cost: 650, reqLv: 35, fishMult: 1.4, xpMult: 1.75, chestMult: 1.15, desc: '1.75x XP gained per cast.' },
  { id: 'fishbait', name: 'Super Fish Bait', cost: 2400, reqLv: 55, fishMult: 2.6, xpMult: 1.25, chestMult: 1.25, desc: '2.6x fish caught per cast.' },
  { id: 'magic', name: 'Magic Bait', cost: 16000, reqLv: 100, fishMult: 3.4, xpMult: 2.0, chestMult: 1.7, desc: '3.4x fish, 2.0x XP & 1.7x Crates.' },
  { id: 'support', name: 'Cosmic Lure', cost: 150000, reqLv: 250, fishMult: 4.8, xpMult: 2.5, chestMult: 2.3, desc: 'High-tier cosmic multiplier.' },
  { id: 'celestial', name: 'Multiverse Bait', cost: 2500000, reqLv: 800, fishMult: 7.5, xpMult: 3.2, chestMult: 3.0, desc: 'Endgame reality-bending lure.' }
];

const GOLD_UPGRADES = [
  { id: 'cooldown', name: 'Quick Reel (Cooldown)', icon: '⚡', baseCost: 150, costScale: 1.55, maxLv: 20, desc: '-0.06s base fishing cooldown per level (1.60s → 0.40s).' },
  { id: 'salesman', name: 'Salesman', icon: '💰', baseCost: 200, costScale: 1.38, maxLv: 150, desc: '+6% fish sell value per level.' },
  { id: 'betterFish', name: 'Net Capacity', icon: '🥅', baseCost: 260, costScale: 1.42, maxLv: 100, desc: '+1 base fish per cast per level.' },
  { id: 'moreChests', name: 'Treasure Hunter', icon: '🗝️', baseCost: 400, costScale: 1.46, maxLv: 60, desc: '+0.40% Treasure Crate drop rate per level.' },
  { id: 'experienced', name: 'Experienced Angler', icon: '📘', baseCost: 350, costScale: 1.44, maxLv: 100, desc: '+6% XP gained per level.' },
  { id: 'baitEff', name: 'Bait Efficiency', icon: '🪱', baseCost: 600, costScale: 1.58, maxLv: 25, desc: '+2% chance not to consume bait (max 50%).' },
  { id: 'workers', name: 'Auto-Fish Crew', icon: '🤖', baseCost: 500, costScale: 1.45, maxLv: 100, desc: 'Hires crew members who catch fish every 3 seconds.' },
  { id: 'duplicator', name: 'Twin-Hook Rig', icon: '🪝', baseCost: 1800, costScale: 1.66, maxLv: 40, desc: '+2.0% chance to double an entire catch!' }
];

const EMERALD_UPGRADES = [
  { id: 'emScholar', name: 'Emerald Scholar', icon: '🎓', baseCost: 6, costScale: 1.48, maxLv: 40, desc: 'Permanent +10% XP multiplier per level.' },
  { id: 'emMidas', name: 'Emerald Midas', icon: '👑', baseCost: 6, costScale: 1.48, maxLv: 40, desc: 'Permanent +12% Gold multiplier per level.' },
  { id: 'emCrate', name: 'Artifact Specialist', icon: '📦', baseCost: 10, costScale: 1.58, maxLv: 25, desc: 'Permanent +15% Gold & Emerald payouts from Crates.' },
  { id: 'emPetXp', name: 'Pet Trainer', icon: '🐾', baseCost: 12, costScale: 1.62, maxLv: 20, desc: 'Permanent +20% Pet XP gained per cast.' }
];

const CRATE_TYPES = {
  wooden: { name: 'Wooden Crate', icon: '📦', goldMult: 22, emMin: 1, emMax: 3 },
  coral: { name: 'Coral Chest', icon: '🪸', goldMult: 65, emMin: 2, emMax: 4 },
  magma: { name: 'Magma Crate', icon: '🔥', goldMult: 220, emMin: 3, emMax: 6 },
  sunken: { name: 'Sunken Chest', icon: '⚓', goldMult: 950, emMin: 4, emMax: 9 },
  cloud: { name: 'Cloud Chest', icon: '🌤️', goldMult: 4500, emMin: 7, emMax: 14 },
  star: { name: 'Star Crate', icon: '✨', goldMult: 24000, emMin: 11, emMax: 22 },
  xenotech: { name: 'Xenotech Vault', icon: '🛸', goldMult: 140000, emMin: 18, emMax: 35 },
  abyssal: { name: 'Abyssal Reliquary', icon: '👑', goldMult: 900000, emMin: 28, emMax: 55 },
  nebula: { name: 'Nebula Casket', icon: '🌌', goldMult: 6000000, emMin: 45, emMax: 85 },
  multiverse: { name: 'Multiverse Cube', icon: '🌀', goldMult: 45000000, emMin: 75, emMax: 140 }
};

const PETS = [
  { id: 'tuna', name: 'Golden Tuna', icon: '🐟', role: 'Fish Yield', desc: '+1.5% fish quantity per pet level (up to +150%).' },
  { id: 'dolphin', name: 'Swift Dolphin', icon: '🐬', role: 'Speed & Gold', desc: '-0.002s cooldown & +1% Gold per pet level.' },
  { id: 'zebrafish', name: 'Wise Zebrafish', icon: '🐠', role: 'XP Surge', desc: '+1.2% XP gained per pet level (up to +120%).' },
  { id: 'axolotl', name: 'Lucky Axolotl', icon: '🦎', role: 'Crate Luck', desc: '+1.2% Crate chance & +1% Crate rewards per level.' },
  { id: 'puffer', name: 'Mystic Puffer', icon: '🐡', role: 'Exotic & Pet XP', desc: '+1.5% Exotic fish odds & +1% Pet XP per level.' }
];

const CHARMS = [
  { id: 'c_hook', name: 'Lucky Hook Charm', icon: '🪝', desc: '+4% Critical Double-Catch chance per rank.' },
  { id: 'c_scale', name: 'Midas Scale Charm', icon: '🪙', desc: '+10% Global Fish Sell Value per rank.' },
  { id: 'c_pearl', name: 'Scholar Pearl Charm', icon: '🔮', desc: '+8% Global XP Gain per rank.' },
  { id: 'c_magnet', name: 'Abyssal Magnet Charm', icon: '🧲', desc: '+8% Treasure Crate Find Rate per rank.' }
];

const BOOST_DEFS = [
  { id: 'b_fish', name: '2x Fish Frenzy (3m)', exoticType: 'goldfish', cost: 3, desc: 'Doubles all fish caught for 3 minutes.' },
  { id: 'b_xp', name: '2x XP Surge (3m)', exoticType: 'emeraldfish', cost: 3, desc: 'Doubles all XP earned for 3 minutes.' },
  { id: 'b_luck', name: '3x Treasure Radar (3m)', exoticType: 'lavafish', cost: 2, desc: 'Triples Treasure Crate drop rate for 3 minutes.' },
  { id: 'b_overdrive', name: 'Hyper-Cast Overdrive (3m)', exoticType: 'diamondfish', cost: 2, desc: 'Cuts fishing cooldown by 35% for 3 minutes!' }
];

const PRESTIGE_UPGRADES = [
  { id: 'p_wisdom', name: 'Ascended Wisdom', baseCost: 1, costScale: 1.75, maxLv: 25, desc: 'Multiplicative +35% XP gain per rank — essential for high biomes!' },
  { id: 'p_angler', name: 'Cosmic Harvest', baseCost: 1, costScale: 1.80, maxLv: 25, desc: 'Multiplicative +45% fish & gold yield per rank.' },
  { id: 'p_overclock', name: 'Overclocked Reel', baseCost: 2, costScale: 2.2, maxLv: 5, desc: 'Lowers hard cooldown cap by -0.05s per rank (0.40s → 0.15s).' },
  { id: 'p_headstart', name: 'Angler Headstart', baseCost: 2, costScale: 2.5, maxLv: 3, desc: 'Start every Prestige with Steel/Coral/Lava Rod, Boat & starting Gold.' },
  { id: 'p_exotic', name: 'Exotic Resonance', baseCost: 2, costScale: 2.0, maxLv: 10, desc: 'Multiplicative +35% Exotic Fish & Pet find odds per rank.' }
];

const RARITY_STYLES = {
  Common: 'text-slate-300 border-slate-600/50 bg-slate-800/60',
  Uncommon: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  Rare: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
  Epic: 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-500/10',
  Mythic: 'text-amber-300 border-amber-500/50 bg-amber-500/15'
};
