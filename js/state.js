/* ============================================================================
   STATE MANAGEMENT, SAVE/LOAD (WITH NaN SANITIZER) & PROGRESSION FORMULAS
   ============================================================================ */
function defaultState() {
  return {
    displayName: 'Cosmic Angler',
    gold: 0,
    emeralds: 0,
    ptokens: 0,
    prestige: 0,
    level: 1,
    xp: 0,
    totalCasts: 0,
    biome: 'river',
    rod: 'r_plastic',
    ownedRods: ['r_plastic'],
    boat: 'b_none',
    ownedBoats: ['b_none'],
    activeBait: null,
    baits: { worms: 15 },
    goldUpgrades: { cooldown: 0, salesman: 0, betterFish: 0, moreChests: 0, experienced: 0, baitEff: 0, workers: 0, duplicator: 0 },
    emeraldUpgrades: { emScholar: 0, emMidas: 0, emCrate: 0, emPetXp: 0 },
    prestigeUpgrades: { p_wisdom: 0, p_angler: 0, p_overclock: 0, p_headstart: 0, p_exotic: 0 },
    exotics: { goldfish: 0, emeraldfish: 0, lavafish: 0, diamondfish: 0 },
    boostTimers: { b_fish: 0, b_xp: 0, b_luck: 0, b_overdrive: 0 },
    crates: { wooden: 1, coral: 0, magma: 0, sunken: 0, cloud: 0, star: 0, xenotech: 0, abyssal: 0, nebula: 0, multiverse: 0 },
    pets: {},
    activePet: null,
    charms: { c_hook: 0, c_scale: 0, c_pearl: 0, c_magnet: 0 },
    livewellCount: 0,
    livewellValue: 0,
    bestiary: {},
    autoCast: false,
    autoSell: false,
    lastDaily: 0,
    dailyStreak: 0,
    lastActiveAt: Date.now(),
    quests: []
  };
}

let state = defaultState();
let activeTab = 'shop';
let shopSubTab = 'gold';
let cooldownRemaining = 0;
let lastFrameTime = performance.now();
let workerAccumulator = 0;
let hudDirty = true;
let hudFlushAccum = 0;
let lastCdReadyState = null;
let bobberTimeout = null;
let lastBuffKey = '';

function safeNum(v, fallback = 0, min = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, n);
}

function sanitizeNumberMap(obj, defaults) {
  const out = {};
  for (const k of Object.keys(defaults)) {
    out[k] = safeNum(obj && obj[k], defaults[k], 0);
  }
  return out;
}

function mergeState(parsed) {
  const def = defaultState();
  const p = parsed && typeof parsed === 'object' ? parsed : {};
  state = {
    ...def,
    ...p,
    gold: safeNum(p.gold, 0, 0),
    emeralds: safeNum(p.emeralds, 0, 0),
    ptokens: safeNum(p.ptokens, 0, 0),
    prestige: Math.floor(safeNum(p.prestige, 0, 0)),
    level: Math.floor(safeNum(p.level, 1, 1)),
    xp: safeNum(p.xp, 0, 0),
    totalCasts: Math.floor(safeNum(p.totalCasts, 0, 0)),
    livewellCount: Math.floor(safeNum(p.livewellCount, 0, 0)),
    livewellValue: safeNum(p.livewellValue, 0, 0),
    lastDaily: safeNum(p.lastDaily, 0, 0),
    dailyStreak: Math.floor(safeNum(p.dailyStreak, 0, 0)),
    lastActiveAt: safeNum(p.lastActiveAt, Date.now(), 0),
    baits: sanitizeNumberMap(p.baits, { worms: 15, leeches: 0, magnet: 0, wise: 0, fishbait: 0, magic: 0, support: 0, celestial: 0 }),
    goldUpgrades: sanitizeNumberMap(p.goldUpgrades, def.goldUpgrades),
    emeraldUpgrades: sanitizeNumberMap(p.emeraldUpgrades, def.emeraldUpgrades),
    prestigeUpgrades: sanitizeNumberMap(p.prestigeUpgrades, def.prestigeUpgrades),
    exotics: sanitizeNumberMap(p.exotics, def.exotics),
    boostTimers: sanitizeNumberMap(p.boostTimers, def.boostTimers),
    crates: sanitizeNumberMap(p.crates, def.crates),
    charms: sanitizeNumberMap(p.charms, def.charms)
  };

  // Sanitize pets
  const cleanPets = {};
  if (p.pets && typeof p.pets === 'object') {
    for (const [pid, pval] of Object.entries(p.pets)) {
      if (pval && typeof pval === 'object') {
        cleanPets[pid] = {
          lv: Math.min(100, Math.floor(safeNum(pval.lv, 1, 1))),
          xp: safeNum(pval.xp, 0, 0)
        };
      }
    }
  }
  state.pets = cleanPets;

  // Sanitize quests so missing emReward/target can never cause NaN
  const validQuests = Array.isArray(p.quests)
    ? p.quests.filter(q => q && typeof q.type === 'string' && typeof q.text === 'string').map(q => ({
        id: q.id || ('q_' + Math.random().toString(36).slice(2, 8)),
        type: q.type,
        text: q.text,
        progress: safeNum(q.progress, 0, 0),
        target: Math.max(1, Math.floor(safeNum(q.target, 10, 1))),
        emReward: Math.max(1, Math.floor(safeNum(q.emReward, 2, 1)))
      }))
    : [];
  state.quests = validQuests;
  if (state.quests.length < 3 && typeof generateQuests === 'function') generateQuests();
}

