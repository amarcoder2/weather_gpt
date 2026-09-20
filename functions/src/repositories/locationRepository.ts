// ==============================================================================
// LOCATION REPOSITORY (Section 10 & 12, Phase 2 Enhanced)
// ==============================================================================

import { db, isFirestoreEnabled } from '../config';
import { LocationRecord } from '../types';
import { INDIAN_STATIONS } from '../providers/weather/MockWeatherProvider';
import { NotFoundError } from '../errors';
import { logger } from '../logging/logger';

export interface LocationFilterOptions {
  search?: string;
  state?: string;
  district?: string;
  region?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'state' | 'city' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class LocationRepository {
  private collection = db.collection('locations');
  private memoryLocations = new Map<string, LocationRecord>();

  constructor() {
    this.seedLocations();
  }

  private seedLocations(): void {
    const regionMap: Record<string, LocationRecord['region']> = {
      'Delhi': 'North',
      'Rajasthan': 'North',
      'Uttar Pradesh': 'North',
      'Jammu and Kashmir': 'North',
      'Maharashtra': 'West',
      'Gujarat': 'West',
      'West Bengal': 'East',
      'Odisha': 'East',
      'Bihar': 'East',
      'Tamil Nadu': 'South',
      'Karnataka': 'South',
      'Kerala': 'South',
      'Telangana': 'South',
      'Madhya Pradesh': 'Central',
      'Assam': 'North-East',
      'Andaman & Nicobar Islands': 'Islands',
    };

    INDIAN_STATIONS.forEach((s) => {
      const loc: LocationRecord = {
        id: s.id,
        name: s.name,
        city: s.district,
        district: s.district,
        state: s.state,
        country: 'India',
        latitude: s.lat,
        longitude: s.lon,
        timezone: 'Asia/Kolkata',
        region: regionMap[s.state] || 'Central',
        stationCode: `IMD-${s.id.toUpperCase()}`,
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      this.memoryLocations.set(loc.id, loc);
    });
  }

  /**
   * Returns all active locations (memory cache/fallback).
   */
  async getAll(): Promise<LocationRecord[]> {
    return Array.from(this.memoryLocations.values()).filter((l) => l.isActive);
  }

  /**
   * Retrieves single location by ID (checks Firestore then memory).
   */
  async getById(id: string): Promise<LocationRecord | null> {
    const key = id.toLowerCase();
    if (isFirestoreEnabled()) {
      try {
        const doc = await this.collection.doc(key).get();
        if (doc.exists) {
          return doc.data() as LocationRecord;
        }
      } catch {
        // Memory fallback
      }
    }
    return this.memoryLocations.get(key) || null;
  }

  /**
   * Safe server-side search across name, city, state, district.
   */
  async search(query: string): Promise<LocationRecord[]> {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAll();

    return Array.from(this.memoryLocations.values()).filter(
      (loc) =>
        loc.isActive &&
        (loc.name.toLowerCase().includes(q) ||
          loc.city.toLowerCase().includes(q) ||
          loc.state.toLowerCase().includes(q) ||
          loc.district.toLowerCase().includes(q))
    );
  }

  /**
   * Query locations with filtering, pagination, and sorting.
   */
  async list(options?: LocationFilterOptions): Promise<{
    locations: LocationRecord[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
  }> {
    let result = Array.from(this.memoryLocations.values());

    // 1. Active status filtering (default: show active only unless explicitly requested)
    if (options?.isActive !== undefined) {
      result = result.filter((l) => l.isActive === options.isActive);
    } else {
      result = result.filter((l) => l.isActive);
    }

    // 2. State filtering
    if (options?.state) {
      const st = options.state.toLowerCase();
      result = result.filter((l) => l.state.toLowerCase() === st);
    }

    // 3. District filtering
    if (options?.district) {
      const dist = options.district.toLowerCase();
      result = result.filter((l) => l.district.toLowerCase() === dist);
    }

    // 4. Region filtering
    if (options?.region) {
      const reg = options.region.toLowerCase();
      result = result.filter((l) => l.region.toLowerCase() === reg);
    }

    // 5. Text search
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.state.toLowerCase().includes(q) ||
          l.district.toLowerCase().includes(q)
      );
    }

    // 6. Sorting
    const sortBy = options?.sortBy || 'name';
    const sortOrder = options?.sortOrder || 'asc';
    result.sort((a, b) => {
      const valA = (a[sortBy] || '').toString().toLowerCase();
      const valB = (b[sortBy] || '').toString().toLowerCase();
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    const total = result.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;
    const paginated = result.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    const nextCursor = hasMore ? paginated[paginated.length - 1]?.id : undefined;

    return {
      locations: paginated,
      total,
      hasMore,
      nextCursor,
    };
  }

  /**
   * Administrative create: Adds a new location record.
   */
  async create(record: Omit<LocationRecord, 'createdAt' | 'updatedAt'>): Promise<LocationRecord> {
    const key = record.id.toLowerCase();
    const now = new Date().toISOString();
    const newLoc: LocationRecord = {
      ...record,
      id: key,
      isActive: record.isActive !== undefined ? record.isActive : true,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryLocations.set(key, newLoc);
    if (isFirestoreEnabled()) {
      try {
        await this.collection.doc(key).set(newLoc);
      } catch {
        logger.debug('Firestore write fallback in LocationRepository.create');
      }
    }
    return newLoc;
  }

  /**
   * Administrative update: Modifies an existing location.
   */
  async update(id: string, updates: Partial<LocationRecord>): Promise<LocationRecord> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new NotFoundError(`Location with ID '${id}' not found`);
    }

    const key = id.toLowerCase();
    const updated: LocationRecord = {
      ...existing,
      ...updates,
      id: existing.id, // prevent ID change
      updatedAt: new Date().toISOString(),
    };

    this.memoryLocations.set(key, updated);
    if (isFirestoreEnabled()) {
      try {
        await this.collection.doc(key).set(updated, { merge: true });
      } catch {
        logger.debug('Firestore write fallback in LocationRepository.update');
      }
    }
    return updated;
  }

  /**
   * Administrative soft delete: sets isActive = false without physical document loss.
   */
  async softDelete(id: string): Promise<LocationRecord> {
    return this.update(id, { isActive: false });
  }

  /**
   * Upsert helper preserving legacy compatibility.
   */
  async upsert(location: LocationRecord): Promise<void> {
    const key = location.id.toLowerCase();
    this.memoryLocations.set(key, location);
    if (isFirestoreEnabled()) {
      try {
        await this.collection.doc(key).set(location, { merge: true });
      } catch {
        logger.debug('Firestore write fallback in LocationRepository.upsert');
      }
    }
  }
}

export const locationRepository = new LocationRepository();
