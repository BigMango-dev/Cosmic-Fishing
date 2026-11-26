/* ============================================================================
   FIREBASE CLOUD SYNC — GUEST (ANONYMOUS) + GOOGLE SIGN-IN + FIRESTORE SAVE
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
  linkWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
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

async function saveToCloud(showFeedback = false) {
  if (!db || !currentUser || !window.getGameState) {
    if (showFeedback && window.showToast) window.showToast('💾 Saved locally on this device.', 'emerald');
    return;
  }
  try {
    setSyncStatus('Saving...', 'bg-cyan-400');
    const data = { ...window.getGameState(), updatedAt: Date.now() };
    await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true });
    setSyncStatus('Cloud Synced', 'bg-emerald-400');
    if (showFeedback && window.showToast) window.showToast('☁️ Progress synced to Cloud!', 'emerald');
  } catch (err) {
    console.error('Cloud save error:', err);
    setSyncStatus('Local Save Mode', 'bg-amber-400');
    if (showFeedback && window.showToast) {
      window.showToast('Cloud unavailable — saved locally.', 'amber');
    }
  }
}

async function loadFromCloud(user) {
  if (!db || !user) return;
  try {
    setSyncStatus('Syncing...', 'bg-cyan-400');
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const cloudData = snap.data();
      if (window.applyCloudState) window.applyCloudState(cloudData);
    } else {
      // First time for this UID: upload current local progress so nothing is lost
      await saveToCloud(false);
    }
    setSyncStatus('Cloud Synced', 'bg-emerald-400');
  } catch (err) {
    console.error('Cloud load error:', err);
    setSyncStatus('Local Save Mode', 'bg-amber-400');
  }
  updateAccountModalUI();
}

async function handleGoogleSignIn() {
  clearAuthError();
  if (!auth) {
    showAuthError('Firebase Auth could not initialize (check internet connection).');
    return;
  }
  const provider = new GoogleAuthProvider();
  try {
    if (currentUser && currentUser.isAnonymous) {
      try {
        const res = await linkWithPopup(currentUser, provider);
        currentUser = res.user;
        const s = window.getGameState();
        if (currentUser.displayName && (!s.displayName || s.displayName === 'Cosmic Angler')) {
          s.displayName = currentUser.displayName.slice(0, 22);
        }
        await saveToCloud(false);
        if (window.showToast) window.showToast('🔗 Guest save linked to Google!', 'emerald');
      } catch (linkErr) {
        if (linkErr.code === 'auth/credential-already-in-use') {
          const res = await signInWithPopup(auth, provider);
          currentUser = res.user;
          await loadFromCloud(currentUser);
          if (window.showToast) window.showToast('✅ Signed into existing Google save!', 'emerald');
        } else {
          throw linkErr;
        }
      }
    } else {
      const res = await signInWithPopup(auth, provider);
      currentUser = res.user;
      await loadFromCloud(currentUser);
      if (window.showToast) window.showToast('✅ Signed in with Google!', 'emerald');
    }
    updateAccountModalUI();
  } catch (err) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
      try {
        if (window.showToast) window.showToast('Redirecting to Google Sign-In...', 'cyan');
        await signInWithRedirect(auth, provider);
        return;
      } catch (_) {}
    }
    let msg = 'Google Sign-In was closed or blocked. Your local/guest save is still safe.';
    if (err.code === 'auth/unauthorized-domain') {
      msg = 'Add "bigmango-dev.github.io" under Firebase Console → Authentication → Settings → Authorized domains.';
    } else if (err.code === 'auth/operation-not-allowed') {
      msg = 'Enable Google Sign-In under Firebase Console → Authentication → Sign-in method.';
    }
    showAuthError(msg);
  }
}

async function handleSignOutToGuest() {
  clearAuthError();
  if (!auth) return;
  try {
    await signOut(auth);
    const res = await signInAnonymously(auth);
    currentUser = res.user;
    if (window.showToast) window.showToast('👤 Signed out — now playing as Guest.', 'cyan');
    updateAccountModalUI();
  } catch (err) {
    console.error('Sign out error:', err);
    showAuthError('Could not sign out cleanly. Try refreshing the page.');
  }
}

// Expose global bridge for main.js / engine.js
window.CloudSync = {
  isReady: () => Boolean(cloudReady && db && currentUser),
  save: saveToCloud,
  updateUI: updateAccountModalUI
};

async function initFirebaseCloud() {
  document.getElementById('btn-modal-google')?.addEventListener('click', handleGoogleSignIn);
  document.getElementById('btn-modal-signout')?.addEventListener('click', handleSignOutToGuest);

  try {
    const app = initializeApp(firebaseConfig);
    try { getAnalytics(app); } catch (_) {}
    auth = getAuth(app);
    db = getFirestore(app);

    // Handle returning from mobile Google redirect login
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
        cloudReady = true;
        await loadFromCloud(user);
      } else {
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
