// ==============================================================================
// FIREBASE AUTHENTICATION CLIENT WRAPPERS (Section 3 & 6)
// ==============================================================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

const googleProvider = new GoogleAuthProvider();

export const loginWithEmail = async (email: string, pass: string): Promise<UserCredential> => {
  if (!isFirebaseConfigured()) {
    console.info('Running in offline/demo mode; simulating authentication.');
  }
  return signInWithEmailAndPassword(auth, email, pass);
};

export const registerWithEmail = async (email: string, pass: string): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, pass);
};

export const loginWithGoogle = async (): Promise<UserCredential> => {
  return signInWithPopup(auth, googleProvider);
};

export const logoutUser = async (): Promise<void> => {
  return signOut(auth);
};

export const getCurrentIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
