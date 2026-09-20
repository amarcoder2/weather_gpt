// ==============================================================================
// FIREBASE WEB SDK BOUNDARY (Section 3)
// ==============================================================================

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'weather-gpt-sih.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'weather-gpt-sih',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'weather-gpt-sih.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = (): boolean => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  return Boolean(
    apiKey &&
    apiKey.trim() !== '' &&
    apiKey.startsWith('AIza') &&
    appId &&
    appId.trim() !== ''
  );
};

// Lazy & safe initialization preventing duplicate app crashes
let app: FirebaseApp;
if (!getApps().length) {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
  } else {
    // Unconfigured fallback initialization preventing client crash before .env.local is filled
    app = initializeApp({
      apiKey: 'UNCONFIGURED-PENDING-DOTENV-LOCAL',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'weather-gpt-sih',
      authDomain: 'weather-gpt-sih.firebaseapp.com',
    });
  }
} else {
  app = getApp();
}

export const firebaseApp = app;
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);

