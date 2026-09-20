// ==============================================================================
// USERS API ROUTER (Section 8, 9, 11)
// ==============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { userRepository } from '../repositories/userRepository';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../errors';
import { z } from 'zod';
import { validateRequest } from '../middleware/validate';

const router = Router();

const updatePreferencesSchema = z.object({
  preferredLanguage: z.string().optional(),
  preferredLocationId: z.string().optional(),
  notificationPreferences: z
    .object({
      severeWeather: z.boolean().optional(),
      heavyRain: z.boolean().optional(),
      cycloneAlert: z.boolean().optional(),
      floodWarning: z.boolean().optional(),
      heatwaveAlert: z.boolean().optional(),
      dailyForecastDigest: z.boolean().optional(),
    })
    .optional(),
  voicePreferences: z
    .object({
      enabled: z.boolean().optional(),
      language: z.string().optional(),
      speed: z.number().min(0.5).max(2.0).optional(),
    })
    .optional(),
});

router.use(requireAuth);

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userRepository.getById(req.user!.uid);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    sendSuccess(req, res, user);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/me',
  validateRequest({ body: updatePreferencesSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userRepository.getById(req.user!.uid);
      if (!user) {
        throw new NotFoundError('User profile not found');
      }

      const updated = {
        ...user,
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      await userRepository.upsert(updated);
      sendSuccess(req, res, updated);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uid, email, displayName } = req.user!;
    const now = new Date().toISOString();

    let user = await userRepository.getById(uid);
    if (!user) {
      // Initialize profile on first authentication
      user = {
        uid,
        displayName: displayName || email.split('@')[0] || 'WeatherGPT User',
        email,
        photoURL: req.body?.photoURL || undefined,
        role: 'USER', // Default role is ALWAYS USER; privileged roles require explicit server promotion
        preferredLanguage: req.body?.preferredLanguage || 'en',
        preferredLocationId: req.body?.preferredLocationId || 'kolkata',
        savedLocationIds: ['kolkata', 'delhi'],
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
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };
      await userRepository.upsert(user);
    } else {
      // Existing user: update last login timestamp
      user.lastLoginAt = now;
      user.updatedAt = now;
      await userRepository.upsert(user);
    }

    sendSuccess(req, res, user);
  } catch (err) {
    next(err);
  }
});

export const usersRouter = router;
