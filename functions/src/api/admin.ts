// ==============================================================================
// ADMIN CONTROL CENTER API ROUTER (Section 23 - 31, 59)
// ==============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { ROLES, ALERT_STATUS, AlertSeverity, HazardType, AUDIT_ACTIONS } from '../constants';
import { userRepository } from '../repositories/userRepository';
import { alertRepository } from '../repositories/alertRepository';
import { disasterRepository } from '../repositories/disasterRepository';
import { locationRepository } from '../repositories/locationRepository';
import { auditRepository } from '../repositories/auditRepository';
import { weatherProvider } from '../providers/weather';
import { riskService } from '../services/riskService';
import { systemService } from '../services/systemService';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../errors';
import { validateRequest } from '../middleware/validate';
import { z } from 'zod';
import * as crypto from 'crypto';

const router = Router();

// Gating: All admin routes strictly require authentication
router.use(requireAuth);

// ------------------------------------------------------------------------------
// 1. OVERVIEW (Section 24)
// ------------------------------------------------------------------------------
router.get(
  '/overview',
  requireRoles(ROLES.ANALYST, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const overview = await systemService.getAdminOverview();
      sendSuccess(req, res, overview);
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------------------------------
// 2. USER MANAGEMENT & RBAC (Section 25)
// ------------------------------------------------------------------------------
router.get(
  '/users',
  requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.query.role as string | undefined;
      const status = req.query.status as string | undefined;
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const offset = parseInt((req.query.offset as string) || '0', 10);

      const { users, total } = await userRepository.listUsers({ role, status, limit, offset });
      sendSuccess(req, res, users, 200, { total, limit, offset, hasNext: offset + limit < total });
    } catch (err) {
      next(err);
    }
  }
);

const updateUserRoleSchema = z.object({
  role: z.enum([ROLES.USER, ROLES.MODERATOR, ROLES.ANALYST, ROLES.ADMIN, ROLES.SUPER_ADMIN]),
});

// Privileged: Only SUPER_ADMIN can modify user roles
router.patch(
  '/users/:id/role',
  requireRoles(ROLES.SUPER_ADMIN),
  validateRequest({ body: updateUserRoleSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = String(req.params.id);
      const { role } = req.body;

      const updated = await userRepository.updateRole(targetUserId, role);
      if (!updated) {
        throw new NotFoundError(`User '${targetUserId}' not found`);
      }

      await auditRepository.append({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: AUDIT_ACTIONS.USER_ROLE_CHANGED,
        resourceType: 'USER',
        resourceId: targetUserId,
        result: 'SUCCESS',
        requestId: req.requestId,
        metadata: { newRole: role, targetEmail: updated.email },
      });

      sendSuccess(req, res, updated);
    } catch (err) {
      next(err);
    }
  }
);

const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED']),
});

router.patch(
  '/users/:id/status',
  requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validateRequest({ body: updateUserStatusSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = String(req.params.id);
      const { status } = req.body;

      const updated = await userRepository.updateStatus(targetUserId, status);
      if (!updated) {
        throw new NotFoundError(`User '${targetUserId}' not found`);
      }

      await auditRepository.append({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
        resourceType: 'USER',
        resourceId: targetUserId,
        result: 'SUCCESS',
        requestId: req.requestId,
        metadata: { newStatus: status, targetEmail: updated.email },
      });

      sendSuccess(req, res, updated);
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------------------------------
// 3. ALERT LIFECYCLE MANAGEMENT (Section 26 & 17)
// ------------------------------------------------------------------------------
router.get(
  '/alerts',
  requireRoles(ROLES.ANALYST, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as any;
      const severity = req.query.severity as any;
      const location = req.query.location as string | undefined;
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const offset = parseInt((req.query.offset as string) || '0', 10);

      const { alerts, total } = await alertRepository.listAlerts({ status, severity, location, limit, offset });
      sendSuccess(req, res, alerts, 200, { total, limit, offset, hasNext: offset + limit < total });
    } catch (err) {
      next(err);
    }
  }
);

const createAlertSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  headline: z.string().optional(),
  hazardType: z.string(),
  severity: z.enum(['INFO', 'WATCH', 'WARNING', 'SEVERE']),
  location: z.string().min(2),
  state: z.string().min(2),
  affectedRegions: z.array(z.string()).min(1),
  effectiveFrom: z.string().optional(),
  expiresAt: z.string(),
  instructions: z.array(z.string()).min(1),
  source: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW']).default('DRAFT'),
});

