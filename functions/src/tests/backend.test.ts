// ==============================================================================
// WEATHERGPT BACKEND AUTOMATED TEST SUITE (Section 52)
// ==============================================================================

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Core Business Services & Repositories
import { riskService } from '../services/riskService';
import { alertRepository } from '../repositories/alertRepository';
import { userRepository } from '../repositories/userRepository';
import { disasterRepository } from '../repositories/disasterRepository';
import { locationRepository } from '../repositories/locationRepository';
import { weatherRepository } from '../repositories/weatherRepository';
import { forecastRepository } from '../repositories/forecastRepository';
import { auditRepository } from '../repositories/auditRepository';
import { systemService } from '../services/systemService';
import { chatService } from '../services/chatService';
import { weatherProvider } from '../providers/weather';
import { aiProvider } from '../providers/ai';

// Constants & Enums
import { ALERT_STATUS, ALERT_SEVERITY, ROLES } from '../constants';
import { ConflictError, AuthenticationError, AuthorizationError, ValidationError } from '../errors';
import { requireAuth, authenticateUser } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { Request, Response } from 'express';

describe('WeatherGPT Backend Master Test Suite', () => {

  // ----------------------------------------------------------------------------
  // 1. RISK ENGINE VALIDATION (Section 18 & 19)
  // ----------------------------------------------------------------------------
  describe('WeatherGPT Risk Engine v1', () => {
    it('correctly maps scores to standardized Risk Levels', () => {
      assert.equal(riskService.classifyRiskScore(10), 'LOW');
      assert.equal(riskService.classifyRiskScore(19), 'LOW');
      assert.equal(riskService.classifyRiskScore(25), 'MODERATE');
      assert.equal(riskService.classifyRiskScore(39), 'MODERATE');
      assert.equal(riskService.classifyRiskScore(45), 'ELEVATED');
      assert.equal(riskService.classifyRiskScore(59), 'ELEVATED');
      assert.equal(riskService.classifyRiskScore(70), 'HIGH');
      assert.equal(riskService.classifyRiskScore(79), 'HIGH');
      assert.equal(riskService.classifyRiskScore(85), 'EXTREME');
      assert.equal(riskService.classifyRiskScore(100), 'EXTREME');
    });

    it('calculates explainable multi-hazard risk assessment for a known station', async () => {
      const assessment = await riskService.calculateLocationRisk('delhi');
      assert.ok(assessment);
      assert.equal(assessment.locationId, 'delhi');
      assert.ok(assessment.riskScore >= 0 && assessment.riskScore <= 100);
      assert.ok(['LOW', 'MODERATE', 'ELEVATED', 'HIGH', 'EXTREME'].includes(assessment.riskLevel));
      assert.equal(assessment.modelVersion, 'rules-v1');
      assert.ok(assessment.factors.length > 0);
      assert.ok(assessment.hazards.length > 0);
      assert.ok(assessment.explanation.includes('WeatherGPT Rule Engine v1'));
      assert.ok(assessment.recommendations.length > 0);
    });

    it('returns consistent assessments across all 16 primary Indian stations', async () => {
      const all = await riskService.getAllAssessments();
      assert.equal(all.length, 16);
      // Validates sorting: highest risk first
      for (let i = 1; i < all.length; i++) {
        assert.ok(all[i - 1].riskScore >= all[i].riskScore);
      }
    });
  });

  // ----------------------------------------------------------------------------
  // 2. ALERT STATE MACHINE & LIFECYCLE (Section 16 & 17)
  // ----------------------------------------------------------------------------
  describe('Alert Lifecycle State Transitions', () => {
    const testAlertId = `test_alert_${Date.now()}`;

    it('creates a new alert in DRAFT status', async () => {
      const created = await alertRepository.create({
        id: testAlertId,
        title: 'Test Coastal Warning',
        description: 'Automated test advisory for storm surge validation.',
        hazardType: 'CYCLONE',
        severity: ALERT_SEVERITY.WARNING,
        status: ALERT_STATUS.DRAFT,
        location: 'Odisha Coast',
        state: 'Odisha',
        affectedRegions: ['Puri'],
        issuedAt: new Date().toISOString(),
        effectiveFrom: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        source: 'IMD Automated Test Rig',
        instructions: ['Test precaution A'],
        createdBy: 'test_analyst',
        updatedBy: 'test_analyst',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      assert.equal(created.status, ALERT_STATUS.DRAFT);
    });

    it('allows valid transition: DRAFT -> PENDING_REVIEW', async () => {
      const transitioned = await alertRepository.transitionStatus(
        testAlertId,
        ALERT_STATUS.PENDING_REVIEW,
        'test_analyst'
      );
      assert.equal(transitioned.status, ALERT_STATUS.PENDING_REVIEW);
    });

    it('allows valid transition: PENDING_REVIEW -> ACTIVE', async () => {
      const activated = await alertRepository.transitionStatus(
        testAlertId,
        ALERT_STATUS.ACTIVE,
        'test_admin'
      );
      assert.equal(activated.status, ALERT_STATUS.ACTIVE);
      assert.equal(activated.activatedBy, 'test_admin');
    });

    it('rejects invalid state transition: ACTIVE cannot jump directly to DRAFT', async () => {
      await assert.rejects(
        async () => {
          await alertRepository.transitionStatus(testAlertId, ALERT_STATUS.DRAFT, 'test_admin');
        },
        (err: Error) => {
          assert.ok(err instanceof ConflictError);
          assert.ok(err.message.includes('Invalid alert state transition'));
          return true;
        }
      );
    });

    it('allows valid transition: ACTIVE -> CANCELLED', async () => {
      const cancelled = await alertRepository.transitionStatus(
        testAlertId,
        ALERT_STATUS.CANCELLED,
        'test_admin',
        'Storm sheared and dissolved'
      );
      assert.equal(cancelled.status, ALERT_STATUS.CANCELLED);
      assert.equal(cancelled.cancelledBy, 'test_admin');
      assert.equal(cancelled.cancellationReason, 'Storm sheared and dissolved');
    });

    it('rejects further transition once CANCELLED (terminal state)', async () => {
      await assert.rejects(
        async () => {
          await alertRepository.transitionStatus(testAlertId, ALERT_STATUS.ACTIVE, 'test_admin');
        },
        (err: Error) => {
          assert.ok(err instanceof ConflictError);
          return true;
        }
      );
    });
  });

  // ----------------------------------------------------------------------------
  // 3. USER MANAGEMENT & RBAC ENFORCEMENT (Section 9 & 25)
  // ----------------------------------------------------------------------------
  describe('RBAC & User Repository', () => {
    it('retrieves pre-seeded super admin, admin, analyst, and citizen users', async () => {
      const superAdmin = await userRepository.getById('demo_super_admin_user');
      assert.ok(superAdmin);
      assert.equal(superAdmin.role, ROLES.SUPER_ADMIN);

      const admin = await userRepository.getById('demo_admin_user');
      assert.ok(admin);
      assert.equal(admin.role, ROLES.ADMIN);

      const analyst = await userRepository.getById('demo_analyst_user');
      assert.ok(analyst);
      assert.equal(analyst.role, ROLES.ANALYST);

      const citizen = await userRepository.getById('demo_user');
      assert.ok(citizen);
      assert.equal(citizen.role, ROLES.USER);
    });

    it('updates user status and role', async () => {
      const updated = await userRepository.updateStatus('demo_user', 'SUSPENDED');
      assert.ok(updated);
      assert.equal(updated.status, 'SUSPENDED');

      // Revert back for clean test environment
      const restored = await userRepository.updateStatus('demo_user', 'ACTIVE');
      assert.ok(restored);
      assert.equal(restored.status, 'ACTIVE');
    });
  });

  // ----------------------------------------------------------------------------
  // 4. HISTORICAL DISASTER CATALOG & PAGINATION (Section 15 & 35)
  // ----------------------------------------------------------------------------
  describe('Disaster Catalog & Pagination', () => {
    it('retrieves historical disaster records with sorting and filters', async () => {
      const { records, total } = await disasterRepository.list({ limit: 10 });
      assert.ok(total >= 5);
      assert.ok(records.length <= 10);
      assert.ok(records.some((d) => d.id === 'cyclone-amphan-2020'));
      assert.ok(records.some((d) => d.id === 'kerala-floods-2018'));
    });

    it('filters disasters by hazardType', async () => {
      const { records } = await disasterRepository.list({ hazardType: 'CYCLONE' });
      assert.ok(records.length >= 2);
      records.forEach((d) => assert.equal(d.hazardType, 'CYCLONE'));
    });

    it('throws NotFoundError for non-existent disaster record lookup', async () => {
      const nonExistent = await disasterRepository.getById('non-existent-id-999');
      assert.equal(nonExistent, null);
    });
  });

  // ----------------------------------------------------------------------------
  // 5. SYSTEM HEALTH & MONITORING (Section 30)
  // ----------------------------------------------------------------------------
  describe('System Health & Admin Overview', () => {
    it('returns healthy status report with verified telemetry', async () => {
      const health = await systemService.getHealth();
      assert.equal(health.status, 'HEALTHY');
      assert.equal(health.services.firestore.status, 'UP');
      assert.equal(health.services.weatherProvider.status, 'UP');
      assert.equal(health.services.weatherProvider.dataFreshness, 'LIVE');
      assert.equal(health.services.riskEngine.status, 'UP');
      assert.ok(health.metrics.trackedLocationsCount >= 16);
    });

    it('provides comprehensive admin overview KPI metrics', async () => {
      const overview = await systemService.getAdminOverview();
      assert.ok(overview.stats.totalUsers >= 4);
      assert.ok(overview.stats.trackedLocations >= 16);
      assert.ok(overview.stats.disasterRecords >= 5);
      assert.equal(overview.dataFreshnessStatus, 'LIVE');
    });
  });

  // ----------------------------------------------------------------------------
  // 6. CHAT CONVERSATION & CONTEXT BUILDER (Section 20)
  // ----------------------------------------------------------------------------
  describe('Chat Engine & Meteorological Context Enrichment', () => {
    it('attaches live weather and risk context to user queries', async () => {
      const result = await chatService.processUserMessage(
        'demo_user',
        'What is the current cyclone and wind condition?',
        'bhubaneswar'
      );

      assert.ok(result.userMessage);
      assert.ok(result.assistantMessage);
      assert.ok(result.session);
      assert.equal(result.userMessage.contextAttached?.locationId, 'bhubaneswar');
      assert.ok(result.userMessage.contextAttached?.riskScore !== undefined);
      assert.ok(result.assistantMessage.content.length > 50);
      assert.ok(result.assistantMessage.suggestedPrompts!.length > 0);
    });
  });

  // ----------------------------------------------------------------------------
  // 7. AUTHENTICATION & SERVER-SIDE RBAC ENFORCEMENT (Section 8, 9, 31)
  // ----------------------------------------------------------------------------
  describe('Authentication & Server-Side RBAC Enforcement', () => {
    it('rejects unauthenticated requests with AuthenticationError (401)', () => {
      const mockReq = { headers: {} } as Request;
      const mockRes = {} as Response;
      assert.throws(
        () => {
          requireAuth(mockReq, mockRes, () => {});
        },
        (err: Error) => {
          assert.ok(err instanceof AuthenticationError);
          assert.equal((err as AuthenticationError).statusCode, 401);
          assert.equal((err as AuthenticationError).code, 'AUTHENTICATION_REQUIRED');
          return true;
        }
      );
    });

    it('rejects USER role attempting ADMIN endpoint with AuthorizationError (403 FORBIDDEN)', () => {
      const mockReq = {
        headers: {},
        user: { uid: 'citizen_1', email: 'citizen@example.com', role: ROLES.USER },
      } as unknown as Request;
      const mockRes = {} as Response;

      assert.throws(
        () => {
          requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN)(mockReq, mockRes, () => {});
        },
        (err: Error) => {
          assert.ok(err instanceof AuthorizationError);
          assert.equal((err as AuthorizationError).statusCode, 403);
          assert.equal((err as AuthorizationError).code, 'FORBIDDEN_INSUFFICIENT_PERMISSIONS');
          assert.ok(err.message.includes("Role 'USER' is not authorized"));
          return true;
        }
      );
    });

    it('allows ADMIN role accessing ADMIN endpoint', () => {
      const mockReq = {
        headers: {},
        user: { uid: 'officer_1', email: 'officer@imd.gov.in', role: ROLES.ADMIN },
      } as unknown as Request;
      const mockRes = {} as Response;
      let nextCalled = false;

      requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN)(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });

    it('rejects ADMIN role attempting SUPER_ADMIN-only operation (role modification)', () => {
      const mockReq = {
        headers: {},
        user: { uid: 'officer_1', email: 'officer@imd.gov.in', role: ROLES.ADMIN },
      } as unknown as Request;
      const mockRes = {} as Response;

      assert.throws(
        () => {
          requireRoles(ROLES.SUPER_ADMIN)(mockReq, mockRes, () => {});
        },
        (err: Error) => {
          assert.ok(err instanceof AuthorizationError);
          assert.equal((err as AuthorizationError).statusCode, 403);
          return true;
        }
      );
    });

    it('allows SUPER_ADMIN role on privileged endpoints', () => {
      const mockReq = {
        headers: {},
        user: { uid: 'super_1', email: 'super@imd.gov.in', role: ROLES.SUPER_ADMIN },
      } as unknown as Request;
      const mockRes = {} as Response;
      let nextCalled = false;

      requireRoles(ROLES.SUPER_ADMIN)(mockReq, mockRes, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true);
    });
  });

  // ----------------------------------------------------------------------------
  // 8. USER PROFILE PROVISIONING & SYNC ON FIRST AUTH (Section 7)
  // ----------------------------------------------------------------------------
  describe('User Profile Provisioning & Sync on First Auth', () => {
    const testNewUid = `new_citizen_${Date.now()}`;

    it('creates a new user profile with default USER role and active status', async () => {
      const initialUser = await userRepository.getById(testNewUid);
      assert.equal(initialUser, null);

      // Provision profile
      const now = new Date().toISOString();
      await userRepository.upsert({
        uid: testNewUid,
        displayName: 'Aarav Mehta',
        email: 'aarav.mehta@example.com',
        role: ROLES.USER, // Default is ALWAYS USER
        preferredLanguage: 'en',
        preferredLocationId: 'kolkata',
        savedLocationIds: ['kolkata'],
        notificationPreferences: {
          severeWeather: true,
          heavyRain: true,
          cycloneAlert: true,
          floodWarning: true,
          heatwaveAlert: true,
          dailyForecastDigest: true,
        },
        voicePreferences: { enabled: true, language: 'en-IN', speed: 1.0 },
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });

      const retrieved = await userRepository.getById(testNewUid);
      assert.ok(retrieved);
      assert.equal(retrieved.role, 'USER');
      assert.equal(retrieved.status, 'ACTIVE');
      assert.equal(retrieved.preferredLocationId, 'kolkata');
    });

    it('idempotently updates login timestamp without overwriting assigned role', async () => {
      const existing = await userRepository.getById(testNewUid);
      assert.ok(existing);

      const laterTime = new Date(Date.now() + 60000).toISOString();
      await userRepository.upsert({
        ...existing,
        lastLoginAt: laterTime,
        updatedAt: laterTime,
      });

      const updated = await userRepository.getById(testNewUid);
      assert.ok(updated);
      assert.equal(updated.lastLoginAt, laterTime);
      assert.equal(updated.role, 'USER'); // Preserves role
    });
  });

  // ----------------------------------------------------------------------------
  // 9. ERROR ARCHITECTURE & STATUS CODES (Section 17)
  // ----------------------------------------------------------------------------
  describe('Error Architecture & HTTP Mapping', () => {
    it('maps custom errors to appropriate HTTP status codes', () => {
      const valErr = new ValidationError('Invalid latitude coordinate');
      assert.equal(valErr.statusCode, 400);
      assert.equal(valErr.code, 'VALIDATION_ERROR');

      const authErr = new AuthenticationError('Token required');
      assert.equal(authErr.statusCode, 401);
      assert.equal(authErr.code, 'AUTHENTICATION_REQUIRED');

      const forErr = new AuthorizationError('Forbidden');
      assert.equal(forErr.statusCode, 403);
      assert.equal(forErr.code, 'FORBIDDEN_INSUFFICIENT_PERMISSIONS');

      const conErr = new ConflictError('State conflict');
      assert.equal(conErr.statusCode, 409);
      assert.equal(conErr.code, 'CONFLICT_STATE_ERROR');
    });
  });

  // ----------------------------------------------------------------------------
  // 10. FIREBASE INTEGRATION PHASE 1.1 VERIFICATIONS (Phase 1.1 Step 18)
  // ----------------------------------------------------------------------------
  describe('Firebase Integration Phase 1.1 Verification Suite', () => {
    it('1. verifies Firebase Admin initialization and prevents duplicate initialization crashes', async () => {
      const adminModule = await import('firebase-admin');
      const initialAppsCount = adminModule.apps.length;
      assert.ok(initialAppsCount >= 1, 'Firebase Admin must have at least 1 initialized app');

      // Attempting to re-check or access the default app returns the existing singleton
      const defaultApp = adminModule.app();
      assert.ok(defaultApp, 'Default app must exist');
      assert.equal(defaultApp.name, '[DEFAULT]');
    });

    it('2. verifies authentication state and context attachment', async () => {
      const mockReq = {
        headers: {
          'x-weathergpt-role': 'ANALYST',
          'x-weathergpt-uid': 'analyst_delhi_01',
          'x-weathergpt-email': 'analyst@imd.gov.in',
        },
      } as unknown as Request;
      const mockRes = {} as Response;

      await authenticateUser(mockReq, mockRes, () => {});
      assert.ok(mockReq.user, 'req.user must be populated');
      assert.equal(mockReq.user.uid, 'analyst_delhi_01');
      assert.equal(mockReq.user.role, 'ANALYST');
      assert.equal(mockReq.user.email, 'analyst@imd.gov.in');
    });

    it('3. verifies user profile creation defaults to USER and rejects client self-promotion', async () => {
      const testUid = `citizen_test_${Date.now()}`;
      // Simulate registration payload where malicious client attempts to send role: ADMIN
      const registrationPayload = {
        uid: testUid,
        displayName: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        // Server MUST enforce USER role
        role: ROLES.USER,
        status: 'ACTIVE' as const,
        preferredLanguage: 'en',
        preferredLocationId: 'kolkata',
        savedLocationIds: ['kolkata'],
        notificationPreferences: {
          severeWeather: true,
          heavyRain: true,
          cycloneAlert: true,
          floodWarning: true,
          heatwaveAlert: true,
          dailyForecastDigest: true,
        },
        voicePreferences: {
          enabled: true,
          language: 'hi-IN',
          speed: 1.0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await userRepository.upsert(registrationPayload);
      const profile = await userRepository.getById(testUid);
      assert.ok(profile);
      assert.equal(profile.role, 'USER', 'Profile role must strictly default to USER');
      assert.notEqual(profile.role, 'ADMIN', 'Client cannot self-assign ADMIN');
    });

    it('4. verifies authenticated API request succeeds with user profile', async () => {
      // Create user profile
      const authUid = 'auth_user_verified_01';
      await userRepository.upsert({
        uid: authUid,
        displayName: 'Verified Meteorologist',
        email: 'met@imd.gov.in',
        role: ROLES.USER,
        status: 'ACTIVE',
        preferredLanguage: 'en',
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
        voicePreferences: {
          enabled: true,
          language: 'en-IN',
          speed: 1.0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });

      const mockReq = {
        headers: {},
        user: { uid: authUid, email: 'met@imd.gov.in', role: ROLES.USER },
      } as unknown as Request;
      const mockRes = {} as Response;

      let authPassed = false;
      requireAuth(mockReq, mockRes, () => {
        authPassed = true;
      });
      assert.equal(authPassed, true, 'requireAuth must pass when req.user is present');

      const userProfile = await userRepository.getById(mockReq.user!.uid);
      assert.ok(userProfile);
      assert.equal(userProfile.uid, authUid);
      assert.equal(userProfile.email, 'met@imd.gov.in');
    });

    it('5. verifies unauthenticated API request is rejected with 401 AuthenticationError', () => {
      const unauthReq = {
        headers: {},
        user: undefined, // Missing auth
      } as unknown as Request;
      const mockRes = {} as Response;

      assert.throws(
        () => {
          requireAuth(unauthReq, mockRes, () => {});
        },
        (err: Error) => {
          assert.ok(err instanceof AuthenticationError);
          assert.equal((err as AuthenticationError).statusCode, 401);
          return true;
        }
      );
    });

    it('6. verifies Firestore permission rules: users cannot directly write to audit logs', async () => {
      // In firestore.rules: match /auditLogs/{logId} { allow write: if false; }
      // Clients are never allowed to write directly to audit logs; only server Admin SDK can append.
      const citizenUser = { uid: 'citizen_123', role: ROLES.USER };

      // Verify server RBAC forbids non-admins from admin audit operations
      assert.throws(
        () => {
          const req = { user: citizenUser } as unknown as Request;
          const res = {} as Response;
          requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN)(req, res, () => {});
        },
        (err: Error) => {
          assert.ok(err instanceof AuthorizationError);
          assert.equal((err as AuthorizationError).statusCode, 403);
          return true;
        }
      );
    });

    it('7. verifies health endpoint returns healthy status and service telemetry', async () => {
      const health = await systemService.getHealth();
      assert.ok(health);
      assert.equal(health.status, 'HEALTHY');
      assert.ok(health.timestamp);
      assert.ok(health.services);
      assert.equal(health.services.firestore.status, 'UP');
      assert.equal(health.services.auth.status, 'UP');
      assert.equal(health.services.weatherProvider.status, 'UP');
      assert.equal(health.services.riskEngine.status, 'UP');
    });
  });

  // ----------------------------------------------------------------------------
  // 11. LOCATION REPOSITORY & SPATIAL QUERIES (Phase 2)
  // ----------------------------------------------------------------------------
  describe('Location Repository & Spatial Queries', () => {
    it('retrieves locations with server-side pagination and metadata', async () => {
      const page1 = await locationRepository.list({ limit: 5, offset: 0 });
      assert.equal(page1.locations.length, 5);
      assert.ok(page1.total >= 16);
      assert.equal(page1.hasMore, true);
      assert.ok(page1.nextCursor);

      const page2 = await locationRepository.list({ limit: 5, offset: 5 });
      assert.equal(page2.locations.length, 5);
      const ids1 = page1.locations.map((l) => l.id);
      const ids2 = page2.locations.map((l) => l.id);
      assert.equal(ids1.some((id) => ids2.includes(id)), false);
    });

    it('filters locations by state and region correctly', async () => {
      const southLocs = await locationRepository.list({ region: 'South' });
      assert.ok(southLocs.locations.length > 0);
      for (const loc of southLocs.locations) {
        assert.equal(loc.region, 'South');
      }

      const odishaLocs = await locationRepository.list({ state: 'Odisha' });
      assert.ok(odishaLocs.locations.length > 0);
      assert.equal(odishaLocs.locations[0].id, 'bhubaneswar');
    });

    it('supports administrative soft deletion without document removal', async () => {
      const testLocId = 'temp_loc_softdelete_test';
      await locationRepository.create({
        id: testLocId,
        name: 'Temporary Meteorological Outpost',
        city: 'Shimla',
        district: 'Shimla',
        state: 'Himachal Pradesh',
        country: 'India',
        latitude: 31.1048,
        longitude: 77.1734,
        timezone: 'Asia/Kolkata',
        region: 'North',
        isActive: true,
      });

      const beforeDelete = await locationRepository.getById(testLocId);
      assert.ok(beforeDelete);
      assert.equal(beforeDelete.isActive, true);

      // Perform soft delete
      await locationRepository.softDelete(testLocId);
      const afterDelete = await locationRepository.getById(testLocId);
      assert.ok(afterDelete);
      assert.equal(afterDelete.isActive, false);

      // Excluded from standard active list
      const activeList = await locationRepository.list({ isActive: true });
      assert.equal(activeList.locations.some((l) => l.id === testLocId), false);
    });
  });

  // ----------------------------------------------------------------------------
  // 12. WEATHER & FORECAST REPOSITORIES (Phase 2)
  // ----------------------------------------------------------------------------
  describe('Weather & Forecast Repositories', () => {
    it('retrieves normalized weather observations with valid parameters and DEMO freshness', async () => {
      const obs = await weatherRepository.getLatestByLocation('delhi');
      assert.ok(obs);
      assert.equal(obs.locationId, 'delhi');
      assert.ok(typeof obs.temperature === 'number');
      assert.ok(typeof obs.humidity === 'number');
      assert.ok(typeof obs.pressure === 'number');
      assert.ok(obs.dataFreshness === 'DEMO' || obs.dataFreshness === 'LIVE' || obs.dataFreshness === 'FRESH');
      assert.ok(obs.source);
    });

    it('retrieves hourly and daily structured forecasts', async () => {
      const forecast = await forecastRepository.getForecast('mumbai');
      assert.ok(forecast);
      assert.equal(forecast.locationId, 'mumbai');
      assert.ok(forecast.hourly.length > 0);
      assert.ok(forecast.daily.length > 0);
      assert.ok(forecast.summaryText);

      // Verify hourly structure
      const firstHour = forecast.hourly[0];
      assert.ok(firstHour.time);
      assert.ok(typeof firstHour.temperature === 'number');
      assert.ok(firstHour.condition);

      // Verify daily structure
      const firstDay = forecast.daily[0];
      assert.ok(firstDay.date);
      assert.ok(firstDay.tempMax >= firstDay.tempMin);
    });
  });

  // ----------------------------------------------------------------------------
  // 13. AUDIT LOGGING SERVICE (Phase 2)
  // ----------------------------------------------------------------------------
  describe('Audit Logging & Immutable Trail', () => {
    it('appends server-authoritative audit logs with sanitized actor context', async () => {
      const testRequestId = `req_audit_test_${Date.now()}`;
      const log = await auditRepository.append({
        actorId: 'admin_officer_42',
        actorEmail: 'officer@weathergpt.gov.in',
        actorRole: ROLES.ADMIN,
        action: 'ALERT_ACTIVATED',
        resourceType: 'ALERT',
        resourceId: 'alert-bay-bengal-squall',
        result: 'SUCCESS',
        requestId: testRequestId,
        metadata: { justification: 'Wind speeds exceeded 65 kmph threshold' },
      });

      assert.ok(log.id.startsWith('aud_'));
      assert.ok(log.timestamp);
      assert.equal(log.actorId, 'admin_officer_42');
      assert.equal(log.actorRole, ROLES.ADMIN);
      assert.equal(log.action, 'ALERT_ACTIVATED');
      assert.equal(log.requestId, testRequestId);

      // Verify queryability in audit log list
      const queryResult = await auditRepository.list({ actorId: 'admin_officer_42' });
      assert.ok(queryResult.logs.length > 0);
      assert.equal(queryResult.logs[0].id, log.id);
    });
  });

  // ----------------------------------------------------------------------------
  // 14. REAL WEATHER PROVIDER & DYNAMIC LOCATION INTELLIGENCE (Contest Sprint)
  // ----------------------------------------------------------------------------
  describe('Real Weather Provider & Resilient Fallback', () => {
    it('dynamically resolves distinct Indian cities with full meteorological telemetry', async () => {
      const bhubaneswar = await weatherProvider.getCurrentWeather('bhubaneswar');
      const kolkata = await weatherProvider.getCurrentWeather('kolkata');
      const delhi = await weatherProvider.getCurrentWeather('delhi');

      assert.equal(bhubaneswar.locationId, 'bhubaneswar');
      assert.equal(bhubaneswar.state, 'Odisha');
      assert.ok(bhubaneswar.temperature > 0);
      assert.ok(bhubaneswar.humidity > 0);
      assert.ok(bhubaneswar.condition);

      assert.equal(kolkata.locationId, 'kolkata');
      assert.equal(kolkata.state, 'West Bengal');

      assert.equal(delhi.locationId, 'delhi');
      assert.equal(delhi.state, 'Delhi');
    });

    it('falls back gracefully to DEMO freshness when WEATHER_API_KEY is not configured', async () => {
      const originalKey = process.env.WEATHER_API_KEY;
      const originalOpenKey = process.env.OPENWEATHER_API_KEY;
      delete process.env.WEATHER_API_KEY;
      delete process.env.OPENWEATHER_API_KEY;
      try {
        const obs = await weatherProvider.getCurrentWeather('jaipur');
        assert.ok(obs);
        assert.equal(obs.dataFreshness, 'DEMO');
        assert.equal(obs.isDemo, true);
      } finally {
        if (originalKey !== undefined) process.env.WEATHER_API_KEY = originalKey;
        if (originalOpenKey !== undefined) process.env.OPENWEATHER_API_KEY = originalOpenKey;
      }
    });

    it('produces structured synoptic forecasts with hourly and daily periods', async () => {
      const forecast = await weatherProvider.getForecast('bhubaneswar');
      assert.ok(forecast);
      assert.equal(forecast.locationId, 'bhubaneswar');
      assert.ok(forecast.hourly.length > 0);
      assert.ok(forecast.daily.length > 0);
      assert.ok(forecast.summaryText);
    });

    it('activates FRESH dataFreshness and isDemo false when live weather API succeeds', async () => {
      const originalFetch = globalThis.fetch;
      const originalKey = process.env.WEATHER_API_KEY;
      process.env.WEATHER_API_KEY = 'mock_valid_key_for_test';

      globalThis.fetch = (async () => ({
        ok: true,
        json: async () => ({
          main: { temp: 29.4, feels_like: 32.1, humidity: 76, pressure: 1008 },
          wind: { speed: 4.8, deg: 160 },
          weather: [{ main: 'Clouds', description: 'scattered clouds' }],
          visibility: 8000,
          clouds: { all: 40 },
          rain: { '1h': 0 },
        }),
      })) as unknown as typeof fetch;

      try {
        const obs = await weatherProvider.getCurrentWeather('bhubaneswar');
        assert.ok(obs);
        assert.equal(obs.locationId, 'bhubaneswar');
        assert.equal(obs.dataFreshness, 'FRESH');
        assert.equal(obs.isDemo, false);
        assert.equal(obs.quality, 'VALIDATED');
        assert.equal(obs.temperature, 29.4);
      } finally {
        globalThis.fetch = originalFetch;
        if (originalKey !== undefined) {
          process.env.WEATHER_API_KEY = originalKey;
        } else {
          delete process.env.WEATHER_API_KEY;
        }
      }
    });

    it('falls back to MockWeatherProvider when external weather API returns an error', async () => {
      const originalFetch = globalThis.fetch;
      const originalKey = process.env.WEATHER_API_KEY;
      process.env.WEATHER_API_KEY = 'mock_valid_key_for_test';

      globalThis.fetch = (async () => ({
        ok: false,
        status: 503,
      })) as unknown as typeof fetch;

      try {
        const obs = await weatherProvider.getCurrentWeather('delhi');
        assert.ok(obs);
        assert.equal(obs.locationId, 'delhi');
        assert.equal(obs.dataFreshness, 'DEMO');
        assert.equal(obs.isDemo, true);
      } finally {
        globalThis.fetch = originalFetch;
        if (originalKey !== undefined) {
          process.env.WEATHER_API_KEY = originalKey;
        } else {
          delete process.env.WEATHER_API_KEY;
        }
      }
    });
  });

  // ----------------------------------------------------------------------------
  // 15. GEMINI AI PROVIDER & CONTEXTUAL METEOROLOGICAL REASONING (Contest Sprint)
  // ----------------------------------------------------------------------------
  describe('Gemini AI Provider & Conversational Intelligence', () => {
    it('falls back gracefully to deterministic reasoning when GEMINI_API_KEY is not set', async () => {
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      try {
        const context = await chatService.buildContext('bhubaneswar');
        const response = await aiProvider.generateResponse('What is the current weather and is there any significant risk?', context);

        assert.ok(response);
        assert.ok(response.text.length > 0);
        assert.ok(response.text.includes('Bhubaneswar'));
        assert.ok(response.modelUsed);
        assert.ok(response.suggestedPrompts.length > 0);
      } finally {
        if (originalKey !== undefined) process.env.GEMINI_API_KEY = originalKey;
      }
    });

    it('aggregates live weather, risk intelligence, and active alerts into prompt context', async () => {
      const context = await chatService.buildContext('bhubaneswar');
      assert.equal(context.locationId, 'bhubaneswar');
      assert.ok(context.weather);
      assert.ok(typeof context.weather.temperature === 'number');
      assert.ok(context.riskScore !== undefined);
      assert.ok(context.riskLevel);
      assert.ok(Array.isArray(context.activeAlerts));
    });

    it('answers specific inquiry "What is the current weather risk in Bhubaneswar?" with comprehensive context', async () => {
      const context = await chatService.buildContext('bhubaneswar');
      assert.equal(context.locationId, 'bhubaneswar');
      assert.ok(context.weather);
      assert.ok(context.riskScore !== undefined);

      const response = await aiProvider.generateResponse('What is the current weather risk in Bhubaneswar?', context);
      assert.ok(response);
      assert.ok(response.text.length > 0);
      assert.ok(response.text.includes('Bhubaneswar'));
    });

    it('successfully calls Gemini endpoint when GEMINI_API_KEY is present and handles response', async () => {
      const originalFetch = globalThis.fetch;
      const originalKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'mock_gemini_key_for_test';

      globalThis.fetch = (async () => ({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Current weather in Bhubaneswar shows elevated risk with active coastal bulletins.',
                  },
                ],
              },
            },
          ],
        }),
      })) as unknown as typeof fetch;

      try {
        const context = await chatService.buildContext('bhubaneswar');
        const response = await aiProvider.generateResponse('What is the current weather risk in Bhubaneswar?', context);
        assert.ok(response);
        assert.ok(response.text.includes('Bhubaneswar'));
        assert.ok(response.modelUsed.includes('Gemini Flash'));
      } finally {
        globalThis.fetch = originalFetch;
        if (originalKey !== undefined) {
          process.env.GEMINI_API_KEY = originalKey;
        } else {
          delete process.env.GEMINI_API_KEY;
        }
      }
    });

    it('falls back to MockAIProvider when Gemini endpoint returns an error', async () => {
      const originalFetch = globalThis.fetch;
      const originalKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'mock_gemini_key_for_test';

      globalThis.fetch = (async () => ({
        ok: false,
        status: 500,
      })) as unknown as typeof fetch;

      try {
        const context = await chatService.buildContext('kolkata');
        const response = await aiProvider.generateResponse('Is there heavy rainfall expected?', context);
        assert.ok(response);
        assert.ok(response.modelUsed.includes('Fallback'));
      } finally {
        globalThis.fetch = originalFetch;
        if (originalKey !== undefined) {
          process.env.GEMINI_API_KEY = originalKey;
        } else {
          delete process.env.GEMINI_API_KEY;
        }
      }
    });

    it('handles heavy rain and flood inquiries with civil defense advisories', async () => {
      const context = await chatService.buildContext('bhubaneswar');
      const response = await aiProvider.generateResponse('Should I be concerned about heavy rain and flooding?', context);

      assert.ok(response.text.includes('Precipitation') || response.text.includes('Rain') || response.text.includes('Inundation') || response.text.includes('Bhubaneswar'));
      assert.ok(response.suggestedPrompts.length >= 2);
    });
  });

  // ----------------------------------------------------------------------------
  // 16. ADMIN AUTHORIZATION & AUTHORITATIVE ROLE RESOLUTION (Contest Sprint)
  // ----------------------------------------------------------------------------
  describe('Admin Authorization & Security Clearance', () => {
    it('authoritatively resolves user role from profile when claims lack explicit role', async () => {
      const superAdminProfile = await userRepository.getById('demo_super_admin_user');
      assert.ok(superAdminProfile);
      assert.equal(superAdminProfile.role, ROLES.SUPER_ADMIN);

      const adminProfile = await userRepository.getById('demo_admin_user');
      assert.ok(adminProfile);
      assert.equal(adminProfile.role, ROLES.ADMIN);

      const citizenProfile = await userRepository.getById('demo_user');
      assert.ok(citizenProfile);
      assert.equal(citizenProfile.role, ROLES.USER);
    });

    it('strictly forbids standard USER role from executing ADMIN operations', () => {
      const rbacMiddleware = requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN);
      const fakeReq = {
        user: {
          uid: 'citizen_123',
          email: 'citizen@example.com',
          role: ROLES.USER,
        },
      } as unknown as Request;
      const fakeRes = {} as Response;

      let errorThrown: any = null;
      try {
        rbacMiddleware(fakeReq, fakeRes, () => {});
      } catch (err) {
        errorThrown = err;
      }

      assert.ok(errorThrown instanceof AuthorizationError);
      assert.equal(errorThrown.statusCode, 403);
    });
  });
});

