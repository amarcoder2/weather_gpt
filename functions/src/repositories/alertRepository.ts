// ==============================================================================
// ALERT REPOSITORY (Section 16 & 17)
// ==============================================================================

import { db, isFirestoreEnabled } from '../config';
import { WeatherAlert } from '../types';
import { ALERT_STATUS, ALERT_SEVERITY, AlertStatus, AlertSeverity } from '../constants';
import { ConflictError, NotFoundError } from '../errors';
import { logger } from '../logging/logger';

export class AlertRepository {
  private collection = db.collection('alerts');
  private memoryAlerts = new Map<string, WeatherAlert>();

  constructor() {
    this.seedDefaultAlerts();
  }

  private seedDefaultAlerts(): void {
    const now = new Date();

    const alert1: WeatherAlert = {
      id: 'alert-bay-bengal-squall',
      title: 'Squally Wind & Deep Depression Warning',
      description: 'A deep depression over Westcentral Bay of Bengal is generating sustained winds of 55-65 kmph gusting to 75 kmph. Fishermen are strongly advised not to venture into southwest and westcentral Bay of Bengal.',
      headline: 'IMD Red Warning: Severe Sea Conditions along Odisha & Andhra Coast',
      hazardType: 'CYCLONE',
      severity: ALERT_SEVERITY.SEVERE,
      status: ALERT_STATUS.ACTIVE,
      location: 'Odisha & North Andhra Coastal Belt',
      state: 'Odisha',
      affectedRegions: ['Puri', 'Ganjam', 'Jagatsinghpur', 'Kendrapara', 'Srikakulam'],
      issuedAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      effectiveFrom: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      expiresAt: new Date(now.getTime() + 48 * 3600 * 1000).toISOString(),
      source: 'IMD RSMC New Delhi Special Tropical Bulletin',
      instructions: [
        'Total suspension of fishing operations.',
        'Coastal residents in low-lying thatched houses advised to shift to cyclone shelters.',
        'Secure offshore oil rigs and harbor cranes.',
      ],
      bulletinNumber: 'BOB-04/2026/08',
      impactLevel: 'HIGH',
      latitude: 19.5,
      longitude: 86.2,
      createdBy: 'demo_analyst_user',
      updatedBy: 'demo_admin_user',
      activatedBy: 'demo_admin_user',
      createdAt: new Date(now.getTime() - 6 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    };

    const alert2: WeatherAlert = {
      id: 'alert-rajasthan-heatwave',
      title: 'Heatwave to Severe Heatwave Alert',
      description: 'Maximum temperatures likely to remain 44°C to 47°C across West Rajasthan during the next 72 hours. High probability of heat illness and heat stroke symptoms in vulnerable individuals.',
      headline: 'Severe Heatwave Warning across Churu, Bikaner, and Jaisalmer',
      hazardType: 'HEATWAVE',
      severity: ALERT_SEVERITY.WARNING,
      status: ALERT_STATUS.ACTIVE,
      location: 'West Rajasthan Plain',
      state: 'Rajasthan',
      affectedRegions: ['Churu', 'Bikaner', 'Jaisalmer', 'Barmer', 'Jodhpur'],
      issuedAt: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      effectiveFrom: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      expiresAt: new Date(now.getTime() + 60 * 3600 * 1000).toISOString(),
      source: 'IMD Meteorological Centre Jaipur',
      instructions: [
        'Avoid heat exposure between 12:00 noon and 3:30 pm.',
        'Drink sufficient water, ORS, or homemade lassi/lemon water even if not thirsty.',
        'Wear lightweight, light-coloured, loose, porous cotton clothes.',
      ],
      impactLevel: 'MODERATE',
      latitude: 28.29,
      longitude: 74.96,
      createdBy: 'demo_analyst_user',
      updatedBy: 'demo_admin_user',
      activatedBy: 'demo_admin_user',
      createdAt: new Date(now.getTime() - 14 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
    };

    const alert3: WeatherAlert = {
      id: 'alert-kerala-heavyrain-draft',
      title: 'Isolated Extremely Heavy Rainfall Warning',
      description: 'Active monsoon surge likely to produce intense spells exceeding 204.4 mm in 24 hours over Ghat sections. High risk of localized slope failures and urban waterlogging.',
      hazardType: 'HEAVY_RAIN',
      severity: ALERT_SEVERITY.WATCH,
      status: ALERT_STATUS.PENDING_REVIEW,
      location: 'Central & North Kerala Ghats',
      state: 'Kerala',
      affectedRegions: ['Idukki', 'Wayanad', 'Palakkad'],
      issuedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      effectiveFrom: new Date(now.getTime() + 6 * 3600 * 1000).toISOString(),
      expiresAt: new Date(now.getTime() + 72 * 3600 * 1000).toISOString(),
      source: 'IMD Thiruvananthapuram Met Centre',
      instructions: [
        'Night travel in high range areas to be regulated.',
        'District disaster response forces on standby alert.',
      ],
      impactLevel: 'MODERATE',
      createdBy: 'demo_analyst_user',
      updatedBy: 'demo_analyst_user',
      createdAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
    };

    this.memoryAlerts.set(alert1.id, alert1);
    this.memoryAlerts.set(alert2.id, alert2);
    this.memoryAlerts.set(alert3.id, alert3);
  }

  async getById(id: string): Promise<WeatherAlert | null> {
    const alert = this.memoryAlerts.get(id);
    return alert || null;
  }

  async listAlerts(options?: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    location?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ alerts: WeatherAlert[]; total: number }> {
    let result = Array.from(this.memoryAlerts.values());

    if (options?.status) {
      result = result.filter((a) => a.status === options.status);
    }
    if (options?.severity) {
      result = result.filter((a) => a.severity === options.severity);
    }
    if (options?.location) {
      const q = options.location.toLowerCase();
      result = result.filter((a) => a.location.toLowerCase().includes(q) || a.state.toLowerCase().includes(q));
    }

    // Sort active and severe first, then recent
    result.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

    const total = result.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;

    return {
      alerts: result.slice(offset, offset + limit),
      total,
    };
  }

  async create(alert: WeatherAlert): Promise<WeatherAlert> {
    this.memoryAlerts.set(alert.id, alert);
    if (isFirestoreEnabled()) {
      try {
        await this.collection.doc(alert.id).set(alert);
      } catch {
        logger.debug('Firestore write fallback in AlertRepository');
      }
    }
    return alert;
  }

  async update(id: string, updates: Partial<WeatherAlert>): Promise<WeatherAlert> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError(`Alert with ID '${id}' not found`);
    }

    const updated: WeatherAlert = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.memoryAlerts.set(id, updated);
    if (isFirestoreEnabled()) {
      try {
        await this.collection.doc(id).set(updated, { merge: true });
      } catch {
        logger.debug('Firestore update fallback in AlertRepository');
      }
    }

    return updated;
  }

