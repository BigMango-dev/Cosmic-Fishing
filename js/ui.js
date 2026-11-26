/* ============================================================================
   UI LAYER — CACHED DOM, TOASTS, FEED, HUD FLUSH & TAB RENDERERS
   ============================================================================ */
const DOM = {
  prestigeBadge: document.getElementById('ui-prestige-badge'),
  gold: document.getElementById('ui-gold'),
  emeralds: document.getElementById('ui-emeralds'),
  ptokens: document.getElementById('ui-ptokens'),
  cdStat: document.getElementById('ui-cd-stat'),
  powerStat: document.getElementById('ui-power-stat'),
  levelMain: document.getElementById('stat-level-main'),
  xpBarMain: document.getElementById('stat-xp-bar-main'),
  xpTextMain: document.getElementById('stat-xp-text-main'),
  xpPctMain: document.getElementById('stat-xp-pct-main'),
  biomeStage: document.getElementById('biome-stage'),
  biomeIcon: document.getElementById('ui-biome-icon'),
  biomeName: document.getElementById('ui-biome-name'),
  biomeDesc: document.getElementById('ui-biome-desc'),
  biomeMult: document.getElementById('ui-biome-mult'),
  nextBiomeHint: document.getElementById('ui-next-biome-hint'),
  stageStatus: document.getElementById('stage-status-text'),
  bobber: document.getElementById('bobber-sprite'),
  castBtn: document.getElementById('btn-cast-line'),
  cdFill: document.getElementById('cooldown-bar-fill'),
  cdTimer: document.getElementById('cooldown-timer-text'),
  dockCastBtn: document.getElementById('dock-cast-btn'),
  dockCdFill: document.getElementById('dock-cooldown-bar'),
  dockCdTimer: document.getElementById('dock-cooldown-text'),
  dockBiome: document.getElementById('dock-biome-label'),
  dockBait: document.getElementById('dock-bait-label'),
  dockSellVal: document.getElementById('dock-sell-val'),
  livewellCount: document.getElementById('ui-livewell-count'),
  quickSellVal: document.getElementById('quick-sell-value'),
  sellAllBtn: document.getElementById('btn-sell-all'),
  quickChestCount: document.getElementById('quick-chest-count'),
  crateDot: document.getElementById('crate-ready-dot'),
  prestigeDot: document.getElementById('prestige-ready-dot'),
  workerRate: document.getElementById('ui-worker-rate'),
  milestoneBonus: document.getElementById('ui-milestone-bonus'),
  totalCasts: document.getElementById('ui-total-casts'),
  activeBaitShort: document.getElementById('ui-active-bait-short'),
  autoCastBtn: document.getElementById('btn-autocast'),
  autoSellBtn: document.getElementById('btn-autosell'),
  buffsWrap: document.getElementById('ui-active-buffs'),
  feedList: document.getElementById('catch-feed-list'),
  tabArea: document.getElementById('tab-content-area'),
  toastWrap: document.getElementById('toast-container')
};

const textCache = {};
function setText(key, el, val) {
  if (textCache[key] !== val) {
    textCache[key] = val;
    el.textContent = val;
  }
}

function showToast(message, tone = 'cyan') {
  const colors = {
    cyan: '#22d3ee',
    emerald: '#34d399',
    amber: '#fbbf24',
    fuchsia: '#e879f9',
    rose: '#fb7185'
  };
  const el = document.createElement('div');
  el.style.cssText = `pointer-events:auto;padding:10px 14px;border-radius:12px;background:#121624;border:1px solid ${colors[tone] || '#22d3ee'};color:#f1f5f9;font-size:12px;font-weight:700;box-shadow:0 10px 24px rgba(0,0,0,0.45);transition:opacity 0.2s ease;`;
  el.textContent = message;
  DOM.toastWrap.appendChild(el);
  while (DOM.toastWrap.children.length > 3) DOM.toastWrap.firstChild.remove();
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 220);
  }, 2400);
}

function addFeed(html, tone = 'default') {
  const div = document.createElement('div');
  div.className = tone === 'default' ? 'feed-row' : `feed-row feed-${tone}`;
  div.innerHTML = html;
  DOM.feedList.prepend(div);
  while (DOM.feedList.children.length > 18) DOM.feedList.lastChild.remove();
}

function triggerBobberAnim() {
  DOM.bobber.classList.add('bobber-cast');
  clearTimeout(bobberTimeout);
  bobberTimeout = setTimeout(() => DOM.bobber.classList.remove('bobber-cast'), 130);
}

