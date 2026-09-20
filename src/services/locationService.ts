import { LocationInfo } from '../types/location';
import { DEFAULT_LOCATIONS } from '../config/constants';
import { apiClient } from './apiClient';

export interface ILocationService {
  searchLocations(query: string): Promise<LocationInfo[]>;
  getSavedLocations(): Promise<LocationInfo[]>;
  getLocationById(id: string): Promise<LocationInfo | undefined>;
}

class LocationService implements ILocationService {
  private fallbackLocations: LocationInfo[] = [...DEFAULT_LOCATIONS];

  async searchLocations(query: string): Promise<LocationInfo[]> {
    if (!query.trim()) return this.fallbackLocations;

    try {
      const res = await apiClient.get<LocationInfo[]>(`/locations?search=${encodeURIComponent(query.trim())}`);
      if (res.success && res.data && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const q = query.toLowerCase();
    return this.fallbackLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q)
    );
  }

  async getSavedLocations(): Promise<LocationInfo[]> {
    try {
      const res = await apiClient.get<LocationInfo[]>('/locations');
      if (res.success && res.data && res.data.length > 0) {
        return res.data.slice(0, 10);
      }
    } catch {
      // Fallback
    }
    return [...this.fallbackLocations];
  }

  async getLocationById(id: string): Promise<LocationInfo | undefined> {
    const key = id.toLowerCase();
    if (key === 'current-location' || key === 'current') {
      try {
        const cached = localStorage.getItem('weathergpt_cached_current_location');
        if (cached) {
          return JSON.parse(cached) as LocationInfo;
        }
      } catch {
        // Fallback
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

    try {
      const res = await apiClient.get<LocationInfo>(`/locations/${encodeURIComponent(key)}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return this.fallbackLocations.find((loc) => loc.id.toLowerCase() === key);
  }
}

export const locationService = new LocationService();