function saveGame(notify = false) {
  try {
    localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(state));
    if (notify) showToast('💾 Progress saved locally!', 'emerald');
  } catch (_) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem(LOCAL_SAVE_KEY);
    if (raw) mergeState(JSON.parse(raw));
  } catch (_) {}
  if (!state.quests || state.quests.length < 3) generateQuests();
}

function fmt(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0';
  if (!Number.isFinite(n)) return '∞';
  if (n < 1000) return Math.floor(n).toLocaleString();
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  let idx = -1;
  let val = n;
  while (val >= 1000 && idx < units.length - 1) {
    val /= 1000;
    idx++;
  }
  return val.toFixed(val >= 100 ? 1 : 2) + units[idx];
}

function xpRequired(lv) {
  return Math.floor(110 * Math.pow(lv, 1.85) + 40 * lv);
}

function getBiome(id = state.biome) {
  return BIOMES.find(b => b.id === id) || BIOMES[0];
}

function getBiomeReqLevel(biome) {
  if (biome.baseReq === 1) return 1;
  const discount = Math.min(0.25, state.prestige * 0.015);
  return Math.max(5, Math.floor(biome.baseReq * (1 - discount)));
}

function isBiomeUnlocked(biome) {
  return state.level >= getBiomeReqLevel(biome) && state.prestige >= biome.reqPrestige;
}

function getRod() { return RODS.find(r => r.id === state.rod) || RODS[0]; }
function getBoat() { return BOATS.find(b => b.id === state.boat) || BOATS[0]; }

function getCooldownSeconds() {
  const base = 1.60;
  const upgCut = state.goldUpgrades.cooldown * 0.06;
  const boatCut = getBoat().cdCut * 0.35;
  const petCut = (state.activePet === 'dolphin' && state.pets.dolphin) ? state.pets.dolphin.lv * 0.002 : 0;
  const biomeAdd = getBiome().cdPenalty * 0.35;
  let cd = base - upgCut - boatCut - petCut + biomeAdd;
  if (state.boostTimers.b_overdrive > 0) cd *= 0.65;
  const hardFloor = Math.max(0.15, 0.40 - state.prestigeUpgrades.p_overclock * 0.05);
  return Math.max(hardFloor, cd);
}

function getBestiaryMasteryCount() {
  let completed = 0;
  for (const b of BIOMES) {
    if (b.fish.every(f => (state.bestiary[f.id] || 0) > 0)) completed++;
  }
  return completed;
}

function getLevelMilestoneBonus() {
  return Math.floor(state.level / 10) * 0.08;
}

function getFishYieldMultiplier() {
  const rod = getRod();
  const boat = getBoat();
  const bait = state.activeBait && state.baits[state.activeBait] > 0
    ? BAITS.find(b => b.id === state.activeBait)
    : null;
  let mult = rod.mult * boat.fishMult * (bait ? bait.fishMult : 1);
  if (state.activePet === 'tuna' && state.pets.tuna) {
    mult *= (1 + state.pets.tuna.lv * 0.015);
  }
  mult *= Math.pow(1.45, state.prestigeUpgrades.p_angler);
  if (state.boostTimers.b_fish > 0) mult *= 2.0;
  return mult;
}

function getGoldMultiplier() {
  let mult = 1 + state.goldUpgrades.salesman * 0.06;
  mult *= (1 + state.emeraldUpgrades.emMidas * 0.12);
  mult *= Math.pow(1.75, state.prestige);
  mult *= (1 + getLevelMilestoneBonus());
  mult *= (1 + getBestiaryMasteryCount() * 0.20);
  mult *= (1 + state.charms.c_scale * 0.10);
  if (state.activePet === 'dolphin' && state.pets.dolphin) {
    mult *= (1 + state.pets.dolphin.lv * 0.01);
  }
  return mult;
}

function getXpMultiplier() {
  const bait = state.activeBait && state.baits[state.activeBait] > 0
    ? BAITS.find(b => b.id === state.activeBait)
    : null;
  let mult = (1 + state.goldUpgrades.experienced * 0.06) * (bait ? bait.xpMult : 1);
  mult *= (1 + state.emeraldUpgrades.emScholar * 0.10);
  mult *= Math.pow(1.55, state.prestige);
  mult *= Math.pow(1.35, state.prestigeUpgrades.p_wisdom);
  mult *= (1 + getBestiaryMasteryCount() * 0.15);
  mult *= (1 + state.charms.c_pearl * 0.08);
  if (state.activePet === 'zebrafish' && state.pets.zebrafish) {
    mult *= (1 + state.pets.zebrafish.lv * 0.012);
  }
  if (state.boostTimers.b_xp > 0) mult *= 2.0;
  return mult;
}

function getCrateChance() {
  const bait = state.activeBait && state.baits[state.activeBait] > 0
    ? BAITS.find(b => b.id === state.activeBait)
    : null;
  let chance = 0.035 + state.goldUpgrades.moreChests * 0.004;
  chance *= (bait ? bait.chestMult : 1);
  chance *= (1 + state.charms.c_magnet * 0.08);
  if (state.activePet === 'axolotl' && state.pets.axolotl) {
    chance *= (1 + state.pets.axolotl.lv * 0.012);
  }
  if (state.boostTimers.b_luck > 0) chance *= 3.0;
  return Math.min(0.60, chance);
}

function getPrestigeRequirement() {
  return Math.floor(100 + state.prestige * 60 + Math.pow(state.prestige, 1.5) * 15);
}

function getPrestigeTokensOnReset() {
  const req = getPrestigeRequirement();
  if (state.level < req) return 0;
  return Math.max(1, Math.floor(1 + (state.level - req) / 45 + state.prestige * 0.5));
}
