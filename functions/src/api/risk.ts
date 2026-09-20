// ==============================================================================
// RISK API ROUTER (Section 18 & 19)
// ==============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { riskService } from '../services/riskService';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assessments = await riskService.getAllAssessments();
    sendSuccess(req, res, assessments);
  } catch (err) {
    next(err);
  }
});

router.get('/:locationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locId = String(req.params.locationId);
    const assessment = await riskService.getAssessment(locId);
    sendSuccess(req, res, assessment);
  } catch (err) {
    next(err);
  }
});

export const riskRouter = router;
