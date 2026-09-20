import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { DbUser } from '../../types/auth';

let pool: Pool | null = null;
let isInitialized = false;

// In-memory fallback repository when DATABASE_URL is not set (e.g. local dev before DB provisioning)
const memoryUsers = new Map<string, DbUser>();

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

  const isProduction = process.env.NODE_ENV === 'production';
  const dbPool = getPool();

  if (isProduction && !dbPool) {
    throw new Error(
      '[Production Configuration Error] DATABASE_URL is required in production environment. In-memory database fallback is disabled in production.'
    );
  }

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
      if (isProduction) {
        throw new Error(
          `[Production Database Error] Failed to initialize PostgreSQL schema: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
      console.warn('[PostgreSQL] Development connection issue, operating with fallback:', err);
    }
  }

  // Development/Test fallback only - no hardcoded demo accounts seeded on startup
  isInitialized = true;
}

export const userRepository = {
  async findByEmail(email: string): Promise<DbUser | null> {
    await initDatabase();
    const normalized = email.toLowerCase().trim();
    const dbPool = getPool();
    const isProduction = process.env.NODE_ENV === 'production';

    if (dbPool) {
      try {
        const res = await dbPool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
        if (res.rows.length > 0) {
          return res.rows[0] as DbUser;
        }
        return null;
      } catch (err) {
        if (isProduction) {
          throw new Error(`[Database Error] Failed to find user by email: ${err instanceof Error ? err.message : String(err)}`);
        }
        console.warn('[PostgreSQL] findByEmail query fallback:', err);
      }
    } else if (isProduction) {
      throw new Error('[Production Configuration Error] DATABASE_URL is required in production.');
    }

    return memoryUsers.get(normalized) || null;
  },

  async findById(id: string): Promise<DbUser | null> {
    await initDatabase();
    const dbPool = getPool();
    const isProduction = process.env.NODE_ENV === 'production';

    if (dbPool) {
      try {
        const res = await dbPool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
        if (res.rows.length > 0) {
          return res.rows[0] as DbUser;
        }
        return null;
      } catch (err) {
        if (isProduction) {
          throw new Error(`[Database Error] Failed to find user by ID: ${err instanceof Error ? err.message : String(err)}`);
        }
        console.warn('[PostgreSQL] findById query fallback:', err);
      }
    } else if (isProduction) {
      throw new Error('[Production Configuration Error] DATABASE_URL is required in production.');
    }

    for (const u of memoryUsers.values()) {
      if (u.id === id) return u;
    }
    return null;
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
    const isProduction = process.env.NODE_ENV === 'production';

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
        return newUser;
      } catch (err) {
        if (isProduction) {
          throw new Error(`[Database Error] Failed to create user: ${err instanceof Error ? err.message : String(err)}`);
        }
        console.warn('[PostgreSQL] create query fallback:', err);
      }
    } else if (isProduction) {
      throw new Error('[Production Configuration Error] DATABASE_URL is required in production.');
    }

    memoryUsers.set(newUser.email, newUser);
    return newUser;
  },

  async updateLastLogin(id: string): Promise<void> {
    await initDatabase();
    const now = new Date().toISOString();
    const dbPool = getPool();
    const isProduction = process.env.NODE_ENV === 'production';

    if (dbPool) {
      try {
        await dbPool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
        return;
      } catch (err) {
        if (isProduction) {
          throw new Error(`[Database Error] Failed to update last login: ${err instanceof Error ? err.message : String(err)}`);
        }
        console.warn('[PostgreSQL] updateLastLogin fallback:', err);
      }
    } else if (isProduction) {
      throw new Error('[Production Configuration Error] DATABASE_URL is required in production.');
    }

    for (const u of memoryUsers.values()) {
      if (u.id === id) {
        u.last_login = now;
        break;
      }
    }
  },

  async updateLocation(
    id: string,
    locationData: { latitude: number; longitude: number; location_name: string }
  ): Promise<DbUser | null> {
    await initDatabase();
    const now = new Date().toISOString();
    const dbPool = getPool();
    const isProduction = process.env.NODE_ENV === 'production';

    if (dbPool) {
      try {
        const res = await dbPool.query(
          `UPDATE users 
           SET latitude = $1, longitude = $2, location_name = $3, location_updated_at = NOW() 
           WHERE id = $4 RETURNING *`,
          [locationData.latitude, locationData.longitude, locationData.location_name, id]
        );
        if (res.rows.length > 0) {
          return res.rows[0] as DbUser;
        }
      } catch (err) {
        if (isProduction) {
          throw new Error(`[Database Error] Failed to update location: ${err instanceof Error ? err.message : String(err)}`);
        }
        console.warn('[PostgreSQL] updateLocation fallback:', err);
      }
    } else if (isProduction) {
      throw new Error('[Production Configuration Error] DATABASE_URL is required in production.');
    }

    for (const u of memoryUsers.values()) {
      if (u.id === id) {
        u.latitude = locationData.latitude;
        u.longitude = locationData.longitude;
        u.location_name = locationData.location_name;
        u.location_updated_at = now;
        return u;
      }
    }
    return null;
  },
};
