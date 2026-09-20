// ==============================================================================
// FORECAST REPOSITORY (Firestore Collection: forecasts)
// ==============================================================================

import { db, isFirestoreEnabled } from '../config';
import { ForecastRecord } from '../types';
import { weatherProvider } from '../providers/weather';
import { logger } from '../logging/logger';

export class ForecastRepository {
  private collection = db.collection('forecasts');
  private memoryCache = new Map<string, ForecastRecord>();

  /**
   * Retrieves the current forecast for a location.
   * Checks memory/Firestore, falls back to MockWeatherProvider if missing.
   */
  async getForecast(locationId: string): Promise<ForecastRecord> {
    const locKey = locationId.toLowerCase();

    // 1. Try Firestore if available
    if (isFirestoreEnabled()) {
      try {
        const snap = await this.collection
          .where('locationId', '==', locKey)
          .orderBy('issuedAt', 'desc')
          .limit(1)
          .get();

        if (!snap.empty) {
          const doc = snap.docs[0];
          const data = doc.data() as ForecastRecord;
          this.memoryCache.set(locKey, data);
          return data;
        }
      } catch {
        logger.debug('Firestore read failed or offline; using memory/provider for forecast', {
          service: 'ForecastRepository',
          metadata: { locationId },
        });
      }
    }

    // 2. Check local memory cache
    const cached = this.memoryCache.get(locKey);
    if (cached) {
      return cached;
    }

    // 3. Fallback to Weather Provider (MockWeatherProvider)
    const generated = await weatherProvider.getForecast(locKey);
    this.memoryCache.set(locKey, generated);

    // Persist asynchronously
    this.saveForecast(generated).catch(() => {});

    return generated;
  }

  /**
   * Persists a forecast record to Firestore.
   */
  async saveForecast(record: ForecastRecord): Promise<void> {
    const locKey = record.locationId.toLowerCase();
    this.memoryCache.set(locKey, record);

    if (isFirestoreEnabled()) {
      try {
        await this.collection.doc(record.id).set(record, { merge: true });
      } catch {
        logger.debug('Firestore write fallback in ForecastRepository', {
          service: 'ForecastRepository',
          metadata: { recordId: record.id },
        });
      }
    }
  }
}

export const forecastRepository = new ForecastRepository();
