import { NextResponse } from 'next/server';
import { getPool, initDatabase, userRepository } from '@/lib/db/postgres';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isProduction = process.env.NODE_ENV === 'production';
  const rawDbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  // Safe analysis of DB URL (ZERO secrets, ZERO passwords)
  let dbSafeInfo: {
    configured: boolean;
    isLocalhost: boolean;
    protocol?: string;
    hostname?: string;
    port?: string;
    database?: string;
    hasSslQuery?: boolean;
    resolvedSource?: string;
  } = {
    configured: Boolean(rawDbUrl),
    isLocalhost: false,
  };

  if (rawDbUrl) {
    try {
      const parsed = new URL(rawDbUrl);
      const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      dbSafeInfo = {
        configured: true,
        isLocalhost: isLocal,
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || '5432',
        database: parsed.pathname.replace(/^\//, ''),
        hasSslQuery: parsed.searchParams.has('sslmode'),
        resolvedSource: process.env.DATABASE_URL
          ? 'DATABASE_URL'
          : process.env.POSTGRES_URL
          ? 'POSTGRES_URL'
          : 'POSTGRES_PRISMA_URL',
      };
    } catch {
      dbSafeInfo = {
        configured: true,
        isLocalhost: rawDbUrl.includes('localhost') || rawDbUrl.includes('127.0.0.1'),
        resolvedSource: 'MALFORMED_URL',
      };
    }
  }

  // Safe environment audit (Only CONFIGURED / MISSING)
  const envAudit = {
    NODE_ENV: process.env.NODE_ENV || 'unknown',
    DATABASE_URL: process.env.DATABASE_URL ? 'CONFIGURED' : 'MISSING',
    POSTGRES_URL: process.env.POSTGRES_URL ? 'CONFIGURED' : 'MISSING',
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? 'CONFIGURED' : 'MISSING',
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY ? 'CONFIGURED' : 'MISSING',
    ADMIN_BOOTSTRAP_PASSWORD: process.env.ADMIN_BOOTSTRAP_PASSWORD ? 'CONFIGURED' : 'MISSING',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || process.env.DEMO_ADMIN_PASSWORD ? 'CONFIGURED' : 'MISSING',
  };

  // Test 1: Connectivity
  let connectivityResult: {
    success: boolean;
    errorName?: string;
    errorCode?: string;
    errorMessage?: string;
    serverTime?: string;
    serverVersion?: string;
  } = { success: false };

  // Test 2: Database Initialization / Migration
  let initDbResult: {
    attempted: boolean;
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
  } = { attempted: false, success: false };

  // Test 3: Schema verification
  let schemaResult: {
    usersTableExists: boolean;
    columns: string[];
    missingColumns: string[];
    userCount: number;
    locationsTableExists?: boolean;
    auditLogsTableExists?: boolean;
  } = {
    usersTableExists: false,
    columns: [],
    missingColumns: [],
    userCount: 0,
  };

  // Test 4: Operations (findByEmail, bcrypt, dry-run INSERT)
  let operationsResult: {
    findByEmailSuccess: boolean;
    findByEmailError?: string;
    bcryptHashSuccess: boolean;
    dryRunInsertSuccess: boolean;
    dryRunInsertError?: string;
  } = {
    findByEmailSuccess: false,
    bcryptHashSuccess: false,
    dryRunInsertSuccess: false,
  };

  let pool = null;
  try {
    pool = getPool();
  } catch (poolErr: unknown) {
    const err = poolErr as { name?: string; code?: string; message?: string };
    connectivityResult = {
      success: false,
      errorName: err.name || 'GetPoolError',
      errorCode: err.code || 'POOL_ERROR',
      errorMessage: err.message || 'getPool() threw an error',
    };
  }

  if (pool) {
    try {
      const pingRes = await pool.query('SELECT NOW() AS server_time, version() AS server_version');
      connectivityResult = {
        success: true,
        serverTime: pingRes.rows[0]?.server_time,
        serverVersion: String(pingRes.rows[0]?.server_version || '').split(',')[0],
      };
    } catch (connErr: unknown) {
      const err = connErr as { name?: string; code?: string; message?: string };
      connectivityResult = {
        success: false,
        errorName: err.name || 'ConnectionError',
        errorCode: err.code || 'UNKNOWN',
        errorMessage: err.message || 'Failed to connect to PostgreSQL',
      };
    }

    // Explicitly run schema initialization if connected
    if (connectivityResult.success) {
      initDbResult.attempted = true;
      try {
        await initDatabase();
        initDbResult.success = true;
      } catch (initErr: unknown) {
        const err = initErr as { code?: string; message?: string };
        initDbResult.success = false;
        initDbResult.errorCode = err.code || 'INIT_ERROR';
        initDbResult.errorMessage = err.message || 'Database initialization threw an error';
      }

      // Check users, locations, and audit_logs tables existence
      try {
        const tableCheck = await pool.query(`
          SELECT
            (to_regclass('users') IS NOT NULL OR EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')) AS users_exist,
            (to_regclass('locations') IS NOT NULL OR EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations')) AS locations_exist,
            (to_regclass('audit_logs') IS NOT NULL OR EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')) AS audit_logs_exist
        `);
        const usersExist = Boolean(tableCheck.rows[0]?.users_exist);
        schemaResult.usersTableExists = usersExist;
        schemaResult.locationsTableExists = Boolean(tableCheck.rows[0]?.locations_exist);
        schemaResult.auditLogsTableExists = Boolean(tableCheck.rows[0]?.audit_logs_exist);

        const expectedCols = [
          'id',
          'name',
          'email',
          'password_hash',
          'role',
          'latitude',
          'longitude',
          'location_name',
          'location_updated_at',
          'status',
          'created_at',
          'last_login',
        ];

        if (usersExist) {
          // Inspect columns
          const colCheck = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
          );
          const presentCols = colCheck.rows.map((r: { column_name: string }) => r.column_name);
          schemaResult.columns = presentCols;
          schemaResult.missingColumns = expectedCols.filter((col) => !presentCols.includes(col));

          // Count users
          const countRes = await pool.query('SELECT COUNT(*) as count FROM users');
          schemaResult.userCount = parseInt(countRes.rows[0]?.count || '0', 10);
        } else {
          schemaResult.missingColumns = expectedCols;
        }
      } catch (schemaErr: unknown) {
        const err = schemaErr as { code?: string; message?: string };
        console.error('[Diagnostic Probe] Schema probe error:', err.message);
      }

      // Operations test: findByEmail
      try {
        await userRepository.findByEmail('probe_diagnostic_test@weathergpt.gov.in');
        operationsResult.findByEmailSuccess = true;
      } catch (findErr: unknown) {
        operationsResult.findByEmailSuccess = false;
        operationsResult.findByEmailError = findErr instanceof Error ? findErr.message : String(findErr);
      }

      // Operations test: dry-run INSERT in transaction with rollback
      if (schemaResult.usersTableExists) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const probeId = `probe_${Date.now()}`;
          const probeEmail = `probe_${Date.now()}@diagnostic.test`;
          const testRes = await client.query(
            `INSERT INTO users (id, name, email, password_hash, role, status, created_at, last_login)
             VALUES ($1, $2, $3, $4, 'user', 'ACTIVE', NOW(), NOW()) RETURNING id`,
            [probeId, 'Diagnostic Probe', probeEmail, 'test_hash']
          );
          operationsResult.dryRunInsertSuccess = Boolean(testRes.rows[0]?.id);
          await client.query('ROLLBACK');
        } catch (insErr: unknown) {
          await client.query('ROLLBACK').catch(() => {});
          const err = insErr as { code?: string; message?: string };
          operationsResult.dryRunInsertSuccess = false;
          operationsResult.dryRunInsertError = `${err.code || 'ERROR'}: ${err.message || 'Insert failed'}`;
        } finally {
          client.release();
        }
      } else {
        operationsResult.dryRunInsertSuccess = false;
        operationsResult.dryRunInsertError = 'Skipped: users table does not exist';
      }
    }
  } else if (!connectivityResult.errorMessage) {
    connectivityResult = {
      success: false,
      errorName: 'PoolUnavailable',
      errorCode: 'NO_POOL',
      errorMessage: isProduction ? 'DATABASE_URL is not set or pool could not be initialized in production' : 'In-memory dev mode',
    };
  }

  // Test bcrypt
  try {
    const hash = await bcrypt.hash('test_probe', 10);
    operationsResult.bcryptHashSuccess = Boolean(hash && hash.startsWith('$2'));
  } catch {
    operationsResult.bcryptHashSuccess = false;
  }

  const overallHealth =
    connectivityResult.success &&
    schemaResult.usersTableExists &&
    schemaResult.missingColumns.length === 0 &&
    operationsResult.findByEmailSuccess &&
    operationsResult.dryRunInsertSuccess &&
    operationsResult.bcryptHashSuccess;

  let recommendation = 'All database and auth subsystems operational.';
  if (!dbSafeInfo.configured) {
    recommendation = 'Configure DATABASE_URL with a cloud PostgreSQL connection string in Vercel Project Settings.';
  } else if (dbSafeInfo.isLocalhost && isProduction) {
    recommendation = 'DATABASE_URL in Vercel points to 127.0.0.1/localhost. Update DATABASE_URL in Vercel to a cloud PostgreSQL database.';
  } else if (!connectivityResult.success) {
    recommendation = `Database connection failed (${connectivityResult.errorCode || 'UNKNOWN'}: ${connectivityResult.errorMessage || 'Failed to connect'}). Check database credentials and network access.`;
  } else if (initDbResult.attempted && !initDbResult.success) {
    recommendation = `Database schema migration failed (${initDbResult.errorCode || 'INIT_ERROR'}: ${initDbResult.errorMessage}). Check user DDL permissions.`;
  } else if (!schemaResult.usersTableExists) {
    recommendation = 'Users table does not exist. Check PostgreSQL user permissions to execute CREATE TABLE.';
  } else if (schemaResult.missingColumns.length > 0) {
    recommendation = `Users table missing columns: ${schemaResult.missingColumns.join(', ')}. Schema migration required.`;
  } else if (!operationsResult.findByEmailSuccess) {
    recommendation = `SELECT probe failed: ${operationsResult.findByEmailError}. Check table read permissions.`;
  } else if (!operationsResult.dryRunInsertSuccess) {
    recommendation = `INSERT failed: ${operationsResult.dryRunInsertError}. Check user table permissions and constraints.`;
  } else if (!operationsResult.bcryptHashSuccess) {
    recommendation = 'bcrypt hashing failed. Check bcryptjs runtime compatibility.';
  }

  return NextResponse.json(
    {
      status: overallHealth ? 'HEALTHY' : 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      environment: envAudit,
      databaseUrlSafeInfo: dbSafeInfo,
      connectivity: connectivityResult,
      initialization: initDbResult,
      schema: schemaResult,
      operations: operationsResult,
      recommendation,
    },
    { status: overallHealth ? 200 : 503 }
  );
}
