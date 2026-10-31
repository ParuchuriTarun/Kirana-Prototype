import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from 'firebase/auth';

// Read configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    (firebaseConfig.authDomain || firebaseConfig.projectId)
  );
};

// Initialize Firebase App singleton safely
let app;
let auth;
let googleProvider;

try {
  if (isFirebaseConfigured()) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  }
} catch (err) {
  console.warn('[Firebase] Initialization notice:', err);
}

export { app, auth, googleProvider };

/**
 * Trigger Firebase Google Sign-In Popup
 * Returns Firebase UserCredential or throws error
 */
export async function loginWithGoogleFirebase() {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_CONFIG_MISSING');
  }

  if (!auth || !googleProvider) {
    if (!app) app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  }

  return await signInWithPopup(auth, googleProvider);
}

/**
 * Handle redirect result if using redirect flow on mobile
 */
export async function getGoogleRedirectUser() {
  if (!auth) return null;
  try {
    return await getRedirectResult(auth);
  } catch (err) {
    console.warn('[Firebase] Redirect result check error:', err);
    return null;
  }
}
