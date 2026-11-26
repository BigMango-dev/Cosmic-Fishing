/* ============================================================================
   CORE GAME ENGINE — QUESTS, FISHING, CRATES, DAILY & PRESTIGE
   ============================================================================ */
function generateQuests() {
  const templates = [
    { type: 'cast', label: 'Cast Line {target} times', base: 30 },
    { type: 'fish', label: 'Catch {target} total fish', base: 80 },
    { type: 'rare', label: 'Catch {target} Rare+ fish', base: 6 },
    { type: 'crate', label: 'Find or Open {target} Crates', base: 2 }
  ];
  while (state.quests.length < 3) {
    const t = templates[Math.floor(Math.random() * templates.length)];
    const factor = Math.max(1, Math.pow(state.level, 0.45));
    const target = Math.max(2, Math.floor(t.base * factor));
    const emReward = Math.max(2, Math.floor(2 + Math.sqrt(state.level) * 0.75));
    state.quests.push({
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type: t.type,
      text: t.label.replace('{target}', fmt(target)),
      progress: 0,
      target,
      emReward
    });
  }
}

function advanceQuest(type, amount = 1) {
  let completedAny = false;
  for (let i = state.quests.length - 1; i >= 0; i--) {
    const q = state.quests[i];
    if (q.type === type) {
      q.progress += amount;
      if (q.progress >= q.target) {
        state.emeralds += q.emReward;
        state.exotics.goldfish += 1;
        addFeed(`✅ <span class="feed-strong">Quest Complete:</span> "${q.text}" → <span class="feed-emerald">+${q.emReward} 💎</span> &amp; +1 Goldfish!`, 'exotic');
        showToast(`✅ Quest Done! +${q.emReward} 💎`, 'emerald');
        state.quests.splice(i, 1);
        completedAny = true;
      }
    }
  }
  if (completedAny) {
    generateQuests();
    if (activeTab === 'crates') renderActiveTab();
  }
}

function rollFishFromBiome(biome) {
  const rodBonus = getRod().rareBonus;
  let totalWeight = 0;
  for (let i = 0; i < biome.fish.length; i++) {
    const f = biome.fish[i];
    totalWeight += i >= 2 ? f.weight * (1 + rodBonus * i * 0.45) : f.weight;
  }
  let r = Math.random() * totalWeight;
  for (let i = 0; i < biome.fish.length; i++) {
    const f = biome.fish[i];
    const w = i >= 2 ? f.weight * (1 + rodBonus * i * 0.45) : f.weight;
    r -= w;
    if (r <= 0) return f;
  }
  return biome.fish[0];
}

function grantXp(amount) {
  state.xp += amount;
  let leveled = false;
  while (state.xp >= xpRequired(state.level)) {
    state.xp -= xpRequired(state.level);
    state.level++;
    leveled = true;
    const bonusEmeralds = state.level % 10 === 0 ? 3 : 1;
    state.emeralds += bonusEmeralds;
    addFeed(`🎉 <span class="feed-strong">LEVEL UP!</span> Reached <span class="feed-strong">Lv. ${state.level}</span> (+${bonusEmeralds} 💎)`, 'levelup');
  }
  if (leveled && (activeTab === 'biomes' || activeTab === 'prestige' || (activeTab === 'shop' && (shopSubTab === 'rods' || shopSubTab === 'boats')))) {
    renderActiveTab();
  }
}

