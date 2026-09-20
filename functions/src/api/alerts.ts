// ==============================================================================
// PUBLIC ALERTS API ROUTER (Section 16 & 17)
// ==============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { alertRepository } from '../repositories/alertRepository';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../errors';
import { ALERT_STATUS, AlertSeverity } from '../constants';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const severity = req.query.severity as AlertSeverity | undefined;
    const location = req.query.location as string | undefined;
    const limit = parseInt(req.query.limit as string || '20', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);

    // Public endpoint strictly returns ACTIVE alerts
    const { alerts, total } = await alertRepository.listAlerts({
      status: ALERT_STATUS.ACTIVE,
      severity,
      location,
      limit,
      offset,
    });

    sendSuccess(req, res, alerts, 200, {
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
    const alertId = String(req.params.id);
    const alert = await alertRepository.getById(alertId);
    if (!alert || alert.status !== ALERT_STATUS.ACTIVE) {
      throw new NotFoundError(`Active alert with ID '${alertId}' not found`);
    }
    sendSuccess(req, res, alert);
  } catch (err) {
    next(err);
  }
});

export const alertsRouter = router;
