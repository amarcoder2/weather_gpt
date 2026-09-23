import { LocationInfo } from '../types/location';
import { DEFAULT_LOCATIONS } from '../config/constants';
import { apiClient } from './apiClient';

export interface ILocationService {
  searchLocations(
    query: string,
    options?: { state?: string; district?: string; localityType?: string; limit?: number }
  ): Promise<LocationInfo[]>;
  getSavedLocations(): Promise<LocationInfo[]>;
  saveLocation(location: LocationInfo): Promise<LocationInfo[]>;
  removeSavedLocation(id: string): Promise<LocationInfo[]>;
  getLocationById(id: string): Promise<LocationInfo | undefined>;
}

class LocationService implements ILocationService {
  private fallbackLocations: LocationInfo[] = [...DEFAULT_LOCATIONS];
  private locationCache = new Map<string, LocationInfo>();

  constructor() {
    // Seed in-memory cache with default locations
    for (const loc of DEFAULT_LOCATIONS) {
      this.locationCache.set(loc.id.toLowerCase(), loc);
    }
  }

  /**
   * Searches nationwide Indian location catalog via PostgreSQL Search API
   * with graceful client-side fallback.
   */
  async searchLocations(
    query: string,
    options: { state?: string; district?: string; localityType?: string; limit?: number } = {}
  ): Promise<LocationInfo[]> {
    const q = query.trim();
    const limit = options.limit || 20;

    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (options.state) params.set('state', options.state);
      if (options.district) params.set('district', options.district);
      if (options.localityType) params.set('type', options.localityType);
      params.set('limit', limit.toString());

      const res = await apiClient.get<{
        locations: Array<{
          id: string;
          name: string;
          district: string;
          state: string;
          state_code?: string;
          locality_type?: string;
          latitude: number;
          longitude: number;
          elevation?: number;
          population?: number;
        }>;
      }>(`/location/search?${params.toString()}`);

      if (res.success && Array.isArray(res.data?.locations) && res.data.locations.length > 0) {
        const mapped: LocationInfo[] = res.data.locations.map((loc) => {
          const info: LocationInfo = {
            id: loc.id,
            name: loc.name,
            district: loc.district,
            state: loc.state,
            stateCode: loc.state_code,
            localityType: loc.locality_type,
            lat: loc.latitude,
            lon: loc.longitude,
            elevationMeters: loc.elevation,
            population: loc.population,
          };
          this.locationCache.set(info.id.toLowerCase(), info);
          return info;
        });
        return mapped;
      }
    } catch {
      // Fall through to fallback filtering if API fails or running offline
    }

    // Fallback: search default configured locations
    if (!q) return [...this.fallbackLocations];
    const lowerQ = q.toLowerCase();
    return this.fallbackLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(lowerQ) ||
        loc.district.toLowerCase().includes(lowerQ) ||
        loc.state.toLowerCase().includes(lowerQ) ||
        (loc.stationCode && loc.stationCode.toLowerCase().includes(lowerQ))
    );
  }

  /**
   * Retrieves saved locations from persistent storage (with DEFAULT_LOCATIONS fallback).
   */
  async getSavedLocations(): Promise<LocationInfo[]> {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('weathergpt_saved_locations');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Safe localStorage error fallback
      }
    }
    return [...this.fallbackLocations];
  }

  /**
   * Saves a location to the user's tracked locations list.
   */
  async saveLocation(location: LocationInfo): Promise<LocationInfo[]> {
    const current = await this.getSavedLocations();
    const exists = current.some((l) => l.id.toLowerCase() === location.id.toLowerCase());
    const updated = exists ? current : [location, ...current];

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('weathergpt_saved_locations', JSON.stringify(updated));
      } catch {
        // Safe localStorage error fallback
      }
    }
    this.locationCache.set(location.id.toLowerCase(), location);
    return updated;
  }

  /**
   * Removes a location from user tracked locations.
   */
  async removeSavedLocation(id: string): Promise<LocationInfo[]> {
    const current = await this.getSavedLocations();
    const updated = current.filter((l) => l.id.toLowerCase() !== id.toLowerCase());

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('weathergpt_saved_locations', JSON.stringify(updated));
      } catch {
        // Safe localStorage error fallback
      }
    }
    return updated;
  }

  /**
   * Resolves any location by ID, searching cache, defaults, or backend API.
   */
  async getLocationById(id: string): Promise<LocationInfo | undefined> {
    const key = id.toLowerCase().trim();

    // 1. Current GPS Location handling
    if (key === 'current-location' || key === 'current') {
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('weathergpt_cached_current_location');
          if (cached) {
            return JSON.parse(cached) as LocationInfo;
          }
        } catch {
          // Fallback
        }
      }
      return {
        id: 'current-location',
        name: 'Current Location',
        district: 'Local Area',
        state: 'India',
        lat: 20.2961,
        lon: 85.8245,
        stationCode: 'GPS',
      };
    }

    // 2. Check in-memory cache
    if (this.locationCache.has(key)) {
      return this.locationCache.get(key);
    }

    // 3. Check default locations
    const defaultLoc = this.fallbackLocations.find((l) => l.id.toLowerCase() === key);
    if (defaultLoc) {
      this.locationCache.set(key, defaultLoc);
      return defaultLoc;
    }

    // 4. Check saved locations
    const saved = await this.getSavedLocations();
    const savedLoc = saved.find((l) => l.id.toLowerCase() === key);
    if (savedLoc) {
      this.locationCache.set(key, savedLoc);
      return savedLoc;
    }

    // 5. Query backend location endpoint
    try {
      const res = await apiClient.get<{
        location: {
          id: string;
          name: string;
          district: string;
          state: string;
          state_code?: string;
          locality_type?: string;
          latitude: number;
          longitude: number;
          elevation?: number;
          population?: number;
        };
      }>(`/location/${encodeURIComponent(id)}`);

      if (res.success && res.data?.location) {
        const loc = res.data.location;
        const resolved: LocationInfo = {
          id: loc.id,
          name: loc.name,
          district: loc.district,
          state: loc.state,
          stateCode: loc.state_code,
          localityType: loc.locality_type,
          lat: loc.latitude,
          lon: loc.longitude,
          elevationMeters: loc.elevation,
          population: loc.population,
        };
        this.locationCache.set(key, resolved);
        return resolved;
      }
    } catch {
      // Return undefined if not resolvable
    }

    return undefined;
  }
}

export const locationService = new LocationService();