function performCast(isWorker = false) {
  const biome = getBiome();
  const baseFishCount = 1 + state.goldUpgrades.betterFish;
  const yieldMult = getFishYieldMultiplier() * (isWorker ? 0.30 * getBoat().workerMult : 1);
  let totalCaught = Math.max(1, Math.round(baseFishCount * yieldMult * (0.85 + Math.random() * 0.3)));

  const doubleChance = Math.min(0.80, state.goldUpgrades.duplicator * 0.02 + state.charms.c_hook * 0.04);
  let doubled = false;
  if (Math.random() < doubleChance) {
    totalCaught *= 2;
    doubled = true;
  }

  if (!isWorker && state.activeBait && state.baits[state.activeBait] > 0) {
    const saveChance = Math.min(0.50, state.goldUpgrades.baitEff * 0.02);
    if (Math.random() >= saveChance) {
      state.baits[state.activeBait]--;
      if (state.baits[state.activeBait] <= 0) {
        const bName = BAITS.find(b => b.id === state.activeBait)?.name || 'Bait';
        addFeed(`🪱 Out of <span class="feed-strong">${bName}</span>!`, 'crate');
        showToast(`🪱 Ran out of ${bName}!`, 'amber');
      }
    }
  }

  const primary = rollFishFromBiome(biome);
  const secondary = rollFishFromBiome(biome);
  const count1 = Math.ceil(totalCaught * 0.65);
  const count2 = totalCaught - count1;

  state.bestiary[primary.id] = (state.bestiary[primary.id] || 0) + count1;
  if (count2 > 0) state.bestiary[secondary.id] = (state.bestiary[secondary.id] || 0) + count2;

  const earnedValue = Math.round((primary.val * count1 + secondary.val * count2) * biome.goldMult * getGoldMultiplier());

  const rarityXpBonus = { Common: 1.0, Uncommon: 1.15, Rare: 1.35, Epic: 1.65, Mythic: 2.25 }[primary.rarity] || 1.0;
  const catchLogFactor = 1 + 0.35 * Math.log2(Math.max(1, totalCaught));
  const workerXpPenalty = isWorker ? 0.35 : 1.0;
  const earnedXp = Math.max(1, Math.round(
    biome.xpBase * catchLogFactor * rarityXpBonus * getXpMultiplier() * workerXpPenalty * (0.9 + Math.random() * 0.2)
  ));

  if (state.autoSell) {
    state.gold += earnedValue;
  } else {
    state.livewellCount += totalCaught;
    state.livewellValue += earnedValue;
  }

  grantXp(earnedXp);

  if (state.activePet && state.pets[state.activePet]) {
    const p = state.pets[state.activePet];
    if (p.lv < 100) {
      let petXpGain = Math.max(1, Math.round((4 + Math.sqrt(biome.xpBase) * 0.4) * (1 + state.emeraldUpgrades.emPetXp * 0.20)));
      if (state.activePet === 'puffer') petXpGain = Math.round(petXpGain * (1 + p.lv * 0.01));
      p.xp += petXpGain;
      const req = Math.floor(90 * Math.pow(p.lv, 1.65));
      if (p.xp >= req && p.lv < 100) {
        p.xp -= req;
        p.lv++;
        const pName = PETS.find(x => x.id === state.activePet).name;
        addFeed(`🐾 <span class="feed-strong">${pName}</span> leveled up to <span class="feed-fuchsia">Lv.${p.lv}</span>!`, 'pet');
      }
    }
  }

  if (!isWorker) {
    triggerBobberAnim();
    state.totalCasts++;
    cooldownRemaining = getCooldownSeconds();
    advanceQuest('cast', 1);
    advanceQuest('fish', totalCaught);
    if (['Rare', 'Epic', 'Mythic'].includes(primary.rarity)) advanceQuest('rare', 1);

    let msg = `${biome.icon} Caught <span class="feed-strong">${fmt(count1)}x ${primary.name}</span>`;
    if (count2 > 0) msg += ` &amp; <span class="feed-strong">${fmt(count2)}x ${secondary.name}</span>`;
    if (doubled) msg += ` <span class="feed-amber">[2x TWIN!]</span>`;
    msg += ` <span class="feed-muted">(+${fmt(earnedXp)} XP${state.autoSell ? `, +$${fmt(earnedValue)}` : ''})</span>`;
    addFeed(msg);

    if (Math.random() < getCrateChance()) {
      const cKey = biome.crate;
      state.crates[cKey] = (state.crates[cKey] || 0) + 1;
      advanceQuest('crate', 1);
      addFeed(`📦 Found a <span class="feed-amber">${CRATE_TYPES[cKey].name}</span>!`, 'crate');
      if (activeTab === 'crates') renderActiveTab();
    }

    const exoticMult = Math.pow(1.35, state.prestigeUpgrades.p_exotic) *
      (state.activePet === 'puffer' && state.pets.puffer ? (1 + state.pets.puffer.lv * 0.015) : 1);
    if (state.level >= 10 && Math.random() < 0.022 * exoticMult) {
      const pool = ['goldfish', 'emeraldfish'];
      if (state.level >= 50) pool.push('lavafish');
      if (state.level >= 100) pool.push('diamondfish');
      const pick = pool[Math.floor(Math.random() * pool.length)];
      state.exotics[pick]++;
      const label = { goldfish: 'Goldfish', emeraldfish: 'Emerald Fish', lavafish: 'Lava Fish', diamondfish: 'Diamond Fish' }[pick];
      addFeed(`✨ <span class="feed-strong">EXOTIC!</span> Reeled in a rare <span class="feed-emerald">${label}</span>!`, 'exotic');
      showToast(`✨ Caught Exotic ${label}!`, 'emerald');
    }

    const petOdds = (1 / 400) * (1 + state.prestige * 0.08) * exoticMult;
    if (Math.random() < petOdds) {
      const petDef = PETS[Math.floor(Math.random() * PETS.length)];
      if (!state.pets[petDef.id]) {
        state.pets[petDef.id] = { lv: 1, xp: 0 };
        if (!state.activePet) state.activePet = petDef.id;
        addFeed(`🐾 <span class="feed-strong">NEW COMPANION!</span> Befriended <span class="feed-fuchsia">${petDef.icon} ${petDef.name}</span>!`, 'pet');
        showToast(`🐾 Discovered ${petDef.name}!`, 'fuchsia');
      } else if (state.pets[petDef.id].lv < 100) {
        state.pets[petDef.id].lv = Math.min(100, state.pets[petDef.id].lv + 1);
        addFeed(`🐾 Duplicate <span class="feed-strong">${petDef.name}</span> boosted to <span class="feed-fuchsia">Lv.${state.pets[petDef.id].lv}</span>!`, 'pet');
      }
    }
  } else {
    advanceQuest('fish', totalCaught);
  }
  hudDirty = true;
}

