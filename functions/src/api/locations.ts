// ==============================================================================
// LOCATIONS API ROUTER (Section 12, Phase 2 Enhanced)
// ==============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { locationRepository } from '../repositories/locationRepository';
import { userRepository } from '../repositories/userRepository';
import { auditRepository } from '../repositories/auditRepository';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../errors';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { ROLES } from '../constants';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate';

const router = Router();

// Query / list locations with filters and pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string | undefined;
    const state = req.query.state as string | undefined;
    const district = req.query.district as string | undefined;
    const region = req.query.region as string | undefined;
    const isActiveParam = req.query.isActive as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const sortBy = req.query.sortBy as 'name' | 'state' | 'city' | 'createdAt' | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

    const isActive = isActiveParam !== undefined ? isActiveParam === 'true' : undefined;

    const { locations, total, hasMore, nextCursor } = await locationRepository.list({
      search,
      state,
      district,
      region,
      isActive,
      limit,
      offset,
      sortBy,
      sortOrder,
    });

    sendSuccess(req, res, locations, 200, {
      total,
      limit,
      offset,
      hasNext: hasMore,
      nextCursor,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locId = String(req.params.id);
    const loc = await locationRepository.getById(locId);
    if (!loc) {
      throw new NotFoundError(`Location '${locId}' not found`);
    }
    sendSuccess(req, res, loc);
  } catch (err) {
    next(err);
  }
});

// Administrative location creation
const createLocationSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  city: z.string().min(2),
  district: z.string().min(2),
  state: z.string().min(2),
  country: z.string().default('India'),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().default('Asia/Kolkata'),
  pincode: z.string().optional(),
  region: z.enum(['North', 'South', 'East', 'West', 'Central', 'North-East', 'Islands']),
  stationCode: z.string().optional(),
  isActive: z.boolean().default(true),
});

router.post(
  '/',
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validateRequest({ body: createLocationSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await locationRepository.create(req.body);

      await auditRepository.append({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'SYSTEM_CONFIG_CHANGED',
        resourceType: 'SYSTEM',
        resourceId: `location_${created.id}`,
        result: 'SUCCESS',
        requestId: req.requestId || 'req_loc_create',
        metadata: { locationId: created.id, name: created.name },
      });

      sendSuccess(req, res, created, 201);
    } catch (err) {
      next(err);
    }
  }
);

// Administrative location update
const updateLocationSchema = createLocationSchema.partial();

router.patch(
  '/:id',
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validateRequest({ body: updateLocationSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const locId = String(req.params.id);
      const updated = await locationRepository.update(locId, req.body);

      await auditRepository.append({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'SYSTEM_CONFIG_CHANGED',
        resourceType: 'SYSTEM',
        resourceId: `location_${updated.id}`,
        result: 'SUCCESS',
        requestId: req.requestId || 'req_loc_update',
        metadata: { locationId: updated.id, updates: req.body },
      });

      sendSuccess(req, res, updated);
    } catch (err) {
      next(err);
    }
  }
);

// Administrative soft deletion
router.delete(
  '/:id',
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const locId = String(req.params.id);
      const softDeleted = await locationRepository.softDelete(locId);

      await auditRepository.append({
        actorId: req.user!.uid,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'SYSTEM_CONFIG_CHANGED',
        resourceType: 'SYSTEM',
        resourceId: `location_${locId}`,
        result: 'SUCCESS',
        requestId: req.requestId || 'req_loc_softdelete',
        metadata: { locationId: locId, softDeleted: true },
      });

      sendSuccess(req, res, softDeleted);
    } catch (err) {
      next(err);
    }
  }
);

// Saved locations management (user preferences)
const saveLocationSchema = z.object({
  locationId: z.string().min(1),
});

router.post(
  '/saved',
  requireAuth,
  validateRequest({ body: saveLocationSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userRepository.getById(req.user!.uid);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const { locationId } = req.body;
      const loc = await locationRepository.getById(locationId);
      if (!loc) {
        throw new NotFoundError(`Location '${locationId}' not found`);
      }

      if (!user.savedLocationIds.includes(loc.id)) {
        user.savedLocationIds.push(loc.id);
        user.updatedAt = new Date().toISOString();
        await userRepository.upsert(user);
      }

      sendSuccess(req, res, { savedLocationIds: user.savedLocationIds });
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/saved/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userRepository.getById(req.user!.uid);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const locId = String(req.params.id).toLowerCase();
    user.savedLocationIds = user.savedLocationIds.filter((id) => id.toLowerCase() !== locId);
    user.updatedAt = new Date().toISOString();
    await userRepository.upsert(user);

    sendSuccess(req, res, { savedLocationIds: user.savedLocationIds });
  } catch (err) {
    next(err);
  }
});

export const locationsRouter = router;
