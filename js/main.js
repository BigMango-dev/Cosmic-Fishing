/* ============================================================================
   MAIN ENTRYPOINT — FOREGROUND + BACKGROUND WORKER + OFFLINE CATCH-UP + CLOUD
   ============================================================================ */
// Expose safe state bridge for ES module js/firebase.js
window.getGameState = () => state;
window.applyCloudState = (parsed) => {
  mergeState(parsed);
  try { localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(state)); } catch (_) {}
  hudDirty = true;
  flushHUD();
  renderActiveTab();
};

// Wrap saveGame so every save stamps lastActiveAt & syncs to Cloud
const _localOnlySave = window.saveGame;
window.saveGame = function(notify = false) {
  state.lastActiveAt = Date.now();
  _localOnlySave(false);
  if (window.CloudSync && window.CloudSync.isReady()) {
    window.CloudSync.save(notify);
  } else if (notify) {
    showToast('💾 Progress saved locally!', 'emerald');
  }
};

let lastRealTime = Date.now();
let hiddenSince = null;
let hiddenSnapshot = null;
let bgWorker = null;

function sumCrates() {
  return Object.values(state.crates || {}).reduce((a, b) => a + b, 0);
}

function captureSnapshot() {
  return {
    gold: state.gold,
    livewellValue: state.livewellValue,
    level: state.level,
    totalCasts: state.totalCasts,
    crates: sumCrates(),
    emeralds: state.emeralds
  };
}