function flushHUD() {
  hudDirty = false;
  const biome = getBiome();
  setText('pBadge', DOM.prestigeBadge, `P${state.prestige}`);
  setText('gold', DOM.gold, '$' + fmt(state.gold));
  setText('emeralds', DOM.emeralds, fmt(state.emeralds));
  setText('ptokens', DOM.ptokens, fmt(state.ptokens));
  setText('cdStat', DOM.cdStat, getCooldownSeconds().toFixed(2) + 's');
  setText('powerStat', DOM.powerStat, fmt(getFishYieldMultiplier()) + 'x');

  const reqXp = xpRequired(state.level);
  const xpRatio = Math.max(0, Math.min(1, state.xp / reqXp));
  setText('levelMain', DOM.levelMain, String(state.level));
  setText('xpTextMain', DOM.xpTextMain, `${fmt(state.xp)} / ${fmt(reqXp)} XP`);
  setText('xpPctMain', DOM.xpPctMain, `${(xpRatio * 100).toFixed(1)}%`);
  DOM.xpBarMain.style.transform = `scaleX(${xpRatio})`;

  if (textCache.biomeId !== biome.id) {
    textCache.biomeId = biome.id;
    DOM.biomeStage.style.background = biome.gradient;
    DOM.biomeIcon.textContent = biome.icon;
    DOM.biomeName.textContent = biome.name;
    DOM.biomeDesc.textContent = biome.desc;
    DOM.biomeMult.textContent = `${fmt(biome.goldMult)}x Gold | ${fmt(biome.xpBase)} XP`;
    DOM.dockBiome.textContent = `${biome.icon} ${biome.name}`;
  }

  let nextHint = 'All 10 Biomes Unlocked!';
  for (const b of BIOMES) {
    if (!isBiomeUnlocked(b)) {
      const reqLv = getBiomeReqLevel(b);
      nextHint = b.reqPrestige > 0 ? `${b.name} (Lv ${reqLv}, P${b.reqPrestige})` : `${b.name} (Lv ${reqLv})`;
      break;
    }
  }
  setText('nextBiome', DOM.nextBiomeHint, nextHint);
  DOM.prestigeDot.classList.toggle('hidden', state.level < getPrestigeRequirement());

  setText('lwCnt', DOM.livewellCount, `${fmt(state.livewellCount)} fish`);
  const sellStr = '$' + fmt(state.livewellValue);
  setText('lwVal', DOM.quickSellVal, sellStr);
  setText('dockSell', DOM.dockSellVal, sellStr);
  DOM.sellAllBtn.disabled = state.livewellValue <= 0;

  const totalCrates = Object.values(state.crates).reduce((a, b) => a + b, 0);
  setText('crateCnt', DOM.quickChestCount, fmt(totalCrates));
  DOM.crateDot.classList.toggle('hidden', totalCrates === 0);

  const workerFish = state.goldUpgrades.workers > 0
    ? Math.max(1, Math.round((1 + state.goldUpgrades.betterFish) * getFishYieldMultiplier() * 0.30 * getBoat().workerMult))
    : 0;
  setText('workerRate', DOM.workerRate, `${fmt(workerFish)} fish / 3s`);
  setText('milestone', DOM.milestoneBonus, `+${Math.round(getLevelMilestoneBonus() * 100)}% Lv`);
  setText('casts', DOM.totalCasts, fmt(state.totalCasts));

  const baitObj = state.activeBait ? BAITS.find(b => b.id === state.activeBait) : null;
  const baitQty = baitObj ? (state.baits[baitObj.id] || 0) : 0;
  const baitShort = baitObj && baitQty > 0 ? `${baitObj.name} (${fmt(baitQty)})` : 'None';
  setText('baitShort', DOM.activeBaitShort, baitShort);
  setText('dockBait', DOM.dockBait, baitShort);

  if (textCache.autoCast !== state.autoCast) {
    textCache.autoCast = state.autoCast;
    DOM.autoCastBtn.textContent = `🤖 Auto: ${state.autoCast ? 'ON' : 'OFF'}`;
    DOM.autoCastBtn.className = state.autoCast
      ? 'py-2 px-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[11px] font-bold transition active:scale-95'
      : 'py-2 px-2 rounded-xl bg-discord-850 hover:bg-discord-800 border border-slate-700 text-slate-300 text-[11px] font-bold transition active:scale-95';
  }

  if (textCache.autoSell !== state.autoSell) {
    textCache.autoSell = state.autoSell;
    DOM.autoSellBtn.textContent = `💰 Sell: ${state.autoSell ? 'ON' : 'OFF'}`;
    DOM.autoSellBtn.className = state.autoSell
      ? 'py-2 px-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-bold transition active:scale-95'
      : 'py-2 px-2 rounded-xl bg-discord-850 hover:bg-discord-800 border border-slate-700 text-slate-300 text-[11px] font-bold transition active:scale-95';
  }

  let buffKey = '';
  for (const bo of BOOST_DEFS) {
    const t = Math.ceil(state.boostTimers[bo.id] || 0);
    if (t > 0) buffKey += `${bo.id}:${t}|`;
  }
  if (buffKey !== lastBuffKey) {
    lastBuffKey = buffKey;
    DOM.buffsWrap.innerHTML = '';
    for (const bo of BOOST_DEFS) {
      const t = Math.ceil(state.boostTimers[bo.id] || 0);
      if (t > 0) {
        const pill = document.createElement('span');
        pill.className = 'buff-chip';
        pill.textContent = `⚡ ${bo.name.split(' (')[0]} (${t}s)`;
        DOM.buffsWrap.appendChild(pill);
      }
    }
  }
}

function refreshAffordability() {
  if (activeTab === 'shop') {
    DOM.tabArea.querySelectorAll('[data-cost-gold]').forEach(btn => {
      const cost = Number(btn.dataset.costGold);
      const locked = btn.dataset.locked === '1';
      const maxed = btn.dataset.maxed === '1';
      if (!locked && !maxed) btn.disabled = state.gold < cost;
    });
    DOM.tabArea.querySelectorAll('[data-cost-em]').forEach(btn => {
      const cost = Number(btn.dataset.costEm);
      const maxed = btn.dataset.maxed === '1';
      if (!maxed) btn.disabled = state.emeralds < cost;
    });
  } else if (activeTab === 'crates') {
    state.quests.forEach(q => {
      const bar = document.getElementById(`qbar-${q.id}`);
      const txt = document.getElementById(`qtxt-${q.id}`);
      if (bar && txt) {
        const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
        bar.style.transform = `scaleX(${pct / 100})`;
        txt.textContent = `${fmt(q.progress)} / ${fmt(q.target)} (${pct}%)`;
      }
    });
  }
}

let leaderboardSort = 'score';

function setActiveTabStyles() {
  document.querySelectorAll('#main-tabs .tab-btn').forEach(btn => {
    const isOn = btn.dataset.tab === activeTab;
    btn.className = `tab-btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-[13px] font-bold whitespace-nowrap transition relative ${
      isOn
        ? 'bg-gradient-to-r from-indigo-500/30 to-cyan-500/25 text-cyan-200 border border-indigo-400/50 shadow'
        : 'text-slate-400 hover:text-white hover:bg-discord-800/70 border border-transparent'
    }`;
  });
}

function renderActiveTab() {
  setActiveTabStyles();
  const area = DOM.tabArea;
  if (activeTab === 'shop') renderShopTab(area);
  else if (activeTab === 'biomes') renderBiomesTab(area);
  else if (activeTab === 'crates') renderCratesTab(area);
  else if (activeTab === 'pets') renderPetsTab(area);
  else if (activeTab === 'fishdex') renderFishdexTab(area);
  else if (activeTab === 'prestige') renderPrestigeTab(area);
  else if (activeTab === 'leaderboard') renderLeaderboardTab(area);
}

