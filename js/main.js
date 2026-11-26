/* ============================================================================
   MAIN ENTRYPOINT — GAME LOOP, CONTROLS, BACKUP & BOOT
   ============================================================================ */
function attemptManualCast() {
  if (cooldownRemaining <= 0) {
    performCast(false);
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
  const dt = Math.min(0.25, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  const totalCd = getCooldownSeconds();
  if (cooldownRemaining > 0) {
    cooldownRemaining = Math.max(0, cooldownRemaining - dt);
  }

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
    if (state.autoCast) {
      performCast(false);
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

  if (state.goldUpgrades.workers > 0) {
    workerAccumulator += dt;
    if (workerAccumulator >= 3.0) {
      workerAccumulator -= 3.0;
      performCast(true);
    }
  }

  for (const key of Object.keys(state.boostTimers)) {
    if (state.boostTimers[key] > 0) {
      state.boostTimers[key] = Math.max(0, state.boostTimers[key] - dt);
      hudDirty = true;
    }
  }

  hudFlushAccum += dt;
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
    saveGame(false);
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

document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    attemptManualCast();
  }
});

// Profile / Backup Modal
document.getElementById('btn-open-account').onclick = () => {
  document.getElementById('input-display-name').value = state.displayName || 'Cosmic Angler';
  document.getElementById('account-modal').classList.remove('hidden');
};
document.getElementById('btn-close-account').onclick = () => {
  document.getElementById('account-modal').classList.add('hidden');
};
document.getElementById('btn-save-name').onclick = () => {
  const v = document.getElementById('input-display-name').value.trim();
  if (v) state.displayName = v.slice(0, 22);
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

// Boot
loadGame();
flushHUD();
renderActiveTab();
addFeed('🎣 Welcome to <span class="feed-strong">Virtual Fisher — Cosmic &amp; Multiverse Horizons</span>! Modular multi-file build loaded.', 'levelup');
requestAnimationFrame(gameLoop);
