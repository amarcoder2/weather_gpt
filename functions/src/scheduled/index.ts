// ==============================================================================
// SCHEDULED FUNCTIONS FRAMEWORK (Section 38 & 44)
// ==============================================================================

import { alertRepository } from '../repositories/alertRepository';
import { auditRepository } from '../repositories/auditRepository';
import { riskService } from '../services/riskService';
import { locationRepository } from '../repositories/locationRepository';
import { ALERT_STATUS, AUDIT_ACTIONS } from '../constants';
import { logger } from '../logging/logger';

/**
 * Sweeps active alerts and marks past-expiry records as EXPIRED
 * Idempotent: repeated runs produce no side effects on already expired items
 */
export async function executeAlertExpirySweep(): Promise<{ expiredCount: number }> {
  const now = new Date();
  const { alerts } = await alertRepository.listAlerts({ status: ALERT_STATUS.ACTIVE, limit: 100 });

  let expiredCount = 0;
  for (const alert of alerts) {
    if (new Date(alert.expiresAt).getTime() <= now.getTime()) {
      try {
        await alertRepository.transitionStatus(alert.id, ALERT_STATUS.EXPIRED, 'system_scheduler');
        await auditRepository.append({
          actorId: 'system_scheduler',
          actorRole: 'SUPER_ADMIN',
          action: AUDIT_ACTIONS.ALERT_EXPIRED,
          resourceType: 'ALERT',
          resourceId: alert.id,
          result: 'SUCCESS',
          requestId: `sched_exp_${Date.now()}`,
          metadata: { title: alert.title, expiredAt: alert.expiresAt },
        });
        expiredCount++;
      } catch (err) {
        logger.error(`Error expiring alert ${alert.id}: ${err instanceof Error ? err.message : String(err)}`, {
          service: 'ScheduledTasks',
        });
      }
    }
  }

  logger.info(`Alert expiry sweep completed. ${expiredCount} alerts expired.`, {
    service: 'ScheduledTasks',
  });
  return { expiredCount };
}

/**
 * Recalculates risk assessments for all tracked meteorological stations
 */
export async function executeRiskRecalculationSweep(): Promise<{ updatedStations: number }> {
  const locations = await locationRepository.getAll();
  for (const loc of locations) {
    await riskService.calculateLocationRisk(loc.id);
  }

  logger.info(`Risk engine sweep completed across ${locations.length} stations.`, {
    service: 'ScheduledTasks',
  });
  return { updatedStations: locations.length };
}