function formatDuration(sec) {
  const s = Math.floor(sec);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

// Simulates real elapsed time (works smoothly in background tabs AND after browser sleep/offline up to 12h)
function advanceSimulation(dtSec, silent = false) {
  if (dtSec <= 0) return;
  const clampedSec = Math.min(43200, dtSec); // Cap single catch-up at 12 hours

  // 1. Tick Boost Timers
  for (const key of Object.keys(state.boostTimers)) {
    if (state.boostTimers[key] > 0) {
      state.boostTimers[key] = Math.max(0, state.boostTimers[key] - clampedSec);
      hudDirty = true;
    }
  }

  // 2. Auto-Cast simulation
  const totalCd = getCooldownSeconds();
  if (state.autoCast) {
    let timeLeft = clampedSec;
    if (cooldownRemaining > 0) {
      if (timeLeft >= cooldownRemaining) {
        timeLeft -= cooldownRemaining;
        cooldownRemaining = 0;
      } else {
        cooldownRemaining -= timeLeft;
        timeLeft = 0;
      }
    }

    if (cooldownRemaining <= 0) {
      const totalAutoCasts = 1 + Math.floor(timeLeft / totalCd);
      const remainder = timeLeft - Math.floor(timeLeft / totalCd) * totalCd;
      cooldownRemaining = Math.max(0, totalCd - remainder);

      const useSilent = silent || totalAutoCasts > 3;
      const MAX_LOOPS = 300;
      if (totalAutoCasts <= MAX_LOOPS) {
        for (let i = 0; i < totalAutoCasts; i++) {
          performCast(false, useSilent, 1);
        }
      } else {
        const batchScale = totalAutoCasts / MAX_LOOPS;
        for (let i = 0; i < MAX_LOOPS; i++) {
          performCast(false, true, batchScale);
        }
      }
    }
  } else if (cooldownRemaining > 0) {
    cooldownRemaining = Math.max(0, cooldownRemaining - clampedSec);
  }

  // 3. Auto-Fish Crew simulation (every 3.0s)
  if (state.goldUpgrades.workers > 0) {
    workerAccumulator += clampedSec;
    const workerTicks = Math.floor(workerAccumulator / 3.0);
    if (workerTicks > 0) {
      workerAccumulator -= workerTicks * 3.0;
      const useSilent = silent || workerTicks > 3;
      const MAX_LOOPS = 250;
      if (workerTicks <= MAX_LOOPS) {
        for (let i = 0; i < workerTicks; i++) {
          performCast(true, useSilent, 1);
        }
      } else {
        const batchScale = workerTicks / MAX_LOOPS;
        for (let i = 0; i < MAX_LOOPS; i++) {
          performCast(true, true, batchScale);
        }
      }
    }
  }

  state.lastActiveAt = Date.now();
}

function postBackgroundSummary(elapsedSec, beforeSnap, label = 'Background Fishing') {
  if (elapsedSec < 5 || !beforeSnap) return;
  const gainedGold = (state.gold + state.livewellValue) - (beforeSnap.gold + beforeSnap.livewellValue);
  const gainedCasts = state.totalCasts - beforeSnap.totalCasts;
  const gainedLv = state.level - beforeSnap.level;
  const gainedCrates = sumCrates() - beforeSnap.crates;
  const gainedEm = state.emeralds - beforeSnap.emeralds;

  if (gainedGold <= 0 && gainedCasts <= 0 && gainedLv <= 0) return;

  const parts = [];
  if (gainedCasts > 0) parts.push(`<span class="feed-strong">+${fmt(gainedCasts)} casts</span>`);
  if (gainedGold > 0) parts.push(`<span class="feed-amber">+$${fmt(gainedGold)}</span>`);
  if (gainedLv > 0) parts.push(`<span class="feed-strong">+${gainedLv} Lv</span>`);
  if (gainedCrates > 0) parts.push(`<span class="feed-amber">+${gainedCrates} Crates</span>`);
  if (gainedEm > 0) parts.push(`<span class="feed-emerald">+${fmt(gainedEm)} 💎</span>`);

  addFeed(`🌙 <span class="feed-strong">${label} (${formatDuration(elapsedSec)}):</span> ${parts.join(' • ')}`, 'levelup');
  showToast(`🌙 ${label}: ${formatDuration(elapsedSec)} synced!`, 'cyan');
}

// Inline Web Worker timer so background tabs keep fishing without rAF suspension
function initBackgroundWorker() {
  if (typeof Worker === 'undefined') return;
  try {
    const workerCode = `
      let timer = setInterval(() => { postMessage('tick'); }, 500);
      onmessage = (e) => {
        if (e.data === 'stop') clearInterval(timer);
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    bgWorker = new Worker(url);
    bgWorker.onmessage = () => {
      if (document.hidden) {
        const now = Date.now();
        const dtSec = (now - lastRealTime) / 1000;
        lastRealTime = now;
        if (dtSec > 0) {
          advanceSimulation(dtSec, true);
        }
      }
    };
    window.addEventListener('beforeunload', () => {
      state.lastActiveAt = Date.now();
      try { localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(state)); } catch (_) {}
      try { bgWorker.terminate(); } catch (_) {}
    });
  } catch (err) {
    console.warn('Web Worker unavailable, using visibility catch-up fallback:', err);
  }
}

document.addEventListener('visibilitychange', () => {
  const now = Date.now();
  if (document.hidden) {
    hiddenSince = now;
    hiddenSnapshot = captureSnapshot();
    saveGame(false);
  } else {
    const dtSec = (now - lastRealTime) / 1000;
    lastRealTime = now;
    if (dtSec > 0.2) {
      advanceSimulation(dtSec, true);
    }
    if (hiddenSince && hiddenSnapshot) {
      const totalAwaySec = (now - hiddenSince) / 1000;
      postBackgroundSummary(totalAwaySec, hiddenSnapshot, 'Background Fishing');
    }
    hiddenSince = null;
    hiddenSnapshot = null;
    lastFrameTime = performance.now();
    hudDirty = true;
    flushHUD();
    refreshAffordability();
    if (activeTab === 'crates' || activeTab === 'biomes' || activeTab === 'prestige' || activeTab === 'pets' || activeTab === 'fishdex') {
      renderActiveTab();
    }
  }
});

function attemptManualCast() {
  if (cooldownRemaining <= 0) {
    performCast(false, false, 1);
    flushHUD();
  }
}

function cycleOwnedBait() {
  const owned = [null, ...BAITS.filter(b => (state.baits[b.id] || 0) > 0).map(b => b.id)];
  const idx = owned.indexOf(state.activeBait);
  state.activeBait = owned[(idx + 1) % owned.length];
  hudDirty = true;
  flushHUD();
  if (activeTab === 'shop' && shopSubTab === 'baits') renderActiveTab();
}

function gameLoop(now) {
  const realNow = Date.now();
  const realDt = Math.max(0, (realNow - lastRealTime) / 1000);
  lastRealTime = realNow;
  lastFrameTime = now;

  // Advance simulation using real wall-clock delta (no 0.25s cap that loses background time)
  advanceSimulation(realDt, false);

  const totalCd = getCooldownSeconds();
  if (cooldownRemaining <= 0) {
    if (lastCdReadyState !== true) {
      lastCdReadyState = true;
      DOM.castBtn.disabled = false;
      DOM.dockCastBtn.disabled = false;
      DOM.cdFill.style.transform = 'scaleX(1)';
      DOM.dockCdFill.style.transform = 'scaleX(1)';
      setText('cdTimer', DOM.cdTimer, `Ready (${totalCd.toFixed(2)}s)`);
      setText('dockCd', DOM.dockCdTimer, 'Ready');
      setText('stageStatus', DOM.stageStatus, 'Ready to cast! Press Space or tap Cast');
    }
  } else {
    if (lastCdReadyState !== false) {
      lastCdReadyState = false;
      DOM.castBtn.disabled = true;
      DOM.dockCastBtn.disabled = true;
      setText('stageStatus', DOM.stageStatus, 'Reeling in the cosmos...');
    }
    const ratio = Math.max(0, Math.min(1, (totalCd - cooldownRemaining) / totalCd));
    DOM.cdFill.style.transform = `scaleX(${ratio})`;
    DOM.dockCdFill.style.transform = `scaleX(${ratio})`;
    const secStr = `${cooldownRemaining.toFixed(1)}s`;
    setText('cdTimer', DOM.cdTimer, secStr);
    setText('dockCd', DOM.dockCdTimer, secStr);
  }

  hudFlushAccum += Math.min(0.25, realDt);
  if (hudDirty && hudFlushAccum >= 0.1) {
    hudFlushAccum = 0;
    flushHUD();
  }

  requestAnimationFrame(gameLoop);
}

function exportSaveJson() {
  const payload = JSON.stringify({ ...state, exportedAt: Date.now() }, null, 2);
  try {
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtual_fisher_save_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (_) {}
  try { navigator.clipboard?.writeText(payload); } catch (_) {}
  showToast('📤 Exported save .json & copied to clipboard!', 'emerald');
}

function applyImportedJson(rawText) {
  try {
    const parsed = JSON.parse(rawText.trim());
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid');
    mergeState(parsed);
    saveGame(true);
    hudDirty = true;
    flushHUD();
    renderActiveTab();
    document.getElementById('import-json-panel').classList.add('hidden');
    document.getElementById('input-import-json').value = '';
    showToast('📥 Save imported successfully!', 'emerald');
  } catch (_) {
    showToast('Invalid save JSON format.', 'rose');
  }
}

// Navigation & Gameplay Listeners
document.querySelectorAll('#main-tabs .tab-btn').forEach(btn => {
  btn.onclick = () => {
    activeTab = btn.dataset.tab;
    renderActiveTab();
  };
});

DOM.castBtn.onclick = attemptManualCast;
DOM.dockCastBtn.onclick = attemptManualCast;
DOM.sellAllBtn.onclick = sellLivewell;
document.getElementById('dock-sell-btn').onclick = sellLivewell;
document.getElementById('btn-cycle-bait').onclick = cycleOwnedBait;
document.getElementById('dock-cycle-bait').onclick = cycleOwnedBait;

document.getElementById('btn-quick-crates').onclick = () => {
  activeTab = 'crates';
  renderActiveTab();
};

DOM.autoCastBtn.onclick = () => {
  state.autoCast = !state.autoCast;
  hudDirty = true;
  flushHUD();
};
DOM.autoSellBtn.onclick = () => {
  state.autoSell = !state.autoSell;
  if (state.autoSell && state.livewellValue > 0) sellLivewell();
  hudDirty = true;
  flushHUD();
};

// Prevent Spacebar from scrolling the page even when a button is focused
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    attemptManualCast();
  }
});

// Profile / Cloud Account Modal
document.getElementById('btn-open-account').onclick = () => {
  document.getElementById('input-display-name').value = state.displayName || 'Cosmic Angler';
  if (window.CloudSync) window.CloudSync.updateUI();
  document.getElementById('account-modal').classList.remove('hidden');
};
document.getElementById('btn-close-account').onclick = () => {
  document.getElementById('account-modal').classList.add('hidden');
};
document.getElementById('btn-save-name').onclick = () => {
  const v = document.getElementById('input-display-name').value.trim();
  if (v) state.displayName = v.slice(0, 22);
  if (window.CloudSync) window.CloudSync.updateUI();
  saveGame(true);
};
document.getElementById('btn-save-now').onclick = () => saveGame(true);
document.getElementById('btn-export-save').onclick = exportSaveJson;
document.getElementById('btn-import-save-toggle').onclick = () => {
  document.getElementById('import-json-panel').classList.toggle('hidden');
};
document.getElementById('btn-import-file-pick').onclick = () => {
  document.getElementById('input-import-file').click();
};
document.getElementById('input-import-file').onchange = e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => applyImportedJson(String(reader.result || ''));
  reader.readAsText(file);
  e.target.value = '';
};
document.getElementById('btn-import-json-apply').onclick = () => {
  applyImportedJson(document.getElementById('input-import-json').value);
};
document.getElementById('btn-hard-reset').onclick = () => {
  if (confirm('Wipe ALL progress and restart from Level 1?')) {
    localStorage.removeItem(LOCAL_SAVE_KEY);
    state = defaultState();
    generateQuests();
    saveGame(false);
    hudDirty = true;
    flushHUD();
    renderActiveTab();
    document.getElementById('account-modal').classList.add('hidden');
    showToast('🔄 Game reset to fresh start.', 'rose');
  }
};

// Periodic Tasks
setInterval(() => saveGame(false), 15000);
setInterval(refreshAffordability, 750);

// Boot + Offline Progress Catch-Up (up to 12 hours if Auto-Cast or Crew was active)
loadGame();
if (state.lastActiveAt && (state.autoCast || state.goldUpgrades.workers > 0)) {
  const offlineSec = (Date.now() - state.lastActiveAt) / 1000;
  if (offlineSec >= 10) {
    const snap = captureSnapshot();
    advanceSimulation(offlineSec, true);
    postBackgroundSummary(Math.min(43200, offlineSec), snap, 'Offline Progress');
  }
}
lastRealTime = Date.now();
initBackgroundWorker();
flushHUD();
renderActiveTab();
addFeed('🎣 Welcome to <span class="feed-strong">Virtual Fisher — Cosmic &amp; Multiverse Horizons</span>! Background &amp; Offline fishing enabled.', 'levelup');
requestAnimationFrame(gameLoop);
