// ==============================================================================
// WEATHER API ROUTER (Section 13, 14, 21, Phase 2 Enhanced)
// ==============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { weatherRepository } from '../repositories/weatherRepository';
import { forecastRepository } from '../repositories/forecastRepository';
import { sendSuccess } from '../utils/response';

const router = Router();

// Current weather observation for a location
router.get('/current', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locationId = (req.query.locationId as string) || 'delhi';
    const observation = await weatherRepository.getLatestByLocation(locationId);
    sendSuccess(req, res, observation);
  } catch (err) {
    next(err);
  }
});

// Weather forecast for a location (hourly + daily)
router.get('/forecast', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locationId = (req.query.locationId as string) || 'delhi';
    const forecast = await forecastRepository.getForecast(locationId);
    sendSuccess(req, res, forecast);
  } catch (err) {
    next(err);
  }
});

// Historical observations
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locationId = (req.query.locationId as string) || 'delhi';
    const limit = parseInt((req.query.limit as string) || '7', 10);
    const history = await weatherRepository.getHistory(locationId, limit);
    sendSuccess(req, res, history);
  } catch (err) {
    next(err);
  }
});

export const weatherRouter = router;
