import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import { initializeFirestore, getFirestore, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress transient offline reconnection warnings from cluttering client console
try {
  setLogLevel('error');
} catch {
  // Ignore if already set or unsupported
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore properly, reusing instance across HMR and preventing re-initialization errors
let firestoreInstance: any;

const dbId = firebaseConfig.firestoreDatabaseId || undefined;
const globalObj = typeof window !== 'undefined' ? (window as any) : (globalThis as any);

if (globalObj.__firestoreInstance__) {
  firestoreInstance = globalObj.__firestoreInstance__;
} else {
  try {
    if (dbId) {
      firestoreInstance = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true
      }, dbId);
    } else {
      firestoreInstance = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true
      });
    }
    globalObj.__firestoreInstance__ = firestoreInstance;
  } catch (error: any) {
    if (error.code === 'failed-precondition' || error.message?.includes('already been initialized')) {
      firestoreInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
      globalObj.__firestoreInstance__ = firestoreInstance;
    } else {
      console.error('Critical Firestore Configuration Diagnostic Error:', error);
      throw error;
    }
  }
}

export const db = firestoreInstance;

// Standard Google Auth Provider (Non-sensitive scopes: email, profile, openid only)
// Note: Standard scopes allow any Google user to authenticate immediately without Google App Verification blocks.
const standardProvider = new GoogleAuthProvider();
standardProvider.setCustomParameters({
  prompt: 'select_account'
});

// Optional Google Drive Provider (Only used when explicitly requested)
const driveProvider = new GoogleAuthProvider();
driveProvider.addScope('https://www.googleapis.com/auth/drive.file');
driveProvider.setCustomParameters({
  prompt: 'select_account'
});

// Flag to track sign-in in-flight
let isSigningIn = false;

// IN-MEMORY ACCESS TOKEN CACHE (Mandatory rule: Never write to localStorage)
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, standardProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Lỗi đăng nhập Google SSO:', error);
    // User closed popup or cancelled
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      return null;
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const connectGoogleDrive = async (): Promise<string | null> => {
  try {
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      return cachedAccessToken;
    }
    return null;
  } catch (error: any) {
    console.error('Lỗi kết nối Google Drive:', error);
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
