// ==============================================================================
// AUDIT REPOSITORY (Section 31)
// ==============================================================================

import { db, isFirestoreEnabled } from '../config';
import { AuditLogRecord } from '../types';
import { logger } from '../logging/logger';
import * as crypto from 'crypto';

export class AuditRepository {
  private collection = db.collection('auditLogs');
  private memoryLogs: AuditLogRecord[] = [];

  constructor() {
    this.seedDefaultLogs();
  }

  private seedDefaultLogs(): void {
    const now = Date.now();
    const sampleLogs: AuditLogRecord[] = [
      {
        id: `aud_${now - 3600000}_1`,
        timestamp: new Date(now - 3600000).toISOString(),
        actorId: 'demo_super_admin_user',
        actorEmail: 'superadmin@weathergpt.gov.in',
        actorRole: 'SUPER_ADMIN',
        action: 'SYSTEM_CONFIG_CHANGED',
        resourceType: 'SYSTEM',
        resourceId: 'global_risk_thresholds',
        result: 'SUCCESS',
        requestId: 'req_seed_101',
        metadata: { change: 'Initialized operational risk parameters for pre-monsoon monitoring' },
      },
      {
        id: `aud_${now - 1800000}_2`,
        timestamp: new Date(now - 1800000).toISOString(),
        actorId: 'demo_admin_user',
        actorEmail: 'admin@weathergpt.gov.in',
        actorRole: 'ADMIN',
        action: 'ALERT_ACTIVATED',
        resourceType: 'ALERT',
        resourceId: 'alert-bay-bengal-squall',
        result: 'SUCCESS',
        requestId: 'req_seed_102',
        metadata: { severity: 'SEVERE', bulletin: 'BOB-04/2026/08' },
      },
      {
        id: `aud_${now - 600000}_3`,
        timestamp: new Date(now - 600000).toISOString(),
        actorId: 'demo_analyst_user',
        actorEmail: 'analyst@weathergpt.gov.in',
        actorRole: 'ANALYST',
        action: 'ALERT_CREATED',
        resourceType: 'ALERT',
        resourceId: 'alert-kerala-heavyrain-draft',
        result: 'SUCCESS',
        requestId: 'req_seed_103',
        metadata: { initialStatus: 'PENDING_REVIEW' },
      },
    ];

    this.memoryLogs = sampleLogs;
  }

  async append(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>): Promise<AuditLogRecord> {
    const record: AuditLogRecord = {
      id: `aud_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // Keep newest logs first
    this.memoryLogs.unshift(record);

    if (isFirestoreEnabled()) {
      try {
        await this.collection.doc(record.id).set(record);
      } catch {
        logger.debug('Firestore write fallback in AuditRepository');
      }
    }

    logger.info(`Audit Log: [${record.action}] by ${record.actorRole}:${record.actorId} on ${record.resourceType}:${record.resourceId}`, {
      service: 'AuditService',
      requestId: record.requestId,
      userId: record.actorId,
      metadata: record.metadata,
    });

    return record;
  }

  async list(options?: {
    actorId?: string;
    action?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLogRecord[]; total: number }> {
    let result = [...this.memoryLogs];

    if (options?.actorId) {
      result = result.filter((l) => l.actorId === options.actorId);
    }
    if (options?.action) {
      result = result.filter((l) => l.action === options.action);
    }
    if (options?.resourceType) {
      result = result.filter((l) => l.resourceType === options.resourceType);
    }

    const total = result.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;

    return {
      logs: result.slice(offset, offset + limit),
      total,
    };
  }
}

export const auditRepository = new AuditRepository();