router.post(
  '/alerts',
  requireRoles(ROLES.ANALYST, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validateRequest({ body: createAlertSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const now = new Date().toISOString();
      const id = `alert_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;

      const alert = await alertRepository.create({
        ...req.body,
        id,
        hazardType: req.body.hazardType as HazardType,
        severity: req.body.severity as AlertSeverity,
        status: req.body.status,
        effectiveFrom: req.body.effectiveFrom || now,
        source: req.body.source || 'IMD National Weather Forecasting Centre (Admin Entry)',
        createdBy: req.user!.uid,
        updatedBy: req.user!.uid,
        createdAt: now,
        updatedAt: now,
      });

      await auditRepository.append({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: AUDIT_ACTIONS.ALERT_CREATED,
        resourceType: 'ALERT',
        resourceId: id,
        result: 'SUCCESS',
        requestId: req.requestId,
        metadata: { title: alert.title, severity: alert.severity, status: alert.status },
      });

      sendSuccess(req, res, alert, 201);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/alerts/:id',
  requireRoles(ROLES.ANALYST, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alertId = String(req.params.id);
      const updated = await alertRepository.update(alertId, {
        ...req.body,
        updatedBy: req.user!.uid,
      });

      sendSuccess(req, res, updated);
    } catch (err) {
      next(err);
    }
  }
);

// Activation requires ADMIN or SUPER_ADMIN (Section 17 & 26)
router.post(
  '/alerts/:id/activate',
  requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alertId = String(req.params.id);
      const activated = await alertRepository.transitionStatus(
        alertId,
        ALERT_STATUS.ACTIVE,
        req.user!.uid
      );

      await auditRepository.append({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: AUDIT_ACTIONS.ALERT_ACTIVATED,
        resourceType: 'ALERT',
        resourceId: alertId,
        result: 'SUCCESS',
        requestId: req.requestId,
        metadata: { title: activated.title, severity: activated.severity },
      });

      sendSuccess(req, res, activated);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/alerts/:id/cancel',
  requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alertId = String(req.params.id);
      const reason = req.body.reason as string | undefined;
      const cancelled = await alertRepository.transitionStatus(
        alertId,
        ALERT_STATUS.CANCELLED,
        req.user!.uid,
        reason
      );

      await auditRepository.append({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: AUDIT_ACTIONS.ALERT_CANCELLED,
        resourceType: 'ALERT',
        resourceId: alertId,
        result: 'SUCCESS',
        requestId: req.requestId,
        metadata: { title: cancelled.title, reason },
      });

      sendSuccess(req, res, cancelled);
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------------------------------
// 4. DISASTER CATALOG (Section 27)
// ------------------------------------------------------------------------------
router.get(
  '/disasters',
  requireRoles(ROLES.ANALYST, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { records, total } = await disasterRepository.list({ limit: 100 });
      sendSuccess(req, res, records, 200, { total, limit: 100, offset: 0, hasNext: false });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/disasters',
  requireRoles(ROLES.ANALYST, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.body.id || `disaster_${Date.now()}`;
      const now = new Date().toISOString();

      const created = await disasterRepository.create({
        ...req.body,
        id,
        createdAt: now,
        updatedAt: now,
      });

      await auditRepository.append({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: AUDIT_ACTIONS.DISASTER_CREATED,
        resourceType: 'DISASTER',
        resourceId: id,
        result: 'SUCCESS',
        requestId: req.requestId,
        metadata: { name: created.name, hazardType: created.hazardType, year: created.year },
      });

      sendSuccess(req, res, created, 201);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/disasters/:id',
  requireRoles(ROLES.ANALYST, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const disasterId = String(req.params.id);
      const updated = await disasterRepository.update(disasterId, req.body);

      await auditRepository.append({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: AUDIT_ACTIONS.DISASTER_UPDATED,
        resourceType: 'DISASTER',
        resourceId: disasterId,
        result: 'SUCCESS',
        requestId: req.requestId,
      });

      sendSuccess(req, res, updated);
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------------------------------
// 5. OPERATIONAL WEATHER VISIBILITY & FRESHNESS (Section 28)
// ------------------------------------------------------------------------------
router.get(
  '/weather',
  requireRoles(ROLES.ANALYST, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const locations = await locationRepository.getAll();
      const observations = await Promise.all(
        locations.map((loc) => weatherProvider.getCurrentWeather(loc.id))
      );

      sendSuccess(req, res, {
        totalStations: locations.length,
        liveStations: observations.filter((o) => o.dataFreshness === 'LIVE').length,
        observations,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------------------------------
// 6. RISK INTELLIGENCE WORKBENCH (Section 29)
// ------------------------------------------------------------------------------
router.get(
  '/risk',
  requireRoles(ROLES.ANALYST, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const matrix = await riskService.getAllAssessments();
      sendSuccess(req, res, matrix);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/risk/recalculate',
  requireRoles(ROLES.ANALYST, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const locations = await locationRepository.getAll();
      const updatedMatrix = await Promise.all(
        locations.map((loc) => riskService.calculateLocationRisk(loc.id))
      );

      await auditRepository.append({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: AUDIT_ACTIONS.RISK_RECALCULATED,
        resourceType: 'RISK',
        resourceId: 'all_stations',
        result: 'SUCCESS',
        requestId: req.requestId,
        metadata: { stationsCount: locations.length, modelVersion: riskService.modelVersion },
      });

      sendSuccess(req, res, {
        recalculatedStations: locations.length,
        modelVersion: riskService.modelVersion,
        assessments: updatedMatrix,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------------------------------
// 7. AUDIT LOGGING TRAIL (Section 31)
// ------------------------------------------------------------------------------
router.get(
  '/audit',
  requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actorId = req.query.actorId as string | undefined;
      const action = req.query.action as string | undefined;
      const resourceType = req.query.resourceType as string | undefined;
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const offset = parseInt((req.query.offset as string) || '0', 10);

      const { logs, total } = await auditRepository.list({
        actorId,
        action,
        resourceType,
        limit,
        offset,
      });

      sendSuccess(req, res, logs, 200, { total, limit, offset, hasNext: offset + limit < total });
    } catch (err) {
      next(err);
    }
  }
);

// ------------------------------------------------------------------------------
// 8. SYSTEM HEALTH, METRICS & DATA SOURCES (Section 30)
// ------------------------------------------------------------------------------
router.get(
  '/system/health',
  requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const health = await systemService.getHealth();
      sendSuccess(req, res, health);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/system/metrics',
  requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = await systemService.getSystemMetrics();
      sendSuccess(req, res, metrics);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/data-sources',
  requireRoles(ROLES.ANALYST, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sources = [
        {
          id: 'imd-aws-network',
          name: 'IMD Automated Weather Station (AWS) Telemetry Grid',
          type: 'SURFACE_OBSERVATION',
          endpoint: 'https://mausam.imd.gov.in/api/v1/aws (Mock Adapter)',
          frequency: 'Every 15 minutes',
          status: 'ONLINE',
          freshness: 'LIVE',
          lastIngestionTime: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        },
        {
          id: 'imd-doppler-radar',
          name: 'IMD Doppler Weather Radar (DWR) Reflectivity Mosaic',
          type: 'RADAR_PRECIPITATION',
          frequency: 'Every 10 minutes',
          status: 'ONLINE',
          freshness: 'LIVE',
          lastIngestionTime: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
        },
        {
          id: 'cwc-flood-telemetry',
          name: 'Central Water Commission (CWC) River Basin Gauges',
          type: 'HYDROLOGICAL',
          frequency: 'Hourly',
          status: 'ONLINE',
          freshness: 'RECENT',
          lastIngestionTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        },
        {
          id: 'ndma-early-warning',
          name: 'NDMA CAP-CP (Common Alerting Protocol) Aggregator',
          type: 'ALERT_INTEGRATION',
          frequency: 'Event Driven / Push',
          status: 'ONLINE',
          freshness: 'LIVE',
          lastIngestionTime: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        },
      ];

      sendSuccess(req, res, sources);
    } catch (err) {
      next(err);
    }
  }
);

export const adminRouter = router;
