import { Pool } from 'pg';
import { DbUser } from '../../types/auth';
import { DbLocation, LocationSearchParams } from '../../types/location';
import { DEFAULT_LOCATIONS } from '../../config/constants';

let pool: Pool | null = null;
let isInitialized = false;

const isProduction = process.env.NODE_ENV === 'production';

// Development-only user store (STRICTLY disabled in production)
const devMemoryUsers = new Map<string, DbUser>();

function getDbUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
}

export function getPool(): Pool | null {
  const dbUrl = getDbUrl();

  if (!dbUrl) {
    if (isProduction) {
      throw new Error(
        'DATABASE_URL is not set in production. PostgreSQL connection is mandatory for production persistence.'
      );
    }
    return null;
  }

  if (!pool) {
    const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    const sslModeDisable = dbUrl.includes('sslmode=disable');
    pool = new Pool({
      connectionString: dbUrl,
      ssl: isLocalhost || sslModeDisable ? false : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool] Idle client error:', err instanceof Error ? err.message : 'Unknown');
    });
  }
  return pool;
}

export async function initDatabase(): Promise<void> {
  if (isInitialized) return;

  const dbUrl = getDbUrl();

  if (!dbUrl) {
    if (isProduction) {
      throw new Error(
        'DATABASE_URL is required in production environment. Refusing to operate with fallback storage.'
      );
    }
    console.warn(
      '[WeatherGPT DB Development] DATABASE_URL not detected. Operating with isolated in-memory development cache.'
    );
    isInitialized = true;
    return;
  }

  const dbPool = getPool();
  if (dbPool) {
    try {
      // Fast probe: check if users table already exists (single round-trip, no heavy DDL lock on cold start)
      const probe = await dbPool.query(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') AS exists"
      );

      const usersExist = Boolean(probe.rows[0]?.exists);

      if (usersExist) {
        isInitialized = true;
        // Lazy-trigger secure Super Admin bootstrap if configured in environment
        import('../auth/bootstrap')
          .then((mod) => mod.bootstrapSuperAdminAccount())
          .catch((err) => console.warn('[Security Bootstrap] Background trigger notice:', err?.message || err));
        return;
      }

      // Initial migration: Execute single statements individually for PgBouncer / pooler compatibility
      // 1. Create users table if not exists with UNIQUE email
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
        )
      `);

      // 2. Ensure supplementary columns exist on users (each statement executed separately)
      const supplementaryColumns = [
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION',
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION',
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS location_name VARCHAR(255)',
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE',
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE'",
      ];
      for (const alterSql of supplementaryColumns) {
        try {
          await dbPool.query(alterSql);
        } catch {
          // Column may already exist
        }
      }

      // 3. User performance indices (each statement executed separately)
      try {
        await dbPool.query('CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email))');
      } catch {}
      try {
        await dbPool.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)');
      } catch {}

      // 4. Provision nationwide locations catalog (single-statement execution)
      try {
        await dbPool.query(`
          CREATE TABLE IF NOT EXISTS locations (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            normalized_name VARCHAR(255) NOT NULL,
            state VARCHAR(150) NOT NULL,
            state_code VARCHAR(10),
            district VARCHAR(150) NOT NULL,
            district_code VARCHAR(20),
            locality_type VARCHAR(50) NOT NULL DEFAULT 'City',
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            country VARCHAR(10) DEFAULT 'IN',
            population BIGINT,
            elevation INTEGER,
            aliases TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            source VARCHAR(100) DEFAULT 'GeoNames-IN-CC-BY-4.0',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_locations_name_state_district UNIQUE (normalized_name, state, district)
          )
        `);
        await dbPool.query('CREATE INDEX IF NOT EXISTS idx_locations_normalized_name ON locations (normalized_name)');
        await dbPool.query('CREATE INDEX IF NOT EXISTS idx_locations_state ON locations (state)');
        await dbPool.query('CREATE INDEX IF NOT EXISTS idx_locations_district ON locations (district)');
        await dbPool.query('CREATE INDEX IF NOT EXISTS idx_locations_locality_type ON locations (locality_type)');
        await dbPool.query('CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations (latitude, longitude)');
      } catch (locErr) {
        console.warn('[PostgreSQL] Locations table init notice:', locErr instanceof Error ? locErr.message : 'Unknown');
      }

      // 5. Provision immutable administrative & security audit trail table
      try {
        await dbPool.query(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(64) PRIMARY KEY,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            actor_id VARCHAR(64),
            actor_email VARCHAR(255),
            actor_role VARCHAR(50),
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(100),
            resource_id VARCHAR(255),
            result VARCHAR(50) DEFAULT 'SUCCESS',
            details JSONB
          )
        `);
        await dbPool.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC)');
        await dbPool.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action)');
      } catch (audErr) {
        console.warn('[PostgreSQL] Audit log table init notice:', audErr instanceof Error ? audErr.message : 'Unknown');
      }

      isInitialized = true;
      console.log('[PostgreSQL] Database schema validated and active.');

      // Lazy-trigger secure Super Admin bootstrap if configured in environment
      import('../auth/bootstrap')
        .then((mod) => mod.bootstrapSuperAdminAccount())
        .catch((err) => console.warn('[Security Bootstrap] Background trigger notice:', err?.message || err));

      return;
    } catch (err) {
      console.error('[PostgreSQL] Database initialization notice:', err instanceof Error ? err.message : 'Unknown');
      // If users table is accessible, do not crash production
      try {
        const checkAfter = await dbPool.query(
          "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') AS exists"
        );
        if (checkAfter.rows[0]?.exists) {
          isInitialized = true;
          return;
        }
      } catch {
        // Fall through to error
      }
      if (isProduction) {
        throw new Error('Failed to initialize PostgreSQL database in production environment.');
      }
    }
  }

  isInitialized = true;
}