function renderShopTab(container) {
  const subTabs = [
    { id: 'gold', label: '⬆️ Gold Upgrades' },
    { id: 'emerald', label: '💎 Emerald Upgrades' },
    { id: 'rods', label: '🎣 Rods (18)' },
    { id: 'boats', label: '⛵ Boats (12)' },
    { id: 'baits', label: '🪱 Baits & Boosts' }
  ];

  let body = '';
  if (shopSubTab === 'gold') {
    body = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${GOLD_UPGRADES.map(u => {
        const lv = state.goldUpgrades[u.id] || 0;
        const maxed = lv >= u.maxLv;
        const cost = Math.floor(u.baseCost * Math.pow(u.costScale, lv));
        const canBuy = !maxed && state.gold >= cost;
        return `
          <div class="p-3.5 rounded-xl bg-discord-850 border ${lv > 0 ? 'border-indigo-500/35' : 'border-slate-800'} flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="font-extrabold text-sm text-white">${u.icon} ${u.name}</span>
                <span class="px-2 py-0.5 rounded-md bg-discord-950 text-[11px] font-mono font-bold text-cyan-300">Lv ${lv}/${u.maxLv}</span>
              </div>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">${u.desc}</p>
            </div>
            <button data-buy-gold="${u.id}" data-cost-gold="${cost}" data-maxed="${maxed ? '1' : '0'}" ${canBuy ? '' : 'disabled'} class="w-full py-2 px-3 rounded-xl font-extrabold text-xs transition active:scale-95 ${
              maxed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
              : 'bg-indigo-500 hover:bg-indigo-400 disabled:bg-discord-950 disabled:text-slate-500 disabled:border disabled:border-slate-800 text-white'
            }">${maxed ? 'MAXED' : `Upgrade — $${fmt(cost)}`}</button>
          </div>
        `;
      }).join('')}
    </div>`;
  } else if (shopSubTab === 'emerald') {
    body = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${EMERALD_UPGRADES.map(u => {
        const lv = state.emeraldUpgrades[u.id] || 0;
        const maxed = lv >= u.maxLv;
        const cost = Math.floor(u.baseCost * Math.pow(u.costScale, lv));
        const canBuy = !maxed && state.emeralds >= cost;
        return `
          <div class="p-3.5 rounded-xl bg-discord-850 border ${lv > 0 ? 'border-emerald-500/40' : 'border-slate-800'} flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="font-extrabold text-sm text-white">${u.icon} ${u.name}</span>
                <span class="px-2 py-0.5 rounded-md bg-discord-950 text-[11px] font-mono font-bold text-emerald-300">Lv ${lv}/${u.maxLv}</span>
              </div>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">${u.desc}</p>
            </div>
            <button data-buy-em="${u.id}" data-cost-em="${cost}" data-maxed="${maxed ? '1' : '0'}" ${canBuy ? '' : 'disabled'} class="w-full py-2 px-3 rounded-xl font-extrabold text-xs transition active:scale-95 ${
              maxed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
              : 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-discord-950 disabled:text-slate-500 disabled:border disabled:border-slate-800 text-white'
            }">${maxed ? 'MAXED' : `Upgrade — ${fmt(cost)} 💎`}</button>
          </div>
        `;
      }).join('')}
    </div>`;
  } else if (shopSubTab === 'rods') {
    body = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${RODS.map(r => {
        const owned = state.ownedRods.includes(r.id);
        const equipped = state.rod === r.id;
        const locked = (state.level < r.reqLv || state.prestige < r.reqP) && !owned;
        const disabled = equipped || locked || (!owned && state.gold < r.cost);
        const reqText = r.reqP > 0 ? `Lv ${r.reqLv} & P${r.reqP}` : `Lv ${r.reqLv}`;
        return `
          <div class="p-3.5 rounded-xl bg-discord-850 border ${equipped ? 'border-cyan-400 bg-cyan-500/10' : owned ? 'border-emerald-500/35' : 'border-slate-800'} flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="font-extrabold text-sm text-white">🎣 ${r.name}</span>
                <span class="px-2 py-0.5 rounded-md bg-discord-950 text-[11px] font-mono font-bold text-amber-300">${r.mult}x Fish</span>
              </div>
              <p class="text-xs text-slate-400 mt-1.5">+${Math.round(r.rareBonus * 100)}% Rare/Mythic odds • Req: ${reqText}</p>
            </div>
            <button data-rod="${r.id}" ${owned ? '' : `data-cost-gold="${r.cost}" data-locked="${locked ? '1' : '0'}"`} ${disabled ? 'disabled' : ''} class="w-full py-2 px-3 rounded-xl font-extrabold text-xs transition active:scale-95 ${
              equipped ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
              : owned ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-indigo-500 hover:bg-indigo-400 disabled:bg-discord-950 disabled:text-slate-500 disabled:border disabled:border-slate-800 text-white'
            }">${equipped ? 'EQUIPPED' : owned ? 'Equip' : locked ? `🔒 ${reqText}` : `Buy — $${fmt(r.cost)}`}</button>
          </div>
        `;
      }).join('')}
    </div>`;
  } else if (shopSubTab === 'boats') {
    body = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${BOATS.map(b => {
        const owned = state.ownedBoats.includes(b.id);
        const equipped = state.boat === b.id;
        const locked = (state.level < b.reqLv || state.prestige < b.reqP) && !owned;
        const disabled = equipped || locked || (!owned && state.gold < b.cost);
        const reqText = b.reqP > 0 ? `Lv ${b.reqLv} & P${b.reqP}` : `Lv ${b.reqLv}`;
        return `
          <div class="p-3.5 rounded-xl bg-discord-850 border ${equipped ? 'border-cyan-400 bg-cyan-500/10' : owned ? 'border-emerald-500/35' : 'border-slate-800'} flex flex-col justify-between gap-3">
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="font-extrabold text-sm text-white">⛵ ${b.name}</span>
                <span class="px-2 py-0.5 rounded-md bg-discord-950 text-[11px] font-mono font-bold text-cyan-300">${b.fishMult}x Yield</span>
              </div>
              <p class="text-xs text-slate-400 mt-1.5">${b.workerMult}x Crew Speed • Req: ${reqText}</p>
            </div>
            <button data-boat="${b.id}" ${owned ? '' : `data-cost-gold="${b.cost}" data-locked="${locked ? '1' : '0'}"`} ${disabled ? 'disabled' : ''} class="w-full py-2 px-3 rounded-xl font-extrabold text-xs transition active:scale-95 ${
              equipped ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
              : owned ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-indigo-500 hover:bg-indigo-400 disabled:bg-discord-950 disabled:text-slate-500 disabled:border disabled:border-slate-800 text-white'
            }">${equipped ? 'EQUIPPED' : owned ? 'Equip' : locked ? `🔒 ${reqText}` : `Buy — $${fmt(b.cost)}`}</button>
          </div>
        `;
      }).join('')}
    </div>`;
  } else {
    const exoticLabels = { goldfish: 'Goldfish', emeraldfish: 'Emerald Fish', lavafish: 'Lava Fish', diamondfish: 'Diamond Fish' };
    body = `
      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${BAITS.map(b => {
            const qty = state.baits[b.id] || 0;
            const equipped = state.activeBait === b.id;
            const locked = state.level < b.reqLv;
            return `
              <div class="p-3.5 rounded-xl bg-discord-850 border ${equipped ? 'border-cyan-400 bg-cyan-500/10' : qty > 0 ? 'border-emerald-500/35' : 'border-slate-800'} flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="font-extrabold text-sm text-white">🪱 ${b.name}</span>
                    <span class="px-2 py-0.5 rounded-md bg-discord-950 text-[11px] font-mono text-emerald-300">Owned: ${fmt(qty)}</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-1">${b.desc} (Lv ${b.reqLv})</p>
                </div>
                <div class="grid grid-cols-3 gap-1.5">
                  <button data-bait-buy="${b.id}:25" data-cost-gold="${b.cost * 25}" data-locked="${locked ? '1' : '0'}" ${locked || state.gold < b.cost * 25 ? 'disabled' : ''} class="py-1.5 px-2 rounded-lg text-[11px] font-bold bg-indigo-500 hover:bg-indigo-400 disabled:bg-discord-950 disabled:text-slate-500 text-white transition">+25 ($${fmt(b.cost * 25)})</button>
                  <button data-bait-buy="${b.id}:250" data-cost-gold="${b.cost * 250}" data-locked="${locked ? '1' : '0'}" ${locked || state.gold < b.cost * 250 ? 'disabled' : ''} class="py-1.5 px-2 rounded-lg text-[11px] font-bold bg-indigo-500 hover:bg-indigo-400 disabled:bg-discord-950 disabled:text-slate-500 text-white transition">+250 ($${fmt(b.cost * 250)})</button>
                  <button data-bait-eq="${b.id}" ${qty <= 0 ? 'disabled' : ''} class="py-1.5 px-2 rounded-lg text-[11px] font-bold ${equipped ? 'bg-cyan-500 text-slate-950' : 'bg-emerald-600 hover:bg-emerald-500 text-white'} disabled:bg-discord-950 disabled:text-slate-500 transition">${equipped ? 'Active' : 'Equip'}</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="pt-2 border-t border-slate-800 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-400">⚡ Exotic Fish Boost Shop (3m Surges)</h4>
            <div class="text-[11px] font-mono text-emerald-300">
              Goldfish: ${state.exotics.goldfish} | Emerald: ${state.exotics.emeraldfish} | Lava: ${state.exotics.lavafish} | Diamond: ${state.exotics.diamondfish}
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${BOOST_DEFS.map(bo => {
              const have = state.exotics[bo.exoticType] || 0;
              const rem = Math.ceil(state.boostTimers[bo.id] || 0);
              return `
                <div class="p-3.5 rounded-xl bg-discord-850 border ${rem > 0 ? 'border-amber-400/60 bg-amber-500/10' : 'border-slate-800'} flex flex-col justify-between gap-2.5">
                  <div>
                    <div class="flex items-center justify-between gap-2">
                      <span class="font-extrabold text-sm text-white">⚡ ${bo.name}</span>
                      <span class="text-[11px] font-mono ${rem > 0 ? 'text-amber-300 font-bold' : 'text-slate-400'}">${rem > 0 ? `${rem}s left` : 'Ready'}</span>
                    </div>
                    <p class="text-xs text-slate-400 mt-1">${bo.desc}</p>
                  </div>
                  <button data-boost="${bo.id}" ${have < bo.cost ? 'disabled' : ''} class="w-full py-2 px-3 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-500 disabled:bg-discord-950 disabled:text-slate-500 text-white transition">
                    Activate — ${bo.cost} ${exoticLabels[bo.exoticType]} (Have ${have})
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="space-y-4">
      <div class="scroll-fade-wrap bg-discord-950 p-1.5 rounded-xl border border-slate-800">
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pr-6">
          ${subTabs.map(t => `
            <button data-sub="${t.id}" class="shop-sub-btn shrink-0 py-2 px-3 rounded-lg text-[11px] sm:text-xs font-extrabold whitespace-nowrap transition ${
              shopSubTab === t.id ? 'bg-indigo-500/25 text-cyan-200 border border-indigo-400/40' : 'text-slate-400 hover:text-white'
            }">${t.label}</button>
          `).join('')}
        </div>
      </div>
      ${body}
    </div>
  `;

  container.querySelectorAll('[data-sub]').forEach(btn => {
    btn.onclick = () => { shopSubTab = btn.dataset.sub; renderActiveTab(); };
  });
  container.querySelectorAll('[data-buy-gold]').forEach(btn => {
    btn.onclick = () => {
      const u = GOLD_UPGRADES.find(x => x.id === btn.dataset.buyGold);
      const lv = state.goldUpgrades[u.id] || 0;
      const cost = Math.floor(u.baseCost * Math.pow(u.costScale, lv));
      if (lv < u.maxLv && state.gold >= cost) {
        state.gold -= cost;
        state.goldUpgrades[u.id]++;
        hudDirty = true;
        flushHUD();
        renderActiveTab();
      }
    };
  });
  container.querySelectorAll('[data-buy-em]').forEach(btn => {
    btn.onclick = () => {
      const u = EMERALD_UPGRADES.find(x => x.id === btn.dataset.buyEm);
      const lv = state.emeraldUpgrades[u.id] || 0;
      const cost = Math.floor(u.baseCost * Math.pow(u.costScale, lv));
      if (lv < u.maxLv && state.emeralds >= cost) {
        state.emeralds -= cost;
        state.emeraldUpgrades[u.id]++;
        hudDirty = true;
        flushHUD();
        renderActiveTab();
      }
    };
  });
  container.querySelectorAll('[data-rod]').forEach(btn => {
    btn.onclick = () => {
      const r = RODS.find(x => x.id === btn.dataset.rod);
      if (state.ownedRods.includes(r.id)) {
        state.rod = r.id;
      } else if (state.level >= r.reqLv && state.prestige >= r.reqP && state.gold >= r.cost) {
        state.gold -= r.cost;
        state.ownedRods.push(r.id);
        state.rod = r.id;
        showToast(`🎣 Equipped ${r.name}!`, 'cyan');
      }
      hudDirty = true;
      flushHUD();
      renderActiveTab();
    };
  });
  container.querySelectorAll('[data-boat]').forEach(btn => {
    btn.onclick = () => {
      const b = BOATS.find(x => x.id === btn.dataset.boat);
      if (state.ownedBoats.includes(b.id)) {
        state.boat = b.id;
      } else if (state.level >= b.reqLv && state.prestige >= b.reqP && state.gold >= b.cost) {
        state.gold -= b.cost;
        state.ownedBoats.push(b.id);
        state.boat = b.id;
        showToast(`⛵ Boarded ${b.name}!`, 'cyan');
      }
      hudDirty = true;
      flushHUD();
      renderActiveTab();
    };
  });
  container.querySelectorAll('[data-bait-buy]').forEach(btn => {
    btn.onclick = () => {
      const [id, amtStr] = btn.dataset.baitBuy.split(':');
      const amt = Number(amtStr);
      const b = BAITS.find(x => x.id === id);
      if (state.level >= b.reqLv && state.gold >= b.cost * amt) {
        state.gold -= b.cost * amt;
        state.baits[id] = (state.baits[id] || 0) + amt;
        if (!state.activeBait) state.activeBait = id;
        hudDirty = true;
        flushHUD();
        renderActiveTab();
      }
    };
  });
  container.querySelectorAll('[data-bait-eq]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.baitEq;
      state.activeBait = state.activeBait === id ? null : id;
      hudDirty = true;
      flushHUD();
      renderActiveTab();
    };
  });
  container.querySelectorAll('[data-boost]').forEach(btn => {
    btn.onclick = () => {
      const bo = BOOST_DEFS.find(x => x.id === btn.dataset.boost);
      if (state.exotics[bo.exoticType] >= bo.cost) {
        state.exotics[bo.exoticType] -= bo.cost;
        state.boostTimers[bo.id] = (state.boostTimers[bo.id] || 0) + 180;
        addFeed(`⚡ Activated <span class="feed-amber">${bo.name}</span>!`, 'exotic');
        showToast(`⚡ ${bo.name} Active!`, 'amber');
        hudDirty = true;
        flushHUD();
        renderActiveTab();
      }
    };
  });
}

