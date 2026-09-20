// ==============================================================================
// WEATHER REPOSITORY (Firestore Collection: weatherObservations)
// ==============================================================================

import { db, isFirestoreEnabled } from '../config';
import { WeatherObservation } from '../types';
import { weatherProvider } from '../providers/weather';
import { logger } from '../logging/logger';

export class WeatherRepository {
  private collection = db.collection('weatherObservations');
  private memoryCache = new Map<string, WeatherObservation>();

  /**
   * Retrieves latest weather observation for a location.
   * Checks memory/Firestore, falls back to MockWeatherProvider if missing.
   */
  async getLatestByLocation(locationId: string): Promise<WeatherObservation> {
    const locKey = locationId.toLowerCase();

    // 1. Try Firestore if available
    if (isFirestoreEnabled()) {
      try {
        const snap = await this.collection
          .where('locationId', '==', locKey)
          .orderBy('observedAt', 'desc')
          .limit(1)
          .get();

        if (!snap.empty) {
          const doc = snap.docs[0];
          const data = doc.data() as WeatherObservation;
          this.memoryCache.set(locKey, data);
          return data;
        }
      } catch {
        logger.debug('Firestore read failed or unconfigured; falling back to memory/provider', {
          service: 'WeatherRepository',
          metadata: { locationId },
        });
      }
    }

    // 2. Check local memory cache
    const cached = this.memoryCache.get(locKey);
    if (cached) {
      return cached;
    }

    // 3. Fallback to Weather Provider (MockWeatherProvider with DEMO metadata)
    const generated = await weatherProvider.getCurrentWeather(locKey);
    this.memoryCache.set(locKey, generated);

    // Persist to Firestore asynchronously (fire-and-forget safe)
    this.saveObservation(generated).catch(() => {});

    return generated;
  }

  /**
   * Persists a weather observation to Firestore and updates the cache.
   */
  async saveObservation(obs: WeatherObservation): Promise<void> {
    const locKey = obs.locationId.toLowerCase();
    this.memoryCache.set(locKey, obs);

    if (isFirestoreEnabled()) {
      try {
        await this.collection.doc(obs.id).set(obs, { merge: true });
      } catch {
        logger.debug('Firestore write fallback in WeatherRepository', {
          service: 'WeatherRepository',
          metadata: { obsId: obs.id },
        });
      }
    }
  }

  /**
   * Retrieves historical observations for a location.
   */
  async getHistory(locationId: string, limit: number = 7): Promise<WeatherObservation[]> {
    const locKey = locationId.toLowerCase();

    if (isFirestoreEnabled()) {
      try {
        const snap = await this.collection
          .where('locationId', '==', locKey)
          .orderBy('observedAt', 'desc')
          .limit(limit)
          .get();

        if (!snap.empty) {
          return snap.docs.map((d) => d.data() as WeatherObservation);
        }
      } catch {
        logger.debug('Firestore history lookup fallback', {
          service: 'WeatherRepository',
          metadata: { locationId },
        });
      }
    }

    // Fallback to provider historical mock generator
    return weatherProvider.getHistoricalWeather(locKey, limit);
  }
}

export const weatherRepository = new WeatherRepository();