export const userRepository = {
  async findByEmail(email: string): Promise<DbUser | null> {
    await initDatabase();
    const normalized = email.toLowerCase().trim();
    const dbPool = getPool();

    if (dbPool) {
      const res = await dbPool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normalized]);
      if (res.rows.length > 0) {
        return res.rows[0] as DbUser;
      }
      return null;
    }

    if (isProduction) {
      throw new Error('Database service unavailable in production.');
    }

    // Development-only fallback
    return devMemoryUsers.get(normalized) || null;
  },

  async findById(id: string): Promise<DbUser | null> {
    await initDatabase();
    const dbPool = getPool();

    if (dbPool) {
      const res = await dbPool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      if (res.rows.length > 0) {
        return res.rows[0] as DbUser;
      }
      return null;
    }

    if (isProduction) {
      throw new Error('Database service unavailable in production.');
    }

    // Development-only fallback
    for (const user of devMemoryUsers.values()) {
      if (user.id === id) return user;
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

    if (dbPool) {
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
    }

    if (isProduction) {
      throw new Error('Cannot persist user: DATABASE_URL is not configured in production.');
    }

    // Development-only fallback
    devMemoryUsers.set(newUser.email, newUser);
    return newUser;
  },

  async updateLastLogin(id: string): Promise<void> {
    await initDatabase();
    const dbPool = getPool();

    if (dbPool) {
      await dbPool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
      return;
    }

    if (!isProduction) {
      for (const u of devMemoryUsers.values()) {
        if (u.id === id) {
          u.last_login = new Date().toISOString();
          break;
        }
      }
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
    const dbPool = getPool();

    if (dbPool) {
      const res = await dbPool.query(
        `UPDATE users
         SET latitude = $1, longitude = $2, location_name = $3, location_updated_at = NOW()
         WHERE id = $4 RETURNING *`,
        [locationData.latitude, locationData.longitude, locationData.location_name, id]
      );
      if (res.rows.length > 0) {
        return res.rows[0] as DbUser;
      }
      return null;
    }

    if (isProduction) {
      throw new Error('Cannot update location: DATABASE_URL is not configured in production.');
    }

    for (const u of devMemoryUsers.values()) {
      if (u.id === id) {
        u.latitude = locationData.latitude;
        u.longitude = locationData.longitude;
        u.location_name = locationData.location_name;
        u.location_updated_at = new Date().toISOString();
        return u;
      }
    }

    return null;
  },

  async updateRole(id: string, role: string): Promise<DbUser | null> {
    await initDatabase();
    const normalizedRole = role.toLowerCase().trim();
    const dbPool = getPool();

    if (dbPool) {
      const res = await dbPool.query(
        `UPDATE users SET role = $1 WHERE id = $2 RETURNING *`,
        [normalizedRole, id]
      );
      if (res.rows.length > 0) {
        return res.rows[0] as DbUser;
      }
      return null;
    }

    if (isProduction) {
      throw new Error('Cannot update user role: DATABASE_URL is not configured in production.');
    }

    for (const u of devMemoryUsers.values()) {
      if (u.id === id) {
        u.role = normalizedRole as any;
        return u;
      }
    }
    return null;
  },

  async updateStatus(id: string, status: string): Promise<DbUser | null> {
    await initDatabase();
    const normalizedStatus = status.toUpperCase().trim();
    const dbPool = getPool();

    if (dbPool) {
      try {
        await dbPool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';`);
        const res = await dbPool.query(
          `UPDATE users SET status = $1 WHERE id = $2 RETURNING *`,
          [normalizedStatus, id]
        );
        if (res.rows.length > 0) {
          return res.rows[0] as DbUser;
        }
      } catch {
        const check = await dbPool.query(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
        if (check.rows.length > 0) {
          return { ...check.rows[0], status: normalizedStatus } as DbUser;
        }
      }
      return null;
    }

    if (isProduction) {
      throw new Error('Cannot update user status: DATABASE_URL is not configured in production.');
    }

    for (const u of devMemoryUsers.values()) {
      if (u.id === id) {
        u.status = normalizedStatus;
        return u;
      }
    }
    return null;
  },

  async listUsers(params: {
    search?: string;
    role?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ users: Omit<DbUser, 'password_hash'>[]; total: number }> {
    await initDatabase();
    const limit = Math.min(Math.max(1, params.limit || 20), 100);
    const offset = Math.max(0, params.offset || 0);
    const dbPool = getPool();

    if (dbPool) {
      const conditions: string[] = [];
      const values: any[] = [];

      if (params.search?.trim()) {
        const q = params.search.trim().toLowerCase();
        values.push(`%${q}%`);
        conditions.push(`(LOWER(name) LIKE $${values.length} OR LOWER(email) LIKE $${values.length})`);
      }

      if (params.role?.trim()) {
        const r = params.role.trim().toLowerCase();
        values.push(r);
        conditions.push(`LOWER(role) = $${values.length}`);
      }

      if (params.status?.trim()) {
        const s = params.status.trim().toUpperCase();
        values.push(s);
        conditions.push(`UPPER(COALESCE(status, 'ACTIVE')) = $${values.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count query
      const countRes = await dbPool.query(`SELECT COUNT(*) as count FROM users ${whereClause}`, values);
      const total = parseInt(countRes.rows[0]?.count || '0', 10);

      // Data query with sanitized columns (STRICTLY omitting password_hash)
      values.push(limit);
      const limitIdx = values.length;
      values.push(offset);
      const offsetIdx = values.length;

      const sql = `
        SELECT id, name, email, role, COALESCE(status, 'ACTIVE') as status, latitude, longitude, location_name, location_updated_at, created_at, last_login
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;
      const res = await dbPool.query(sql, values);
      return {
        users: res.rows,
        total,
      };
    }

    // Fallback for development memory store
    let all = Array.from(devMemoryUsers.values());
    if (params.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      all = all.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (params.role?.trim()) {
      const r = params.role.trim().toLowerCase();
      all = all.filter((u) => (u.role || 'user').toLowerCase() === r);
    }
    if (params.status?.trim()) {
      const s = params.status.trim().toUpperCase();
      all = all.filter((u) => (u.status || 'ACTIVE').toUpperCase() === s);
    }
    const total = all.length;
    const paginated = all.slice(offset, offset + limit).map((u) => {
      const { password_hash, ...safe } = u;
      return safe;
    });
    return { users: paginated, total };
  },

  async countUsers(params?: { role?: string; status?: string }): Promise<number> {
    await initDatabase();
    const dbPool = getPool();
    if (dbPool) {
      const conditions: string[] = [];
      const values: any[] = [];
      if (params?.role?.trim()) {
        values.push(params.role.trim().toLowerCase());
        conditions.push(`LOWER(role) = $${values.length}`);
      }
      if (params?.status?.trim()) {
        values.push(params.status.trim().toUpperCase());
        conditions.push(`UPPER(COALESCE(status, 'ACTIVE')) = $${values.length}`);
      }
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const res = await dbPool.query(`SELECT COUNT(*) as count FROM users ${whereClause}`, values);
      return parseInt(res.rows[0]?.count || '0', 10);
    }
    return devMemoryUsers.size;
  },

  async countSuperAdmins(): Promise<number> {
    await initDatabase();
    const dbPool = getPool();
    if (dbPool) {
      const res = await dbPool.query(
        "SELECT COUNT(*) as count FROM users WHERE LOWER(role) = 'super_admin' AND (status IS NULL OR UPPER(status) = 'ACTIVE')"
      );
      return parseInt(res.rows[0]?.count || '0', 10);
    }
    return Array.from(devMemoryUsers.values()).filter(
      (u) => (u.role || '').toLowerCase() === 'super_admin' && (u.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
    ).length;
  },

  async deleteUser(id: string): Promise<boolean> {
    await initDatabase();
    const dbPool = getPool();
    if (dbPool) {
      const res = await dbPool.query('DELETE FROM users WHERE id = $1', [id]);
      return (res.rowCount ?? 0) > 0;
    }
    for (const [email, u] of devMemoryUsers.entries()) {
      if (u.id === id) {
        devMemoryUsers.delete(email);
        return true;
      }
    }
    return false;
  },
};

export interface DbAuditLog {
  id: string;
  timestamp: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  result: string;
  details?: Record<string, unknown> | null;
}

const devMemoryAuditLogs: DbAuditLog[] = [];

export const auditRepository = {
  async record(entry: {
    actorId?: string | null;
    actorEmail?: string | null;
    actorRole?: string | null;
    action: string;
    resourceType?: string | null;
    resourceId?: string | null;
    result?: string;
    details?: Record<string, unknown> | null;
  }): Promise<DbAuditLog> {
    await initDatabase();
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const logItem: DbAuditLog = {
      id,
      timestamp: now,
      actor_id: entry.actorId || null,
      actor_email: entry.actorEmail || null,
      actor_role: entry.actorRole || null,
      action: entry.action,
      resource_type: entry.resourceType || null,
      resource_id: entry.resourceId || null,
      result: entry.result || 'SUCCESS',
      details: entry.details || null,
    };

    const dbPool = getPool();
    if (dbPool) {
      try {
        await dbPool.query(
          `INSERT INTO audit_logs (id, timestamp, actor_id, actor_email, actor_role, action, resource_type, resource_id, result, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            logItem.id,
            logItem.timestamp,
            logItem.actor_id,
            logItem.actor_email,
            logItem.actor_role,
            logItem.action,
            logItem.resource_type,
            logItem.resource_id,
            logItem.result,
            logItem.details ? JSON.stringify(logItem.details) : null,
          ]
        );
      } catch (err) {
        console.error('[Audit] Failed to persist audit log entry:', err);
      }
    } else {
      devMemoryAuditLogs.unshift(logItem);
      if (devMemoryAuditLogs.length > 500) devMemoryAuditLogs.pop();
    }
    return logItem;
  },

  async list(limit = 50): Promise<DbAuditLog[]> {
    await initDatabase();
    const dbPool = getPool();
    const safeLimit = Math.min(Math.max(1, limit), 100);

    if (dbPool) {
      try {
        const res = await dbPool.query(
          `SELECT id, timestamp, actor_id, actor_email, actor_role, action, resource_type, resource_id, result, details
           FROM audit_logs
           ORDER BY timestamp DESC
           LIMIT $1`,
          [safeLimit]
        );
        return res.rows as DbAuditLog[];
      } catch (err) {
        console.error('[Audit] Failed to fetch audit logs:', err);
        return [];
      }
    }

    return devMemoryAuditLogs.slice(0, safeLimit);
  },
};

export const locationRepository = {
  async search(params: LocationSearchParams = {}): Promise<DbLocation[]> {
    await initDatabase();
    const dbPool = getPool();

    const limit = Math.min(Math.max(1, params.limit || 20), 100);
    const offset = Math.max(0, params.offset || 0);

    if (dbPool) {
      const conditions: string[] = ['is_active = TRUE'];
      const values: any[] = [];

      let queryParamIndex: number | null = null;
      if (params.query?.trim()) {
        const q = params.query
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();
        values.push(q);
        queryParamIndex = values.length;
        conditions.push(`(
          normalized_name LIKE '%' || $${queryParamIndex} || '%' OR
          LOWER(district) LIKE '%' || $${queryParamIndex} || '%' OR
          LOWER(state) LIKE '%' || $${queryParamIndex} || '%' OR
          (aliases IS NOT NULL AND LOWER(aliases) LIKE '%' || $${queryParamIndex} || '%')
        )`);
      }

      if (params.state?.trim()) {
        values.push(params.state.trim().toLowerCase());
        const sIdx = values.length;
        conditions.push(`(LOWER(state) = $${sIdx} OR LOWER(state_code) = $${sIdx})`);
      }

      if (params.district?.trim()) {
        const normDist = params.district
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();
        values.push(normDist);
        const dIdx = values.length;
        conditions.push(`(LOWER(district) = $${dIdx} OR LOWER(district) LIKE '%' || $${dIdx} || '%')`);
      }

      if (params.localityType?.trim()) {
        values.push(params.localityType.trim().toLowerCase());
        const lIdx = values.length;
        conditions.push(`LOWER(locality_type) = $${lIdx}`);
      }

      values.push(limit);
      const limitIdx = values.length;
      values.push(offset);
      const offsetIdx = values.length;

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      let orderByClause = 'COALESCE(population, 0) DESC, name ASC';
      if (queryParamIndex !== null) {
        orderByClause = `
          CASE
            WHEN normalized_name = $${queryParamIndex} THEN 0
            WHEN normalized_name LIKE $${queryParamIndex} || '%' THEN 1
            ELSE 2
          END,
          COALESCE(population, 0) DESC,
          name ASC
        `;
      }

      const sql = `
        SELECT * FROM locations
        ${whereClause}
        ORDER BY ${orderByClause}
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const res = await dbPool.query(sql, values);
      return res.rows as DbLocation[];
    }

    // In-memory development fallback using DEFAULT_LOCATIONS
    const q = params.query?.toLowerCase().trim() || '';
    return DEFAULT_LOCATIONS.filter((loc) => {
      if (!q) return true;
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q)
      );
    })
      .slice(offset, offset + limit)
      .map((loc) => ({
        id: loc.id,
        name: loc.name,
        normalized_name: loc.name.toLowerCase(),
        state: loc.state,
        state_code: null,
        district: loc.district,
        district_code: null,
        locality_type: 'City',
        latitude: loc.lat,
        longitude: loc.lon,
        country: 'IN',
        population: null,
        elevation: loc.elevationMeters || null,
        aliases: null,
        is_active: true,
        source: 'Default-Fallback',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
  },

  async findById(id: string): Promise<DbLocation | null> {
    await initDatabase();
    const dbPool = getPool();

    if (dbPool) {
      const res = await dbPool.query('SELECT * FROM locations WHERE id = $1 LIMIT 1', [id]);
      if (res.rows.length > 0) {
        return res.rows[0] as DbLocation;
      }
      return null;
    }

    const fallback = DEFAULT_LOCATIONS.find((l) => l.id.toLowerCase() === id.toLowerCase());
    if (fallback) {
      return {
        id: fallback.id,
        name: fallback.name,
        normalized_name: fallback.name.toLowerCase(),
        state: fallback.state,
        state_code: null,
        district: fallback.district,
        district_code: null,
        locality_type: 'City',
        latitude: fallback.lat,
        longitude: fallback.lon,
        country: 'IN',
        population: null,
        elevation: fallback.elevationMeters || null,
        aliases: null,
        is_active: true,
        source: 'Default-Fallback',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return null;
  },

  async getStats(): Promise<{
    total: number;
    states: number;
    districts: number;
    cities: number;
    towns: number;
    source: string;
  }> {
    await initDatabase();
    const dbPool = getPool();

    if (dbPool) {
      const res = await dbPool.query(`
        SELECT
          COUNT(*) as total,
          COUNT(DISTINCT state) as states,
          COUNT(DISTINCT district) as districts,
          COUNT(CASE WHEN locality_type LIKE '%Capital%' OR locality_type LIKE '%City%' THEN 1 END) as cities,
          COUNT(CASE WHEN locality_type LIKE '%Town%' OR locality_type LIKE '%Headquarters%' THEN 1 END) as towns
        FROM locations
      `);
      const row = res.rows[0];
      return {
        total: parseInt(row.total, 10) || 0,
        states: parseInt(row.states, 10) || 0,
        districts: parseInt(row.districts, 10) || 0,
        cities: parseInt(row.cities, 10) || 0,
        towns: parseInt(row.towns, 10) || 0,
        source: 'GeoNames-IN-CC-BY-4.0',
      };
    }

    return {
      total: DEFAULT_LOCATIONS.length,
      states: 6,
      districts: 6,
      cities: 6,
      towns: 0,
      source: 'Default-Fallback',
    };
  },
};
