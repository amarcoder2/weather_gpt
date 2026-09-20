// ==============================================================================
// FIRESTORE CLIENT HELPERS (Section 3 & 10)
// ==============================================================================

import { collection, doc, getDoc, getDocs, query, where, limit } from 'firebase/firestore';
import { firestore } from './firebase';

export const collections = {
  users: collection(firestore, 'users'),
  locations: collection(firestore, 'locations'),
  weatherObservations: collection(firestore, 'weatherObservations'),
  forecasts: collection(firestore, 'forecasts'),
  alerts: collection(firestore, 'alerts'),
  disasters: collection(firestore, 'disasters'),
  riskAssessments: collection(firestore, 'riskAssessments'),
  chatSessions: collection(firestore, 'chatSessions'),
  auditLogs: collection(firestore, 'auditLogs'),
};

export const fetchActiveAlerts = async () => {
  try {
    const q = query(collections.alerts, where('status', '==', 'ACTIVE'), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
};

export const fetchUserProfile = async (uid: string) => {
  try {
    const snap = await getDoc(doc(firestore, 'users', uid));
    if (snap.exists()) {
      return { uid: snap.id, ...snap.data() };
    }
    return null;
  } catch {
    return null;
  }
};
