/* ============================================================================
   FIREBASE CLOUD SYNC — GUEST + GOOGLE LOGIN (SINGLE POPUP) + LEADERBOARD
   ============================================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-analytics.js";
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDgxl7OC7N3ycTiKwK2fEcXXM2Tl8skZ0Y",
  authDomain: "virtual-fishing-cosmic.firebaseapp.com",
  projectId: "virtual-fishing-cosmic",
  storageBucket: "virtual-fishing-cosmic.firebasestorage.app",
  messagingSenderId: "720230893474",
  appId: "1:720230893474:web:945c6347285343c47694fb",
  measurementId: "G-K8KZC2687R"
};

let auth = null;
let db = null;
let currentUser = null;
let cloudReady = false;
let authInProgress = false;
let loadedUid = null;
let leaderboardEntries = [];
let leaderboardStatus = 'local'; // 'local' | 'live' | 'error'
let unsubLeaderboard = null;

function setSyncStatus(text, dotColorClass) {
  const txt = document.getElementById('sync-text');
  const dot = document.getElementById('sync-dot');
  if (txt) txt.textContent = text;
  if (dot) dot.className = `w-2 h-2 rounded-full shrink-0 ${dotColorClass}`;
}

function updateAccountModalUI() {
  const s = window.getGameState ? window.getGameState() : {};
  const isGoogle = Boolean(currentUser && !currentUser.isAnonymous);
  const label = s.displayName || (isGoogle ? currentUser.displayName : 'Guest');

  const lblEl = document.getElementById('account-label');
  const avEl = document.getElementById('account-avatar');
  const typeEl = document.getElementById('modal-account-type');
  const uidEl = document.getElementById('modal-user-id');
  const googleBtn = document.getElementById('btn-modal-google');
  const signoutBtn = document.getElementById('btn-modal-signout');

  if (lblEl) lblEl.textContent = label;
  if (avEl) avEl.textContent = isGoogle ? '⭐' : '👤';
  if (typeEl) {
    typeEl.textContent = isGoogle
      ? `Google (${currentUser.email || 'Linked'})`
      : (cloudReady ? 'Guest Angler (Cloud)' : 'Guest Angler (Local Save)');
  }
  if (uidEl) uidEl.textContent = currentUser ? currentUser.uid : 'local-device-angler';
  if (googleBtn) googleBtn.classList.toggle('hidden', isGoogle);
  if (signoutBtn) signoutBtn.classList.toggle('hidden', !isGoogle);
}

function showAuthError(msg) {
  const box = document.getElementById('modal-auth-error');
  if (box) {
    box.textContent = msg;
    box.classList.remove('hidden');
  } else if (window.showToast) {
    window.showToast(msg, 'amber');
  }
}

function clearAuthError() {
  const box = document.getElementById('modal-auth-error');
  if (box) box.classList.add('hidden');
}

function subscribeLeaderboard() {
  if (!db || unsubLeaderboard) return;
  try {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'desc'),
      limit(50)
    );
    unsubLeaderboard = onSnapshot(
      q,
      (snapshot) => {
        leaderboardEntries = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
        leaderboardStatus = 'live';
        if (window.onLeaderboardUpdate) window.onLeaderboardUpdate();
      },
      (err) => {
        console.warn('Leaderboard subscription error:', err);
        leaderboardStatus = 'error';
        if (window.onLeaderboardUpdate) window.onLeaderboardUpdate();
      }
    );
  } catch (err) {
    console.warn('Leaderboard init error:', err);
    leaderboardStatus = 'error';
  }
}

async function saveToCloud(showFeedback = false) {
  if (!db || !currentUser || !cloudReady || !window.getGameState) {
    if (showFeedback && window.showToast) window.showToast('💾 Saved locally on this device.', 'emerald');
    return;
  }
  try {
    setSyncStatus('Saving...', 'bg-cyan-400');
    const s = window.getGameState();
    const now = Date.now();
    await setDoc(doc(db, 'users', currentUser.uid), { ...s, updatedAt: now }, { merge: true });

    const score = (s.prestige || 0) * 1000000 + (s.level || 1);
    const lbPayload = {
      uid: currentUser.uid,
      displayName: (s.displayName || (currentUser.displayName ? currentUser.displayName.slice(0, 22) : 'Cosmic Angler')),
      prestige: s.prestige || 0,
      level: s.level || 1,
      gold: Math.floor(s.gold || 0),
      totalCasts: s.totalCasts || 0,
      biome: s.biome || 'river',
      isGoogle: !currentUser.isAnonymous,
      score,
      updatedAt: now
    };
    try {
      await setDoc(doc(db, 'leaderboard', currentUser.uid), lbPayload, { merge: true });
    } catch (lbErr) {
      console.warn('Leaderboard write skipped (check rules):', lbErr);
    }

    setSyncStatus('Cloud Synced', 'bg-emerald-400');
    if (showFeedback && window.showToast) window.showToast('☁️ Progress & Rank synced to Cloud!', 'emerald');
  } catch (err) {
    console.error('Cloud save error:', err);
    setSyncStatus('Local Save Mode', 'bg-amber-400');
    if (showFeedback && window.showToast) {
      window.showToast(`Cloud save failed (${err.code || 'error'}) — saved locally.`, 'amber');
    }
  }
}

async function loadFromCloud(user, force = false) {
  if (!db || !user) return;
  if (!force && loadedUid === user.uid && cloudReady) {
    updateAccountModalUI();
    return;
  }

  // Pause cloud writes until this account's save is fully loaded
  cloudReady = false;
  loadedUid = user.uid;

  try {
    setSyncStatus('Loading save...', 'bg-cyan-400');
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const cloudData = snap.data();
      if (window.applyCloudState) window.applyCloudState(cloudData);
      cloudReady = true;
      setSyncStatus('Cloud Synced', 'bg-emerald-400');
    } else {
      // Brand-new account with no cloud save yet: migrate current local progress up to cloud
      const s = window.getGameState ? window.getGameState() : null;
      if (s && user.displayName && (!s.displayName || s.displayName === 'Cosmic Angler')) {
        s.displayName = user.displayName.slice(0, 22);
      }
      cloudReady = true;
      await saveToCloud(false);
    }
  } catch (err) {
    console.error('Cloud load error:', err);
    cloudReady = false;
    setSyncStatus('Local Save Mode', 'bg-amber-400');
    showAuthError(`Could not load cloud save (${err.code || err.message || 'unknown error'}).`);
  }

  updateAccountModalUI();
  subscribeLeaderboard();
}

async function handleGoogleSignIn() {
  if (authInProgress) return;
  clearAuthError();
  if (!auth) {
    showAuthError('Firebase Auth could not initialize (check internet connection).');
    return;
  }

  authInProgress = true;
  cloudReady = false; // Prevent 15s auto-save from writing Guest state during sign-in

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    // Use signInWithPopup directly (always 1 popup; loads existing save OR creates one if new)
    const res = await signInWithPopup(auth, provider);
    currentUser = res.user;
    await loadFromCloud(currentUser, true);
    if (window.showToast) {
      window.showToast(`✅ Signed in as ${currentUser.email || 'Google Angler'}!`, 'emerald');
    }
  } catch (err) {
    if (err.code === 'auth/popup-blocked') {
      try {
        if (window.showToast) window.showToast('Popup blocked — redirecting to Google Sign-In...', 'cyan');
        await signInWithRedirect(auth, provider);
        return;
      } catch (_) {}
    }
    let msg = `Google Sign-In failed (${err.code || 'cancelled'}). Your local save is still safe.`;
    if (err.code === 'auth/unauthorized-domain') {
      msg = 'Add "bigmango-dev.github.io" under Firebase Console → Authentication → Settings → Authorized domains.';
    } else if (err.code === 'auth/operation-not-allowed') {
      msg = 'Enable Google Sign-In under Firebase Console → Authentication → Sign-in method.';
    } else if (err.code === 'auth/popup-closed-by-user') {
      msg = 'Sign-in window was closed before completing login.';
    }
    showAuthError(msg);
    if (currentUser) cloudReady = true;
  } finally {
    authInProgress = false;
    updateAccountModalUI();
  }
}

async function handleSignOutToGuest() {
  clearAuthError();
  if (!auth) return;
  try {
    cloudReady = false;
    loadedUid = null;
    await signOut(auth);
    const res = await signInAnonymously(auth);
    currentUser = res.user;
    if (window.showToast) window.showToast('👤 Signed out — now playing as Guest.', 'cyan');
    await loadFromCloud(currentUser, true);
  } catch (err) {
    console.error('Sign out error:', err);
    showAuthError(`Could not sign out cleanly (${err.code || 'error'}). Try refreshing.`);
  }
}

window.CloudSync = {
  isReady: () => Boolean(cloudReady && db && currentUser),
  save: saveToCloud,
  updateUI: updateAccountModalUI,
  getUid: () => (currentUser ? currentUser.uid : 'local-me'),
  getLeaderboard: () => leaderboardEntries,
  getLeaderboardStatus: () => leaderboardStatus
};

async function initFirebaseCloud() {
  document.getElementById('btn-modal-google')?.addEventListener('click', handleGoogleSignIn);
  document.getElementById('btn-modal-signout')?.addEventListener('click', handleSignOutToGuest);

  try {
    const app = initializeApp(firebaseConfig);
    try { getAnalytics(app); } catch (_) {}
    auth = getAuth(app);
    db = getFirestore(app);

    try {
      const redirectRes = await getRedirectResult(auth);
      if (redirectRes && redirectRes.user) {
        currentUser = redirectRes.user;
        if (window.showToast) window.showToast('✅ Signed in with Google!', 'emerald');
      }
    } catch (_) {}

    onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      if (user) {
        if (!authInProgress) {
          await loadFromCloud(user, false);
        }
      } else {
        cloudReady = false;
        loadedUid = null;
        updateAccountModalUI();
      }
    });

    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (err) {
    console.warn('Firebase fallback to Local Save Mode:', err);
    cloudReady = false;
    setSyncStatus('Local Save Mode', 'bg-amber-400');
    updateAccountModalUI();
  }
}

initFirebaseCloud();
