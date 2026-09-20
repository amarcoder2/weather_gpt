// ==============================================================================
// DISASTERS API ROUTER (Section 15)
// ==============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { disasterRepository } from '../repositories/disasterRepository';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../errors';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = req.query.state as string | undefined;
    const hazardType = req.query.hazardType as string | undefined;
    const severity = req.query.severity as string | undefined;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const limit = parseInt(req.query.limit as string || '20', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);

    const { records, total } = await disasterRepository.list({
      state,
      hazardType,
      severity,
      year,
      limit,
      offset,
    });

    sendSuccess(req, res, records, 200, {
      total,
      limit,
      offset,
      hasNext: offset + limit < total,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const disasterId = String(req.params.id);
    const record = await disasterRepository.getById(disasterId);
    if (!record) {
      throw new NotFoundError(`Disaster record '${disasterId}' not found`);
    }
    sendSuccess(req, res, record);
  } catch (err) {
    next(err);
  }
});

export const disastersRouter = router;