function renderBiomesTab(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${BIOMES.map(b => {
        const reqLv = getBiomeReqLevel(b);
        const unlocked = isBiomeUnlocked(b);
        const active = state.biome === b.id;
        const mastered = b.fish.every(f => (state.bestiary[f.id] || 0) > 0);
        const lockLabel = b.reqPrestige > 0 ? `🔒 Lv ${reqLv} & P${b.reqPrestige}` : `🔒 Lv ${reqLv}`;
        return `
          <div class="rounded-2xl overflow-hidden border ${active ? 'border-cyan-400 shadow-lg' : unlocked ? 'border-slate-700' : 'border-slate-800 opacity-65'} bg-discord-850 flex flex-col justify-between">
            <div class="p-3.5" style="background: ${b.gradient};">
              <div class="flex items-center justify-between gap-2">
                <span class="font-black text-base text-white">${b.icon} ${b.name}</span>
                <span class="px-2 py-0.5 rounded-md bg-black/45 text-[11px] font-mono font-bold text-amber-300">${fmt(b.goldMult)}x $ | ${fmt(b.xpBase)} XP</span>
              </div>
              <p class="text-[11px] text-slate-200/90 mt-1">${b.desc}</p>
            </div>
            <div class="p-3 flex items-center justify-between gap-2 bg-discord-850">
              <div class="text-[11px] text-slate-400">
                <div>Crate: <strong class="text-slate-200">${CRATE_TYPES[b.crate].name}</strong></div>
                <div>${mastered ? '<span class="text-emerald-300 font-bold">✅ Fishdex Mastered</span>' : (b.reqPrestige > 0 ? `Req: Lv ${reqLv} • Prestige ${b.reqPrestige}` : `Req: Lv ${reqLv}`)}</div>
              </div>
              <button data-travel="${b.id}" ${!unlocked || active ? 'disabled' : ''} class="px-3 py-2 rounded-xl font-extrabold text-xs transition active:scale-95 shrink-0 ${
                active ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                : unlocked ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                : 'bg-discord-950 text-slate-500 border border-slate-800 cursor-not-allowed'
              }">${active ? 'CURRENT' : unlocked ? 'Travel' : lockLabel}</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('[data-travel]').forEach(btn => {
    btn.onclick = () => {
      state.biome = btn.dataset.travel;
      const b = getBiome();
      showToast(`🌌 Traveled to ${b.icon} ${b.name}!`, 'cyan');
      hudDirty = true;
      flushHUD();
      renderActiveTab();
    };
  });
}

function renderCratesTab(container) {
  const totalCrates = Object.values(state.crates).reduce((a, b) => a + b, 0);
  container.innerHTML = `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 border border-indigo-400/30">
        <div>
          <div class="font-extrabold text-sm text-white">🎁 Daily Streak &amp; Crate Vault</div>
          <div class="text-xs text-slate-300">Streak: ${state.dailyStreak} days • ${fmt(totalCrates)} crates stored</div>
        </div>
        <div class="flex gap-2">
          <button id="tab-btn-daily" class="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition active:scale-95">🎁 Claim Daily</button>
          <button id="tab-btn-openall" ${totalCrates <= 0 ? 'disabled' : ''} class="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-discord-950 disabled:text-slate-500 text-slate-950 font-extrabold text-xs transition active:scale-95">📦 Open All (${totalCrates})</button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${Object.entries(CRATE_TYPES).map(([key, def]) => {
          const qty = state.crates[key] || 0;
          return `
            <div class="p-3.5 rounded-xl bg-discord-850 border ${qty > 0 ? 'border-amber-400/40' : 'border-slate-800'} flex flex-col justify-between gap-2.5">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="font-extrabold text-sm text-white">${def.icon} ${def.name}</span>
                  <span class="px-2 py-0.5 rounded-md bg-discord-950 text-[11px] font-mono text-amber-300">x${qty}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">Drops Gold, ${def.emMin}–${def.emMax} 💎 &amp; 16% Charm roll (Lv 20+).</p>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button data-crate="${key}:1" ${qty < 1 ? 'disabled' : ''} class="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-discord-950 disabled:text-slate-500 text-white font-bold text-xs transition">Open 1</button>
                <button data-crate="${key}:all" ${qty < 1 ? 'disabled' : ''} class="py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-discord-950 disabled:text-slate-500 text-white font-bold text-xs transition">Open All</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="pt-2 border-t border-slate-800 space-y-2.5">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-400">🎯 Active Quests (Reward Emeralds &amp; Goldfish)</h4>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          ${state.quests.map(q => {
            const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
            return `
              <div class="p-3.5 rounded-xl bg-discord-850 border border-slate-800 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <span class="font-bold text-xs text-white leading-snug">📜 ${q.text}</span>
                  <span class="text-[11px] font-mono font-bold text-emerald-300 shrink-0">+${q.emReward}💎</span>
                </div>
                <div id="qtxt-${q.id}" class="text-[11px] text-slate-400 font-mono">${fmt(q.progress)} / ${fmt(q.target)} (${pct}%)</div>
                <div class="w-full h-1.5 bg-discord-950 rounded-full overflow-hidden">
                  <div id="qbar-${q.id}" class="cd-gpu-bar h-full w-full bg-gradient-to-r from-emerald-400 to-cyan-400" style="transform: scaleX(${pct / 100});"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  container.querySelector('#tab-btn-daily').onclick = claimDaily;
  container.querySelector('#tab-btn-openall').onclick = openAllCrates;
  container.querySelectorAll('[data-crate]').forEach(btn => {
    btn.onclick = () => {
      const [key, mode] = btn.dataset.crate.split(':');
      openCrate(key, mode === 'all' ? (state.crates[key] || 0) : 1);
    };
  });
}

function renderPetsTab(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-400">🐾 Companions (1 Active — Levels up to Lv. 100 as you fish)</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${PETS.map(p => {
          const owned = state.pets[p.id];
          const active = state.activePet === p.id;
          const req = owned ? Math.floor(90 * Math.pow(owned.lv, 1.65)) : 100;
          const pct = owned ? Math.min(100, Math.round((owned.xp / req) * 100)) : 0;
          return `
            <div class="p-3.5 rounded-xl bg-discord-850 border ${active ? 'border-fuchsia-400 bg-fuchsia-500/10' : owned ? 'border-emerald-500/35' : 'border-slate-800'} flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="font-extrabold text-sm text-white">${p.icon} ${p.name}</span>
                  <span class="px-2 py-0.5 rounded-md bg-discord-950 text-[11px] font-mono ${owned ? 'text-fuchsia-300 font-bold' : 'text-slate-500'}">${owned ? `Lv ${owned.lv}/100` : 'Locked'}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">${p.desc}</p>
                ${owned ? `
                  <div class="mt-2">
                    <div class="w-full h-1.5 bg-discord-950 rounded-full overflow-hidden">
                      <div class="cd-gpu-bar h-full w-full bg-gradient-to-r from-fuchsia-400 to-cyan-400" style="transform: scaleX(${pct / 100});"></div>
                    </div>
                  </div>
                ` : ''}
              </div>
              <button data-pet="${p.id}" ${!owned || active ? 'disabled' : ''} class="w-full py-2 rounded-xl font-extrabold text-xs transition ${
                active ? 'bg-fuchsia-500/25 text-fuchsia-200 border border-fuchsia-400/50'
                : owned ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-discord-950 text-slate-500 border border-slate-800 cursor-not-allowed'
              }">${active ? 'ACTIVE COMPANION' : owned ? 'Select Pet' : 'Found Randomly While Fishing'}</button>
            </div>
          `;
        }).join('')}
      </div>

      <div class="pt-2 border-t border-slate-800 space-y-2.5">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-400">✨ Permanent Charms (Found in Crates at Lv 20+)</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${CHARMS.map(c => {
            const rank = state.charms[c.id] || 0;
            return `
              <div class="p-3.5 rounded-xl bg-discord-850 border ${rank > 0 ? 'border-amber-400/40' : 'border-slate-800'}">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-extrabold text-sm text-white">${c.icon} ${c.name}</span>
                  <span class="px-2 py-0.5 rounded-md bg-discord-950 text-[11px] font-mono text-amber-300">Rank ${rank}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">${c.desc}</p>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-pet]').forEach(btn => {
    btn.onclick = () => {
      if (state.pets[btn.dataset.pet]) {
        state.activePet = btn.dataset.pet;
        hudDirty = true;
        flushHUD();
        renderActiveTab();
      }
    };
  });
}

function renderFishdexTab(container) {
  let discovered = 0;
  let total = 0;
  const sections = BIOMES.map(b => {
    const complete = b.fish.every(f => (state.bestiary[f.id] || 0) > 0);
    const chips = b.fish.map(f => {
      total++;
      const cnt = state.bestiary[f.id] || 0;
      if (cnt > 0) discovered++;
      const cls = RARITY_STYLES[f.rarity] || RARITY_STYLES.Common;
      return `<span class="px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cls} ${cnt > 0 ? '' : 'opacity-40'}">
        ${cnt > 0 ? `${f.name} (${fmt(cnt)})` : `??? [${f.rarity}]`}
      </span>`;
    }).join('');
    return `
      <div class="p-3.5 rounded-xl bg-discord-850 border ${complete ? 'border-emerald-400/50' : 'border-slate-800'} space-y-2.5">
        <div class="flex items-center justify-between gap-2">
          <span class="font-extrabold text-sm text-white">${b.icon} ${b.name} Fishdex</span>
          <span class="text-[11px] font-bold ${complete ? 'text-emerald-300' : 'text-slate-400'}">
            ${complete ? '✅ MASTERED (+20% Gold & +15% XP)' : 'In Progress'}
          </span>
        </div>
        <div class="flex flex-wrap gap-1.5">${chips}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-400">📖 60 Species Across 10 Biomes</h4>
        <span class="text-xs font-mono font-bold text-amber-300">${discovered} / ${total} Discovered</span>
      </div>
      ${sections}
    </div>
  `;
}

function renderPrestigeTab(container) {
  const req = getPrestigeRequirement();
  const gain = getPrestigeTokensOnReset();
  const canPrestige = state.level >= req;

  container.innerHTML = `
    <div class="space-y-4">
      <div class="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/20 to-discord-900 border border-fuchsia-400/50 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-black text-fuchsia-200">🔮 Ascend to Prestige ${state.prestige + 1}</h3>
            <p class="text-xs text-slate-300 mt-0.5">Requires Level ${req} (Current: Lv.${state.level}). Prestige unlocks Biomes 5–10 &amp; multiplies XP!</p>
          </div>
          <button id="tab-btn-prestige" ${canPrestige ? '' : 'disabled'} class="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-fuchsia-500 to-indigo-500 hover:brightness-110 disabled:bg-discord-950 disabled:from-discord-950 disabled:to-discord-950 disabled:text-slate-500 text-white shadow-lg transition active:scale-95">
            🔮 PRESTIGE (+${gain} Tokens)
          </button>
        </div>
        <div class="text-xs text-fuchsia-100/85 leading-relaxed">
          <strong>Keeps Forever:</strong> Prestige Rank, Tokens, Emeralds, Emerald Upgrades, Pets, Charms, Exotics &amp; Fishdex.<br/>
          <strong>Rank Multiplier:</strong> Compounding <strong>1.55x XP</strong> &amp; <strong>1.75x Gold</strong> per Prestige rank (Current: <strong>${fmt(Math.pow(1.55, state.prestige))}x XP</strong>, <strong>${fmt(Math.pow(1.75, state.prestige))}x Gold</strong>)!
        </div>
      </div>

      <h4 class="text-xs font-extrabold uppercase tracking-wider text-slate-400">Prestige Token Meta-Shop</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${PRESTIGE_UPGRADES.map(u => {
          const lv = state.prestigeUpgrades[u.id] || 0;
          const maxed = lv >= u.maxLv;
          const cost = Math.floor(u.baseCost * Math.pow(u.costScale, lv));
          const canBuy = !maxed && state.ptokens >= cost;
          return `
            <div class="p-3.5 rounded-xl bg-discord-850 border ${lv > 0 ? 'border-fuchsia-400/40' : 'border-slate-800'} flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="font-extrabold text-sm text-white">🔮 ${u.name}</span>
                  <span class="px-2 py-0.5 rounded-md bg-discord-950 text-[11px] font-mono text-fuchsia-300">Rank ${lv}/${u.maxLv}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">${u.desc}</p>
              </div>
              <button data-pupg="${u.id}" ${canBuy ? '' : 'disabled'} class="w-full py-2 rounded-xl font-extrabold text-xs transition ${
                maxed ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/30'
                : canBuy ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'
                : 'bg-discord-950 text-slate-500 border border-slate-800 cursor-not-allowed'
              }">${maxed ? 'MAXED' : `Ascend Perk — ${cost} Tokens`}</button>
            </div>
          `;
        }).join('')}
      </div>

      <div class="pt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div class="p-2.5 rounded-xl bg-discord-850 border border-slate-800">
          <div class="text-[10px] uppercase text-slate-400 font-bold">Gold Mult</div>
          <div class="text-sm font-black text-amber-300 font-mono">${fmt(getGoldMultiplier())}x</div>
        </div>
        <div class="p-2.5 rounded-xl bg-discord-850 border border-slate-800">
          <div class="text-[10px] uppercase text-slate-400 font-bold">XP Mult</div>
          <div class="text-sm font-black text-cyan-300 font-mono">${fmt(getXpMultiplier())}x</div>
        </div>
        <div class="p-2.5 rounded-xl bg-discord-850 border border-slate-800">
          <div class="text-[10px] uppercase text-slate-400 font-bold">Crate Chance</div>
          <div class="text-sm font-black text-emerald-300 font-mono">${(getCrateChance() * 100).toFixed(1)}%</div>
        </div>
        <div class="p-2.5 rounded-xl bg-discord-850 border border-slate-800">
          <div class="text-[10px] uppercase text-slate-400 font-bold">Mastered Biomes</div>
          <div class="text-sm font-black text-fuchsia-300 font-mono">${getBestiaryMasteryCount()} / ${BIOMES.length}</div>
        </div>
      </div>
    </div>
  `;

  container.querySelector('#tab-btn-prestige').onclick = doPrestige;
  container.querySelectorAll('[data-pupg]').forEach(btn => {
    btn.onclick = () => {
      const u = PRESTIGE_UPGRADES.find(x => x.id === btn.dataset.pupg);
      const lv = state.prestigeUpgrades[u.id] || 0;
      const cost = Math.floor(u.baseCost * Math.pow(u.costScale, lv));
      if (lv < u.maxLv && state.ptokens >= cost) {
        state.ptokens -= cost;
        state.prestigeUpgrades[u.id]++;
        hudDirty = true;
        flushHUD();
        renderActiveTab();
      }
    };
  });
}


function escHtml(str) {
  return String(str || 'Angler')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLeaderboardTab(container) {
  const cloud = window.CloudSync;
  const myUid = cloud && cloud.getUid ? cloud.getUid() : 'local-me';
  const rawList = cloud && cloud.getLeaderboard ? cloud.getLeaderboard() : [];
  const lbStatus = cloud && cloud.getLeaderboardStatus ? cloud.getLeaderboardStatus() : 'local';

  // Build merged list (always ensure current player appears even before first cloud sync)
  const list = rawList.length > 0 ? rawList.map(x => ({ ...x })) : [{
    uid: myUid,
    displayName: state.displayName || 'Cosmic Angler',
    prestige: state.prestige || 0,
    level: state.level || 1,
    gold: state.gold || 0,
    totalCasts: state.totalCasts || 0,
    biome: state.biome || 'river',
    isGoogle: false
  }];

  // Sort by selected metric
  list.sort((a, b) => {
    if (leaderboardSort === 'gold') return (b.gold || 0) - (a.gold || 0);
    if (leaderboardSort === 'casts') return (b.totalCasts || 0) - (a.totalCasts || 0);
    // Default: Prestige first, then Level, then Gold
    if ((b.prestige || 0) !== (a.prestige || 0)) return (b.prestige || 0) - (a.prestige || 0);
    if ((b.level || 0) !== (a.level || 0)) return (b.level || 0) - (a.level || 0);
    return (b.gold || 0) - (a.gold || 0);
  });

  const myIndex = list.findIndex(e => e.uid === myUid);
  const myRankText = myIndex >= 0 ? `#${myIndex + 1}` : 'Unranked (Syncing...)';

  const sortButtons = [
    { id: 'score', label: '🏅 Prestige & Level' },
    { id: 'gold', label: '🪙 Richest (Gold)' },
    { id: 'casts', label: '🎣 Most Casts' }
  ];

  const rowsHtml = list.slice(0, 50).map((p, idx) => {
    const rank = idx + 1;
    const isMe = p.uid === myUid;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    const biomeObj = BIOMES.find(b => b.id === p.biome) || BIOMES[0];
    return `
      <div class="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border ${
        isMe
          ? 'bg-indigo-500/20 border-cyan-400/60'
          : rank <= 3
            ? 'bg-amber-500/10 border-amber-400/30'
            : 'bg-discord-850 border-slate-800'
      }">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 text-center font-black text-sm ${rank <= 3 ? 'text-amber-300' : 'text-slate-400'} shrink-0">${medal}</div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-extrabold text-xs sm:text-sm text-white truncate">${escHtml(p.displayName || 'Cosmic Angler')}</span>
              <span class="text-[11px]" title="${p.isGoogle ? 'Google Account' : 'Guest Angler'}">${p.isGoogle ? '⭐' : '👤'}</span>
              ${isMe ? '<span class="px-1.5 py-0.5 rounded bg-cyan-500/25 text-cyan-200 text-[10px] font-extrabold">YOU</span>' : ''}
            </div>
            <div class="text-[11px] text-slate-400 flex items-center gap-2">
              <span class="text-fuchsia-300 font-bold">P${p.prestige || 0}</span>
              <span>•</span>
              <span class="text-cyan-300 font-bold">Lv. ${fmt(p.level || 1)}</span>
              <span class="hidden sm:inline">•</span>
              <span class="hidden sm:inline">${biomeObj.icon} ${biomeObj.name}</span>
            </div>
          </div>
        </div>
        <div class="text-right shrink-0 font-mono">
          <div class="text-xs sm:text-sm font-black text-amber-300">$${fmt(p.gold || 0)}</div>
          <div class="text-[10px] text-slate-400">${fmt(p.totalCasts || 0)} casts</div>
        </div>
      </div>
    `;
  }).join('');

  const statusBanner = lbStatus === 'error'
    ? `<div class="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs">
         ⚠️ Global leaderboard needs Firestore read/write permission for the <code class="font-mono">leaderboard</code> collection. Showing your local stats until rules are published.
       </div>`
    : lbStatus === 'local'
      ? `<div class="p-3 rounded-xl bg-discord-850 border border-slate-700 text-slate-300 text-xs">
           🔌 Connecting to live global leaderboard...
         </div>`
      : '';

  container.innerHTML = `
    <div class="space-y-4">
      <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-fuchsia-500/15 border border-amber-400/35 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-xs font-extrabold uppercase tracking-wider text-amber-200">🏆 Global Angler Rankings</div>
          <div class="text-sm sm:text-base font-black text-white mt-0.5">
            Your Rank: <span class="text-cyan-300 font-mono">${myRankText}</span>
            <span class="text-xs font-normal text-slate-300 ml-2">(P${state.prestige} • Lv.${state.level} • $${fmt(state.gold)})</span>
          </div>
        </div>
        <button id="btn-lb-sync" class="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs transition active:scale-95">
          🔄 Sync My Rank
        </button>
      </div>

      ${statusBanner}

      <div class="flex flex-wrap items-center gap-1.5 bg-discord-950 p-1.5 rounded-xl border border-slate-800">
        ${sortButtons.map(b => `
          <button data-lb-sort="${b.id}" class="flex-1 min-w-[110px] py-2 px-3 rounded-lg text-[11px] sm:text-xs font-extrabold transition ${
            leaderboardSort === b.id
              ? 'bg-indigo-500/25 text-cyan-200 border border-indigo-400/40'
              : 'text-slate-400 hover:text-white'
          }">${b.label}</button>
        `).join('')}
      </div>

      <div class="space-y-2">${rowsHtml}</div>
    </div>
  `;

  container.querySelector('#btn-lb-sync').onclick = () => {
    saveGame(true);
  };
  container.querySelectorAll('[data-lb-sort]').forEach(btn => {
    btn.onclick = () => {
      leaderboardSort = btn.dataset.lbSort;
      renderActiveTab();
    };
  });
}

window.onLeaderboardUpdate = () => {
  if (activeTab === 'leaderboard') renderActiveTab();
};
