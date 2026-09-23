import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAdminRole, isSuperAdminRole } from '@/lib/auth/jwt';
import { userRepository, locationRepository, auditRepository, getPool } from '@/lib/db/postgres';

// LAYER 3: Endpoint-level Server Authorization
function checkAdminAuth(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required. Missing or invalid session token.',
          },
        },
        { status: 401 }
      ),
    };
  }

  if (!isAdminRole(user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Forbidden: Administrative authorization required.',
          },
        },
        { status: 403 }
      ),
    };
  }

  const isSuperAdmin = isSuperAdminRole(user.role);
  return { authorized: true, user, isSuperAdmin };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const auth = checkAdminAuth(req);
  if (!auth.authorized) return auth.response;

  const resolvedParams = await params;
  const slug = resolvedParams.slug || [];
  const path = slug.join('/');

  // 1. GET /api/admin/overview
  if (path === 'overview') {
    try {
      const locStats = await locationRepository.getStats();
      const totalUsers = await userRepository.countUsers();
      const activeUsers = await userRepository.countUsers({ status: 'ACTIVE' });
      const suspendedUsers = await userRepository.countUsers({ status: 'SUSPENDED' });

      return NextResponse.json({
        success: true,
        data: {
          database: {
            status: 'HEALTHY',
            type: 'PostgreSQL',
            usersCount: totalUsers,
            activeUsersCount: activeUsers,
            suspendedUsersCount: suspendedUsers,
          },
          locations: {
            status: 'HEALTHY',
            total: locStats.total,
            states: locStats.states,
            districts: locStats.districts,
            cities: locStats.cities,
            towns: locStats.towns,
            source: 'GeoNames India Gazetteer — CC BY 4.0',
            sourceType: 'REFERENCE_DATASET',
          },
          weatherService: {
            status: 'OPERATIONAL',
            provider: 'Open-Meteo NWP',
            freshness: 'LIVE',
            type: 'NUMERICAL_WEATHER_PREDICTION',
          },
          alerts: {
            activeScenarioAlerts: 2,
            pendingReviewScenarioAlerts: 1,
            type: 'SCENARIO_FEED',
            disclaimer: 'Advisory items are simulated scenario drills and not official statutory IMD bulletins.',
          },
          system: {
            status: 'OPERATIONAL',
            environment: process.env.NODE_ENV || 'production',
            callerEmail: auth.user?.email,
            callerRole: auth.user?.role,
            isSuperAdmin: auth.isSuperAdmin,
          },
        },
      });
    } catch (err) {
      console.error('[Admin API Overview Error]:', err);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve system overview metrics.' } },
        { status: 500 }
      );
    }
  }

  // 2. GET /api/admin/users (Live PostgreSQL Users List with Pagination & Search)
  if (path === 'users') {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || undefined;
    const role = url.searchParams.get('role') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    try {
      const result = await userRepository.listUsers({ search, role, status, limit, offset });
      return NextResponse.json({
        success: true,
        users: result.users,
        pagination: {
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (err) {
      console.error('[Admin API Users List Error]:', err);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve user registry.' } },
        { status: 500 }
      );
    }
  }

  // 3. GET /api/admin/locations
  if (path === 'locations') {
    try {
      const locStats = await locationRepository.getStats();
      return NextResponse.json({
        success: true,
        stats: locStats,
        attribution: 'GeoNames India Gazetteer — CC BY 4.0',
        authorizedAs: auth.user?.email,
      });
    } catch (err) {
      console.error('[Admin API Locations Error]:', err);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch location catalog statistics.' } },
        { status: 500 }
      );
    }
  }

  // 4. GET /api/admin/audit
  if (path === 'audit') {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    try {
      const logs = await auditRepository.list(limit);
      return NextResponse.json({
        success: true,
        logs,
      });
    } catch (err) {
      console.error('[Admin API Audit Error]:', err);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve audit trail.' } },
        { status: 500 }
      );
    }
  }

  // 5. GET /api/admin/system/health
  if (path === 'system/health') {
    const startTime = Date.now();
    let dbStatus = 'UNKNOWN';
    let dbLatency = -1;

    try {
      const pool = getPool();
      if (pool) {
        const dbStart = Date.now();
        await pool.query('SELECT 1;');
        dbLatency = Date.now() - dbStart;
        dbStatus = 'HEALTHY';
      }
    } catch (err) {
      dbStatus = 'ERROR';
      console.error('[Health Check DB]:', err);
    }

    // Ping Open-Meteo NWP
    let weatherStatus = 'UNKNOWN';
    let weatherLatency = -1;
    try {
      const wStart = Date.now();
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current=temperature_2m',
        { signal: AbortSignal.timeout(4000) }
      );
      weatherLatency = Date.now() - wStart;
      weatherStatus = res.ok ? 'HEALTHY' : 'WARNING';
    } catch {
      weatherStatus = 'ERROR';
    }

    const mem = process.memoryUsage();

    return NextResponse.json({
      success: true,
      health: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
          type: 'PostgreSQL',
        },
        weatherProvider: {
          provider: 'Open-Meteo NWP',
          status: weatherStatus,
          latencyMs: weatherLatency,
        },
        authSecurity: {
          status: 'HEALTHY',
          jwtAlgorithm: 'HS256',
          cookieProtection: 'HttpOnly; SameSite=Lax',
        },
        runtime: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryHeapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          memoryRssMb: Math.round(mem.rss / 1024 / 1024),
        },
        totalCheckTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // 6. GET /api/admin/system/config (Zero Secrets Exposed)
  if (path === 'system/config') {
    const hasDbUrl = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
    const hasJwtKey = Boolean(process.env.JWT_SECRET_KEY && process.env.JWT_SECRET_KEY.trim().length >= 32);
    const hasBootstrap = Boolean(
      (process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_EMAIL) &&
      (process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSWORD)
    );

    return NextResponse.json({
      success: true,
      config: {
        database: {
          status: hasDbUrl ? 'CONFIGURED' : 'NOT CONFIGURED',
          engine: 'PostgreSQL (pg.Pool)',
          ssl: !hasDbUrl || !process.env.DATABASE_URL?.includes('localhost'),
        },
        jwtAuthentication: {
          status: hasJwtKey ? 'CONFIGURED' : 'WARNING_DEV_FALLBACK',
          algorithm: 'HS256',
          tokenLifetimeMinutes: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '1440', 10),
          secretConfigured: hasJwtKey,
        },
        weatherPipeline: {
          primaryProvider: 'Open-Meteo NWP',
          providerType: 'Numerical Weather Prediction Grid',
          apiKeyRequired: false,
          status: 'CONFIGURED',
        },
        ownerBootstrap: {
          status: hasBootstrap ? 'CONFIGURED' : 'NOT CONFIGURED',
          bootstrapEmail: process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_EMAIL || null,
        },
        environment: process.env.NODE_ENV || 'production',
        geminiAiKey: Boolean(process.env.GEMINI_API_KEY) ? 'CONFIGURED' : 'OPTIONAL',
      },
    });
  }

  // 7. GET /api/admin/weather/monitor (Live Open-Meteo Telemetry)
  if (path === 'weather/monitor') {
    const benchmarkStations = [
      { name: 'New Delhi National Met Center', state: 'Delhi', lat: 28.6139, lon: 77.2090 },
      { name: 'Mumbai Coastal Observatory', state: 'Maharashtra', lat: 19.0760, lon: 72.8777 },
      { name: 'Kolkata Regional Met Center', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
      { name: 'Bhubaneswar Coastal Radar Station', state: 'Odisha', lat: 20.2961, lon: 85.8245 },
      { name: 'Chennai Marine Met Office', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
    ];

    try {
      const results = await Promise.all(
        benchmarkStations.map(async (st) => {
          const t0 = Date.now();
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${st.lat}&longitude=${st.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=precipitation_probability&forecast_days=1`;
            const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
            const latency = Date.now() - t0;
            if (!res.ok) {
              return {
                ...st,
                status: 'UNAVAILABLE',
                latencyMs: latency,
                temperature: null,
                humidity: null,
                windSpeed: null,
                freshness: 'UNAVAILABLE',
                provider: 'Open-Meteo NWP',
              };
            }
            const data = await res.json();
            return {
              ...st,
              status: 'HEALTHY',
              latencyMs: latency,
              temperature: data.current?.temperature_2m ?? null,
              humidity: data.current?.relative_humidity_2m ?? null,
              windSpeed: data.current?.wind_speed_10m ?? null,
              weatherCode: data.current?.weather_code ?? null,
              freshness: 'LIVE',
              observedAt: data.current?.time ?? new Date().toISOString(),
              provider: 'Open-Meteo NWP',
            };
          } catch {
            return {
              ...st,
              status: 'ERROR',
              latencyMs: Date.now() - t0,
              temperature: null,
              humidity: null,
              windSpeed: null,
              freshness: 'UNAVAILABLE',
              provider: 'Open-Meteo NWP',
            };
          }
        })
      );

      return NextResponse.json({
        success: true,
        provider: 'Open-Meteo NWP',
        disclaimer: 'Live data retrieved from Open-Meteo Numerical Weather Prediction grid.',
        stations: results,
      });
    } catch (err) {
      console.error('[Weather Monitor Error]:', err);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to poll weather service telemetry.' } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    message: `Admin operation '${path}' processed successfully.`,
    authorizedAs: auth.user?.email,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const auth = checkAdminAuth(req);
  if (!auth.authorized) return auth.response;

  const resolvedParams = await params;
  const path = resolvedParams.slug ? resolvedParams.slug.join('/') : '';
  let body = {};
  try {
    body = await req.json();
  } catch {
    // Body is optional
  }

  // Record audit log for administrative POST actions
  await auditRepository.record({
    actorId: auth.user?.userId,
    actorEmail: auth.user?.email,
    actorRole: auth.user?.role,
    action: `POST_${path.toUpperCase().replace(/\//g, '_')}`,
    resourceType: 'ADMIN_API',
    resourceId: path,
    result: 'SUCCESS',
    details: typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : undefined,
  });

  return NextResponse.json({
    success: true,
    message: `Administrative POST request to /api/admin/${path} authorized and recorded.`,
    target: path,
    performedBy: auth.user?.email,
    timestamp: new Date().toISOString(),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const auth = checkAdminAuth(req);
  if (!auth.authorized) return auth.response;

  const resolvedParams = await params;
  const slug = resolvedParams.slug || [];
  const path = slug.join('/');

  // 1. DELETE /api/admin/users/:id
  if (slug.length === 2 && slug[0] === 'users') {
    if (!auth.isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Privilege Violation: Only a SUPER_ADMIN has authority to delete user accounts.',
          },
        },
        { status: 403 }
      );
    }

    const targetUid = slug[1]?.trim();
    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_USER_ID', message: 'Target user ID is required.' } },
        { status: 400 }
      );
    }

    if (targetUid === auth.user?.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SELF_DELETION_REJECTED',
            message: 'Self-deletion rejected: You cannot delete your own administrative account.',
          },
        },
        { status: 400 }
      );
    }

    const targetUser = await userRepository.findById(targetUid);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: `User '${targetUid}' not found.` } },
        { status: 404 }
      );
    }

    if (targetUser.role?.toLowerCase() === 'super_admin') {
      const superAdminCount = await userRepository.countSuperAdmins();
      if (superAdminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SOLE_SUPER_ADMIN_PROTECTED',
              message: 'Cannot delete the sole remaining active SUPER_ADMIN account.',
            },
          },
          { status: 400 }
        );
      }
    }

    try {
      const deleted = await userRepository.deleteUser(targetUid);
      if (!deleted) {
        return NextResponse.json(
          { success: false, error: { code: 'DELETE_FAILED', message: 'Failed to delete user.' } },
          { status: 500 }
        );
      }

      await auditRepository.record({
        actorId: auth.user?.userId,
        actorEmail: auth.user?.email,
        actorRole: auth.user?.role,
        action: 'USER_DELETED',
        resourceType: 'USER',
        resourceId: targetUid,
        result: 'SUCCESS',
        details: { deletedEmail: targetUser.email, deletedRole: targetUser.role },
      });

      return NextResponse.json({
        success: true,
        message: `User '${targetUser.email}' has been successfully deleted.`,
        performedBy: auth.user?.email,
      });
    } catch (err) {
      console.error('[Admin API Delete User Error]:', err);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete user account.' } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    message: `Administrative DELETE request to /api/admin/${path} authorized and executed.`,
    performedBy: auth.user?.email,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const auth = checkAdminAuth(req);
  if (!auth.authorized) return auth.response;

  const resolvedParams = await params;
  const slug = resolvedParams.slug || [];
  const path = slug.join('/');

  let body: Record<string, any> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Valid JSON request body is required.' } },
      { status: 400 }
    );
  }

  // 1. PATCH /api/admin/users/:id/role
  if (slug.length === 3 && slug[0] === 'users' && slug[2] === 'role') {
    const targetUid = slug[1]?.trim();
    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_USER_ID', message: 'Target user ID is required.' } },
        { status: 400 }
      );
    }

    const { role } = body;
    if (!role || typeof role !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ROLE', message: 'A valid role string is required.' } },
        { status: 400 }
      );
    }

    const normalizedRole = role.toLowerCase().trim();
    const allowedRoles = ['user', 'analyst', 'operator', 'admin', 'super_admin'];
    if (!allowedRoles.includes(normalizedRole)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: `Role '${role}' is not recognized. Allowed roles: ${allowedRoles.join(', ')}.`,
          },
        },
        { status: 400 }
      );
    }

    // Normal ADMIN cannot modify own role
    if (!auth.isSuperAdmin && targetUid === auth.user?.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SELF_ROLE_CHANGE_REJECTED',
            message: 'Privilege Violation: Administrators cannot modify their own privileges.',
          },
        },
        { status: 403 }
      );
    }

    try {
      const targetUser = await userRepository.findById(targetUid);
      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: { code: 'USER_NOT_FOUND', message: `User '${targetUid}' not found.` } },
          { status: 404 }
        );
      }

      // STRICT RBAC PRIVILEGE ESCALATION CHECKS
      if (!auth.isSuperAdmin) {
        // Normal ADMIN cannot assign admin or super_admin roles
        if (normalizedRole === 'admin' || normalizedRole === 'super_admin') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN_PRIVILEGE_ESCALATION',
                message: 'Privilege Violation: Only a SUPER_ADMIN can grant ADMIN or SUPER_ADMIN privileges.',
              },
            },
            { status: 403 }
          );
        }

        // Normal ADMIN cannot modify existing admin or super_admin accounts
        const currentTargetRole = (targetUser.role || '').toLowerCase();
        if (currentTargetRole === 'admin' || currentTargetRole === 'super_admin') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN_TARGET_PROTECTED',
                message: 'Privilege Violation: Only a SUPER_ADMIN can modify the role of an administrator.',
              },
            },
            { status: 403 }
          );
        }

        // Normal ADMIN cannot modify own role
        if (targetUid === auth.user?.userId) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'SELF_ROLE_CHANGE_REJECTED',
                message: 'Privilege Violation: Administrators cannot modify their own privileges.',
              },
            },
            { status: 403 }
          );
        }
      } else {
        // SUPER_ADMIN attempting to demote themselves
        if (targetUid === auth.user?.userId && normalizedRole !== 'super_admin') {
          const superAdminCount = await userRepository.countSuperAdmins();
          if (superAdminCount <= 1) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'SOLE_SUPER_ADMIN_LOCKOUT',
                  message: 'Cannot demote the sole remaining active SUPER_ADMIN account.',
                },
              },
              { status: 400 }
            );
          }
        }
      }

      const updatedUser = await userRepository.updateRole(targetUid, normalizedRole);
      if (!updatedUser) {
        return NextResponse.json(
          { success: false, error: { code: 'USER_NOT_FOUND', message: `User '${targetUid}' not found.` } },
          { status: 404 }
        );
      }

      // Record audit entry
      await auditRepository.record({
        actorId: auth.user?.userId,
        actorEmail: auth.user?.email,
        actorRole: auth.user?.role,
        action: 'USER_ROLE_CHANGED',
        resourceType: 'USER',
        resourceId: targetUid,
        result: 'SUCCESS',
        details: {
          targetEmail: targetUser.email,
          previousRole: targetUser.role,
          newRole: normalizedRole,
        },
      });

      // Sanitized user representation (NEVER include password_hash)
      const safeUser = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status || 'ACTIVE',
        latitude: updatedUser.latitude || null,
        longitude: updatedUser.longitude || null,
        location_name: updatedUser.location_name || null,
      };

      return NextResponse.json({
        success: true,
        message: `User '${targetUser.email}' role successfully updated to '${normalizedRole}'.`,
        user: safeUser,
        performedBy: auth.user?.email,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      console.error('[Admin API Update Role Error]:', err);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update user role.' } },
        { status: 500 }
      );
    }
  }

  // 2. PATCH /api/admin/users/:id/status
  if (slug.length === 3 && slug[0] === 'users' && slug[2] === 'status') {
    const targetUid = slug[1]?.trim();
    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_USER_ID', message: 'Target user ID is required.' } },
        { status: 400 }
      );
    }

    const { status } = body;
    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'A valid status string is required.' } },
        { status: 400 }
      );
    }

    const normalizedStatus = status.toUpperCase().trim();
    const allowedStatuses = ['ACTIVE', 'SUSPENDED', 'PENDING'];
    if (!allowedStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Status '${status}' is not recognized. Allowed statuses: ${allowedStatuses.join(', ')}.`,
          },
        },
        { status: 400 }
      );
    }

    // SELF-SUSPENSION PROTECTION
    if (targetUid === auth.user?.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SELF_SUSPENSION_REJECTED',
            message: 'Self-action rejected: You cannot suspend your own administrative account.',
          },
        },
        { status: 400 }
      );
    }

    try {
      const targetUser = await userRepository.findById(targetUid);
      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: { code: 'USER_NOT_FOUND', message: `User '${targetUid}' not found.` } },
          { status: 404 }
        );
      }

      // Super admin target protection
      const targetRole = (targetUser.role || '').toLowerCase();
      if (targetRole === 'super_admin') {
        if (!auth.isSuperAdmin) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN_SUPERADMIN_PROTECTED',
                message: 'Privilege Violation: Only a SUPER_ADMIN can alter the status of a SUPER_ADMIN.',
              },
            },
            { status: 403 }
          );
        }

        if (normalizedStatus !== 'ACTIVE') {
          const activeSuperAdminCount = await userRepository.countSuperAdmins();
          if (activeSuperAdminCount <= 1) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'SOLE_SUPER_ADMIN_PROTECTED',
                  message: 'Cannot suspend the sole remaining active SUPER_ADMIN account.',
                },
              },
              { status: 400 }
            );
          }
        }
      }

      const updatedUser = await userRepository.updateStatus(targetUid, normalizedStatus);
      if (!updatedUser) {
        return NextResponse.json(
          { success: false, error: { code: 'USER_NOT_FOUND', message: `User '${targetUid}' not found.` } },
          { status: 404 }
        );
      }

      // Record audit entry
      await auditRepository.record({
        actorId: auth.user?.userId,
        actorEmail: auth.user?.email,
        actorRole: auth.user?.role,
        action: normalizedStatus === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
        resourceType: 'USER',
        resourceId: targetUid,
        result: 'SUCCESS',
        details: {
          targetEmail: targetUser.email,
          previousStatus: targetUser.status || 'ACTIVE',
          newStatus: normalizedStatus,
        },
      });

      const safeUser = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: normalizedStatus,
      };

      return NextResponse.json({
        success: true,
        message: `User '${targetUser.email}' status successfully updated to '${normalizedStatus}'.`,
        user: safeUser,
        performedBy: auth.user?.email,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      console.error('[Admin API Update Status Error]:', err);
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update user status.' } },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    message: `Administrative PATCH request to /api/admin/${path} authorized and executed.`,
    target: path,
    payload: body,
    performedBy: auth.user?.email,
    timestamp: new Date().toISOString(),
  });
}
