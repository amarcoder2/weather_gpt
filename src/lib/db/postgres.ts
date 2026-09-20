import { Pool } from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DbUser } from '../../types/auth';

let pool: Pool | null = null;
let isInitialized = false;

// In-memory user cache
const memoryUsers = new Map<string, DbUser>();

// Persistent file storage path in os.tmpdir() (supported in Vercel Serverless / AWS Lambda)
const TMP_STORAGE_FILE = path.join(os.tmpdir(), 'weathergpt_users_store.json');

function readTmpStorage(): Record<string, DbUser> {
  try {
    if (fs.existsSync(TMP_STORAGE_FILE)) {
      const data = fs.readFileSync(TMP_STORAGE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // Non-fatal if read fails
  }
  return {};
}

function writeTmpStorage(store: Record<string, DbUser>): void {
  try {
    fs.writeFileSync(TMP_STORAGE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Non-fatal if write fails in restricted environment
  }
}

function saveTmpUser(user: DbUser): void {
  const key = user.email.toLowerCase().trim();
  memoryUsers.set(key, user);
  try {
    const store = readTmpStorage();
    store[key] = user;
    writeTmpStorage(store);
  } catch {
    // Non-fatal
  }
}

function getTmpUserByEmail(email: string): DbUser | null {
  const normalized = email.toLowerCase().trim();
  if (memoryUsers.has(normalized)) {
    return memoryUsers.get(normalized)!;
  }
  const store = readTmpStorage();
  if (store[normalized]) {
    const user = store[normalized];
    memoryUsers.set(normalized, user);
    return user;
  }
  return null;
}

function getTmpUserById(id: string): DbUser | null {
  for (const u of memoryUsers.values()) {
    if (u.id === id) return u;
  }
  const store = readTmpStorage();
  for (const u of Object.values(store)) {
    if (u.id === id) {
      memoryUsers.set(u.email.toLowerCase().trim(), u);
      return u;
    }
  }
  return null;
}

function getDbUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
}

export function getPool(): Pool | null {
  const dbUrl = getDbUrl();
  if (!dbUrl) return null;

  if (!pool) {
    const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    pool = new Pool({
      connectionString: dbUrl,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export async function initDatabase(): Promise<void> {
  if (isInitialized) return;

  const dbPool = getPool();

  if (dbPool) {
    try {
      // 1. Create users table if not exists with UNIQUE email and default role 'user'
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          location_name VARCHAR(255),
          location_updated_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Ensure columns exist if table was previously created with fewer columns
      await dbPool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS location_name VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;
      `);

      isInitialized = true;
      console.log('[PostgreSQL] Database schema initialized and validated successfully.');
      return;
    } catch (err) {
      console.warn('[PostgreSQL] Database schema initialization warning (resilient fallback active):', err);
    }
  } else {
    console.info(
      '[WeatherGPT DB] DATABASE_URL not detected in environment. Operating with resilient session storage.'
    );
  }

  isInitialized = true;
}

export const userRepository = {
  async findByEmail(email: string): Promise<DbUser | null> {
    await initDatabase();
    const normalized = email.toLowerCase().trim();
    const dbPool = getPool();

    if (dbPool) {
      try {
        const res = await dbPool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
        if (res.rows.length > 0) {
          const u = res.rows[0] as DbUser;
          memoryUsers.set(normalized, u);
          return u;
        }
        return null;
      } catch (err) {
        console.warn('[PostgreSQL] findByEmail query fallback to resilient store:', err);
      }
    }

    return getTmpUserByEmail(normalized);
  },

  async findById(id: string): Promise<DbUser | null> {
    await initDatabase();
    const dbPool = getPool();

    if (dbPool) {
      try {
        const res = await dbPool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
        if (res.rows.length > 0) {
          const u = res.rows[0] as DbUser;
          memoryUsers.set(u.email.toLowerCase().trim(), u);
          return u;
        }
        return null;
      } catch (err) {
        console.warn('[PostgreSQL] findById query fallback to resilient store:', err);
      }
    }

    return getTmpUserById(id);
  },

  async create(user: Omit<DbUser, 'created_at' | 'last_login'>): Promise<DbUser> {
    await initDatabase();
    const now = new Date().toISOString();
    const newUser: DbUser = {
      ...user,
      email: user.email.toLowerCase().trim(),
      created_at: now,
      last_login: now,
    };

    const dbPool = getPool();

    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO users (id, name, email, password_hash, role, latitude, longitude, location_name, location_updated_at, created_at, last_login)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            newUser.id,
            newUser.name,
            newUser.email,
            newUser.password_hash,
            newUser.role || 'user',
            newUser.latitude || null,
            newUser.longitude || null,
            newUser.location_name || null,
            newUser.location_updated_at || null,
            newUser.created_at,
            newUser.last_login,
          ]
        );
        saveTmpUser(newUser);
        return newUser;
      } catch (err) {
        console.warn('[PostgreSQL] create query fallback to resilient store:', err);
      }
    }

    saveTmpUser(newUser);
    return newUser;
  },

  async updateLastLogin(id: string): Promise<void> {
    await initDatabase();
    const now = new Date().toISOString();
    const dbPool = getPool();

    if (dbPool) {
      try {
        await dbPool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
      } catch (err) {
        console.warn('[PostgreSQL] updateLastLogin fallback to resilient store:', err);
      }
    }

    const u = getTmpUserById(id);
    if (u) {
      u.last_login = now;
      saveTmpUser(u);
    }
  },

  async updateLocation(
    id: string,
    locationData: {
      latitude: number;
      longitude: number;
      location_name: string;
      fallbackEmail?: string;
      fallbackName?: string;
      fallbackRole?: string;
    }
  ): Promise<DbUser | null> {
    await initDatabase();
    const now = new Date().toISOString();
    const dbPool = getPool();

    if (dbPool) {
      try {
        const res = await dbPool.query(
          `UPDATE users 
           SET latitude = $1, longitude = $2, location_name = $3, location_updated_at = NOW() 
           WHERE id = $4 RETURNING *`,
          [locationData.latitude, locationData.longitude, locationData.location_name, id]
        );
        if (res.rows.length > 0) {
          const updated = res.rows[0] as DbUser;
          saveTmpUser(updated);
          return updated;
        }
      } catch (err) {
        console.warn('[PostgreSQL] updateLocation fallback to resilient store:', err);
      }
    }

    let u = getTmpUserById(id);
    if (!u) {
      u = {
        id,
        name: locationData.fallbackName || 'WeatherGPT User',
        email: locationData.fallbackEmail || `user_${id}@weathergpt.gov.in`,
        password_hash: '',
        role: (locationData.fallbackRole as any) || 'user',
        created_at: now,
        last_login: now,
      };
    }

    u.latitude = locationData.latitude;
    u.longitude = locationData.longitude;
    u.location_name = locationData.location_name;
    u.location_updated_at = now;
    saveTmpUser(u);
    return u;
  },
};