  /**
   * Enforces valid state machine transitions (Section 17)
   * DRAFT -> PENDING_REVIEW -> ACTIVE -> EXPIRED / CANCELLED
   */
  async transitionStatus(id: string, newStatus: AlertStatus, actorId: string, reason?: string): Promise<WeatherAlert> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError(`Alert with ID '${id}' not found`);
    }

    const validTransitions: Record<AlertStatus, AlertStatus[]> = {
      DRAFT: [ALERT_STATUS.PENDING_REVIEW, ALERT_STATUS.CANCELLED],
      PENDING_REVIEW: [ALERT_STATUS.ACTIVE, ALERT_STATUS.DRAFT, ALERT_STATUS.CANCELLED],
      ACTIVE: [ALERT_STATUS.EXPIRED, ALERT_STATUS.CANCELLED],
      EXPIRED: [],
      CANCELLED: [],
    };

    if (!validTransitions[existing.status].includes(newStatus)) {
      throw new ConflictError(
        `Invalid alert state transition: Cannot change status from '${existing.status}' to '${newStatus}'`
      );
    }

    const updates: Partial<WeatherAlert> = {
      status: newStatus,
      updatedBy: actorId,
    };

    if (newStatus === ALERT_STATUS.ACTIVE) {
      updates.activatedBy = actorId;
    } else if (newStatus === ALERT_STATUS.CANCELLED) {
      updates.cancelledBy = actorId;
      updates.cancellationReason = reason || 'Administrative cancellation';
    }

    return this.update(id, updates);
  }
}

export const alertRepository = new AlertRepository();
