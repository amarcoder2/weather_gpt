// ==============================================================================
// USER REPOSITORY (Section 10 & 11)
// ==============================================================================

import { db, config } from '../config';
import { UserProfile } from '../types';
import { ROLES, Role } from '../constants';
import { logger } from '../logging/logger';

export class UserRepository {
  private collection = db.collection('users');

  // In-memory fallback cache for development/demo resiliency
  private memoryUsers = new Map<string, UserProfile>();

  constructor() {
    this.seedDefaultUsers();
  }

  private seedDefaultUsers(): void {
    const defaultSuperAdmin: UserProfile = {
      uid: 'demo_super_admin_user',
      displayName: 'SIH MoES Super Admin',
      email: 'superadmin@weathergpt.gov.in',
      role: ROLES.SUPER_ADMIN,
      preferredLanguage: 'en',
      savedLocationIds: ['delhi', 'mumbai', 'bhubaneswar'],
      notificationPreferences: {
        severeWeather: true,
        heavyRain: true,
        cycloneAlert: true,
        floodWarning: true,
        heatwaveAlert: true,
        dailyForecastDigest: true,
      },
      voicePreferences: { enabled: true, language: 'en-IN', speed: 1.0 },
      createdAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    const defaultAdmin: UserProfile = {
      uid: 'demo_admin_user',
      displayName: 'IMD Station Officer',
      email: 'admin@weathergpt.gov.in',
      role: ROLES.ADMIN,
      preferredLanguage: 'en',
      savedLocationIds: ['delhi', 'kolkata'],
      notificationPreferences: {
        severeWeather: true,
        heavyRain: true,
        cycloneAlert: true,
        floodWarning: true,
        heatwaveAlert: true,
        dailyForecastDigest: false,
      },
      voicePreferences: { enabled: true, language: 'hi-IN', speed: 1.0 },
      createdAt: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    const defaultAnalyst: UserProfile = {
      uid: 'demo_analyst_user',
      displayName: 'Disaster Risk Analyst',
      email: 'analyst@weathergpt.gov.in',
      role: ROLES.ANALYST,
      preferredLanguage: 'en',
      savedLocationIds: ['bhubaneswar', 'portblair'],
      notificationPreferences: {
        severeWeather: true,
        heavyRain: true,
        cycloneAlert: true,
        floodWarning: true,
        heatwaveAlert: true,
        dailyForecastDigest: true,
      },
      voicePreferences: { enabled: false, language: 'en-IN', speed: 1.0 },
      createdAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    const defaultUser: UserProfile = {
      uid: 'demo_user',
      displayName: 'Rahul Sharma (Citizen)',
      email: 'rahul.citizen@example.com',
      role: ROLES.USER,
      preferredLanguage: 'hi',
      preferredLocationId: 'delhi',
      savedLocationIds: ['delhi'],
      notificationPreferences: {
        severeWeather: true,
        heavyRain: true,
        cycloneAlert: true,
        floodWarning: true,
        heatwaveAlert: true,
        dailyForecastDigest: true,
      },
      voicePreferences: { enabled: true, language: 'hi-IN', speed: 1.0 },
      createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    this.memoryUsers.set(defaultSuperAdmin.uid, defaultSuperAdmin);
    this.memoryUsers.set(defaultAdmin.uid, defaultAdmin);
    this.memoryUsers.set(defaultAnalyst.uid, defaultAnalyst);
    this.memoryUsers.set(defaultUser.uid, defaultUser);
  }

  async getById(uid: string): Promise<UserProfile | null> {
    if (process.env.FIRESTORE_EMULATOR_HOST || process.env.GOOGLE_APPLICATION_CREDENTIALS || config.isProd) {
      try {
        const doc = await this.collection.doc(uid).get();
        if (doc.exists) {
          return doc.data() as UserProfile;
        }
      } catch {
        logger.debug('Firestore read failed or offline; using memory fallback', {
          service: 'UserRepository',
          userId: uid,
        });
      }
    }
    return this.memoryUsers.get(uid) || null;
  }

  async upsert(user: UserProfile): Promise<void> {
    this.memoryUsers.set(user.uid, user);
    if (process.env.FIRESTORE_EMULATOR_HOST || process.env.GOOGLE_APPLICATION_CREDENTIALS || config.isProd) {
      try {
        await this.collection.doc(user.uid).set(user, { merge: true });
      } catch {
        logger.debug('Firestore write failed or offline; saved in memory', {
          service: 'UserRepository',
          userId: user.uid,
        });
      }
    }
  }

  async updateRole(uid: string, newRole: Role): Promise<UserProfile | null> {
    const existing = await this.getById(uid);
    if (!existing) return null;

    const updated: UserProfile = {
      ...existing,
      role: newRole,
      updatedAt: new Date().toISOString(),
    };
    await this.upsert(updated);
    return updated;
  }

  async updateStatus(uid: string, status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED'): Promise<UserProfile | null> {
    const existing = await this.getById(uid);
    if (!existing) return null;

    const updated: UserProfile = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };
    await this.upsert(updated);
    return updated;
  }

  async listUsers(options?: { role?: string; status?: string; limit?: number; offset?: number }): Promise<{ users: UserProfile[]; total: number }> {
    let all = Array.from(this.memoryUsers.values());

    if (options?.role) {
      all = all.filter((u) => u.role === options.role);
    }
    if (options?.status) {
      all = all.filter((u) => u.status === options.status);
    }

    const total = all.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;

    return {
      users: all.slice(offset, offset + limit),
      total,
    };
  }
}

export const userRepository = new UserRepository();