function sellLivewell() {
  if (state.livewellValue <= 0) return;
  const val = state.livewellValue;
  const cnt = state.livewellCount;
  state.gold += val;
  state.livewellCount = 0;
  state.livewellValue = 0;
  addFeed(`🪙 Sold <span class="feed-strong">${fmt(cnt)} fish</span> for <span class="feed-amber">$${fmt(val)}</span>!`);
  hudDirty = true;
  flushHUD();
  refreshAffordability();
}

function openCrate(cKey, count = 1) {
  const owned = state.crates[cKey] || 0;
  const toOpen = Math.min(owned, count);
  if (toOpen <= 0) return;
  state.crates[cKey] -= toOpen;

  const def = CRATE_TYPES[cKey];
  const specMult = 1 + state.emeraldUpgrades.emCrate * 0.15 +
    (state.activePet === 'axolotl' && state.pets.axolotl ? state.pets.axolotl.lv * 0.01 : 0);

  let totalGold = 0;
  let totalEm = 0;
  let charmFound = null;

  for (let i = 0; i < toOpen; i++) {
    totalGold += Math.round(def.goldMult * Math.max(10, state.level * 10) * Math.pow(1.4, state.prestige) * specMult * (0.8 + Math.random() * 0.5));
    const emRoll = def.emMin + Math.floor(Math.random() * (def.emMax - def.emMin + 1));
    totalEm += Math.max(1, Math.round(emRoll * specMult));

    if (state.level >= 20 && Math.random() < 0.16) {
      const ch = CHARMS[Math.floor(Math.random() * CHARMS.length)];
      state.charms[ch.id] = (state.charms[ch.id] || 0) + 1;
      charmFound = `${ch.icon} ${ch.name} (Rank ${state.charms[ch.id]})`;
    }
  }

  state.gold += totalGold;
  state.emeralds += totalEm;
  let msg = `${def.icon} Opened <span class="feed-strong">${toOpen}x ${def.name}</span> → <span class="feed-amber">+$${fmt(totalGold)}</span> &amp; <span class="feed-emerald">+${fmt(totalEm)} 💎</span>`;
  if (charmFound) msg += ` + <span class="feed-fuchsia">${charmFound}</span>!`;
  addFeed(msg, 'crate');
  showToast(`📦 +$${fmt(totalGold)} & +${fmt(totalEm)} 💎`, 'amber');
  hudDirty = true;
  flushHUD();
  renderActiveTab();
}

