// ==============================================================================
// DISASTER REPOSITORY (Section 15 & 27)
// ==============================================================================

import { db, isFirestoreEnabled } from '../config';
import { DisasterRecord } from '../types';
import { HISTORICAL_DISASTERS } from '../providers/disasters/MockDisasterProvider';
import { NotFoundError } from '../errors';
import { logger } from '../logging/logger';

export class DisasterRepository {
  private collection = db.collection('disasters');
  private memoryDisasters = new Map<string, DisasterRecord>();

  constructor() {
    this.seedDisasters();
  }

  private seedDisasters(): void {
    HISTORICAL_DISASTERS.forEach((d) => {
      this.memoryDisasters.set(d.id, d);
    });
  }

  async getAll(): Promise<DisasterRecord[]> {
    return Array.from(this.memoryDisasters.values());
  }

  async getById(id: string): Promise<DisasterRecord | null> {
    return this.memoryDisasters.get(id) || null;
  }

  async list(filter?: {
    state?: string;
    hazardType?: string;
    year?: number;
    severity?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ records: DisasterRecord[]; total: number }> {
    let result = Array.from(this.memoryDisasters.values());

    if (filter?.state) {
      result = result.filter((d) => d.state.toLowerCase() === filter.state?.toLowerCase());
    }
    if (filter?.hazardType) {
      result = result.filter((d) => d.hazardType.toLowerCase() === filter.hazardType?.toLowerCase());
    }
    if (filter?.year) {
      result = result.filter((d) => d.year === filter.year);
    }
    if (filter?.severity) {
      result = result.filter((d) => d.severity.toLowerCase() === filter.severity?.toLowerCase());
    }

    // Sort by year descending
    result.sort((a, b) => b.year - a.year);

    const total = result.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 20;

    return {
      records: result.slice(offset, offset + limit),
      total,
    };
  }

  async create(record: DisasterRecord): Promise<DisasterRecord> {
    this.memoryDisasters.set(record.id, record);
    if (isFirestoreEnabled()) {
      try {
        await this.collection.doc(record.id).set(record);
      } catch {
        logger.debug('Firestore write fallback in DisasterRepository');
      }
    }
    return record;
  }

  async update(id: string, updates: Partial<DisasterRecord>): Promise<DisasterRecord> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError(`Disaster record '${id}' not found`);
    }

    const updated: DisasterRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.memoryDisasters.set(id, updated);
    if (isFirestoreEnabled()) {
      try {
        await this.collection.doc(id).set(updated, { merge: true });
      } catch {
        logger.debug('Firestore update fallback in DisasterRepository');
      }
    }

    return updated;
  }
}

export const disasterRepository = new DisasterRepository();
