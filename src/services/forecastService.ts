import { ForecastData } from '../types/forecast';
import { LocationInfo } from '../types/location';
import { DEFAULT_LOCATIONS } from '../config/constants';
import { apiClient } from './apiClient';
import { locationService } from './locationService';

export interface IForecastService {
  getForecast(locationOrId: string | LocationInfo): Promise<ForecastData>;
}

class ForecastService implements IForecastService {
  async getForecast(locationOrId: string | LocationInfo): Promise<ForecastData> {
    let loc: LocationInfo | undefined;

    if (typeof locationOrId === 'object' && locationOrId !== null) {
      loc = locationOrId;
    } else {
      const normalized = locationOrId.toLowerCase().trim();
      loc = await locationService.getLocationById(normalized);
      if (!loc) {
        loc = DEFAULT_LOCATIONS.find((l) => l.id.toLowerCase() === normalized);
      }
    }

    if (!loc) {
      throw new Error(`Location "${typeof locationOrId === 'string' ? locationOrId : 'unknown'}" could not be resolved. Please search and select a valid location.`);
    }

    const params = new URLSearchParams({
      latitude: loc.lat.toString(),
      longitude: loc.lon.toString(),
      city: loc.name,
      district: loc.district,
      state: loc.state,
    });

    const res = await apiClient.get<{ forecast: ForecastData }>(`/weather/coordinates?${params.toString()}`);

    if (!res.success || !res.data?.forecast) {
      throw new Error(res.error?.message || `Failed to fetch live forecast for ${loc.name}.`);
    }

    return {
      ...res.data.forecast,
      locationId: loc.id,
    };
  }
}

export const forecastService = new ForecastService();
