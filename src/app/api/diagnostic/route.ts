import { NextResponse } from 'next/server';
import { getPool, userRepository } from '@/lib/db/postgres';
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

  // Test 2: Schema verification
  let schemaResult: {
    usersTableExists: boolean;
    columns: string[];
    missingColumns: string[];
    userCount: number;
  } = {
    usersTableExists: false,
    columns: [],
    missingColumns: [],
    userCount: 0,
  };

  // Test 3: Operations (findByEmail, bcrypt, dry-run INSERT)
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

      // Check users table existence
      const tableCheck = await pool.query(
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') AS exists"
      );
      const exists = Boolean(tableCheck.rows[0]?.exists);
      schemaResult.usersTableExists = exists;

      if (exists) {
        // Inspect columns
        const colCheck = await pool.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
        );
        const presentCols = colCheck.rows.map((r: { column_name: string }) => r.column_name);
        schemaResult.columns = presentCols;

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
        schemaResult.missingColumns = expectedCols.filter((col) => !presentCols.includes(col));

        // Count users
        const countRes = await pool.query('SELECT COUNT(*) as count FROM users');
        schemaResult.userCount = parseInt(countRes.rows[0]?.count || '0', 10);
      }
    } catch (connErr: unknown) {
      const err = connErr as { name?: string; code?: string; message?: string };
      connectivityResult = {
        success: false,
        errorName: err.name || 'ConnectionError',
        errorCode: err.code || 'UNKNOWN',
        errorMessage: err.message || 'Failed to connect to PostgreSQL',
      };
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
    if (connectivityResult.success && schemaResult.usersTableExists) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const probeId = `probe_${Date.now()}`;
        const probeEmail = `probe_${Date.now()}@diagnostic.test`;
        const testRes = await client.query(
          `INSERT INTO users (id, name, email, password_hash, role, created_at, last_login)
           VALUES ($1, $2, $3, $4, 'user', NOW(), NOW()) RETURNING id`,
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
    operationsResult.findByEmailSuccess &&
    operationsResult.dryRunInsertSuccess &&
    operationsResult.bcryptHashSuccess;

  return NextResponse.json(
    {
      status: overallHealth ? 'HEALTHY' : 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      environment: envAudit,
      databaseUrlSafeInfo: dbSafeInfo,
      connectivity: connectivityResult,
      schema: schemaResult,
      operations: operationsResult,
      recommendation: !dbSafeInfo.configured
        ? 'Configure DATABASE_URL with a cloud PostgreSQL connection string in Vercel Project Settings.'
        : dbSafeInfo.isLocalhost
        ? 'DATABASE_URL in Vercel points to 127.0.0.1/localhost. Update DATABASE_URL in Vercel to a cloud PostgreSQL database.'
        : !connectivityResult.success
        ? `Database connection failed (${connectivityResult.errorCode}). Check database credentials and network access.`
        : schemaResult.missingColumns.length > 0
        ? `Users table missing columns: ${schemaResult.missingColumns.join(', ')}. Schema migration required.`
        : !operationsResult.dryRunInsertSuccess
        ? `INSERT failed: ${operationsResult.dryRunInsertError}. Check user table permissions.`
        : 'All database and auth subsystems operational.',
    },
    { status: overallHealth ? 200 : 503 }
  );
}
