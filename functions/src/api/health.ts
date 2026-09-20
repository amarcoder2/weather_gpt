// ==============================================================================
// HEALTH API ROUTER (Section 5 & 30)
// ==============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { systemService } from '../services/systemService';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await systemService.getHealth();
    sendSuccess(req, res, health);
  } catch (err) {
    next(err);
  }
});

export const healthRouter = router;
