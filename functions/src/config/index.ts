// ==============================================================================
// WEATHERGPT BACKEND CONFIGURATION & FIREBASE INITIALIZATION
// ==============================================================================

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Authoritatively load root .env.local (single local environment file)
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });
// 2. Fallback to standard root .env / cwd .env if present
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// Ensure Firebase Admin is initialized idempotently
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'weather-gpt-sih',
  });
}

export const db = admin.firestore();
export const auth = admin.auth();

// Configure Firestore settings
try {
  db.settings({
    ignoreUndefinedProperties: true,
  });
} catch {
  // Ignore if already set
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5001', 10),
  projectId: process.env.FIREBASE_PROJECT_ID || 'weather-gpt-sih',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
  version: '1.0.0-sih2026',
  corsOrigins: ['http://localhost:5173', 'http://localhost:3000', 'https://weathergpt.vercel.app'],
};

export const isFirestoreEnabled = (): boolean =>
  Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.GOOGLE_APPLICATION_CREDENTIALS || config.isProd);