function openAllCrates() {
  let opened = false;
  for (const key of Object.keys(CRATE_TYPES)) {
    if ((state.crates[key] || 0) > 0) {
      openCrate(key, state.crates[key]);
      opened = true;
    }
  }
  if (!opened) showToast('No crates to open yet!', 'cyan');
}

function claimDaily() {
  const now = Date.now();
  const cooldownMs = 20 * 60 * 60 * 1000;
  if (now - state.lastDaily < cooldownMs) {
    const hrs = Math.ceil((cooldownMs - (now - state.lastDaily)) / 3600000);
    showToast(`⏳ Daily ready in ~${hrs}h`, 'amber');
    return;
  }
  state.lastDaily = now;
  state.dailyStreak++;
  const em = 10 + state.dailyStreak * 3;
  const gold = Math.max(2500, state.level * 1200 * Math.pow(1.6, state.prestige));
  state.emeralds += em;
  state.gold += gold;
  state.crates[getBiome().crate] += 2;
  addFeed(`🎁 <span class="feed-strong">Daily Reward (Streak ${state.dailyStreak}):</span> +$${fmt(gold)}, +${em} 💎 &amp; +2 Crates!`, 'crate');
  showToast(`🎁 Daily Claimed! +${em} 💎 & +2 Crates`, 'emerald');
  hudDirty = true;
  flushHUD();
  renderActiveTab();
}

function doPrestige() {
  const req = getPrestigeRequirement();
  if (state.level < req) return;
  const gain = getPrestigeTokensOnReset();
  if (!confirm(`Ascend to Prestige ${state.prestige + 1} for +${gain} Prestige Tokens?\n\nResets Level, Gold, Rods, Boats & Gold Upgrades.\nKeeps Emeralds, Emerald Upgrades, Pets, Charms, Exotics & Fishdex.\nGrants permanent 1.55x XP & 1.75x Gold + unlocks higher Biomes!`)) {
    return;
  }

  state.prestige++;
  state.ptokens += gain;
  state.level = 1;
  state.xp = 0;
  state.biome = 'river';
  state.livewellCount = 0;
  state.livewellValue = 0;
  state.goldUpgrades = { cooldown: 0, salesman: 0, betterFish: 0, moreChests: 0, experienced: 0, baitEff: 0, workers: 0, duplicator: 0 };

  const hs = state.prestigeUpgrades.p_headstart;
  if (hs >= 3) {
    state.rod = 'r_lava'; state.ownedRods = ['r_plastic', 'r_improved', 'r_steel', 'r_fiber', 'r_coral', 'r_heavy', 'r_lava'];
    state.boat = 'b_sail'; state.ownedBoats = ['b_none', 'b_row', 'b_fish', 'b_speed', 'b_sail'];
    state.gold = 2500000;
  } else if (hs === 2) {
    state.rod = 'r_coral'; state.ownedRods = ['r_plastic', 'r_improved', 'r_steel', 'r_fiber', 'r_coral'];
    state.boat = 'b_speed'; state.ownedBoats = ['b_none', 'b_row', 'b_fish', 'b_speed'];
    state.gold = 250000;
  } else if (hs === 1) {
    state.rod = 'r_steel'; state.ownedRods = ['r_plastic', 'r_improved', 'r_steel'];
    state.boat = 'b_row'; state.ownedBoats = ['b_none', 'b_row'];
    state.gold = 25000;
  } else {
    state.rod = 'r_plastic'; state.ownedRods = ['r_plastic'];
    state.boat = 'b_none'; state.ownedBoats = ['b_none'];
    state.gold = 0;
  }

  addFeed(`🔮 <span class="feed-strong">ASCENDED TO PRESTIGE ${state.prestige}!</span> Earned +${gain} Prestige Tokens!`, 'pet');
  showToast(`🔮 Prestige ${state.prestige} Unlocked!`, 'fuchsia');
  saveGame();
  hudDirty = true;
  flushHUD();
  renderActiveTab();
}
