import { WeatherData } from '../types/weather';
import { LocationInfo } from '../types/location';
import { DEFAULT_LOCATIONS } from '../config/constants';
import { apiClient } from './apiClient';
import { locationService } from './locationService';

export interface IWeatherService {
  getCurrentWeather(locationOrId: string | LocationInfo): Promise<WeatherData>;
  getAllStations(): Promise<WeatherData[]>;
}

class WeatherService implements IWeatherService {
  async getCurrentWeather(locationOrId: string | LocationInfo): Promise<WeatherData> {
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

    const response = await apiClient.get<{ weather: WeatherData }>(`/weather/coordinates?${params.toString()}`);

    if (!response.success || !response.data?.weather) {
      throw new Error(response.error?.message || `Failed to fetch live weather data for ${loc.name}.`);
    }

    return {
      ...response.data.weather,
      locationId: loc.id,
      locationName: loc.name,
      district: loc.district,
      state: loc.state,
      stationName: loc.stationCode
        ? `${loc.name} Weather Observatory (${loc.stationCode})`
        : response.data.weather.stationName,
      dataFreshness: 'FRESH',
      isDemo: false,
    };
  }

  async getAllStations(): Promise<WeatherData[]> {
    const results = await Promise.allSettled(
      DEFAULT_LOCATIONS.map((loc) => this.getCurrentWeather(loc.id))
    );
    return results
      .filter((r): r is PromiseFulfilledResult<WeatherData> => r.status === 'fulfilled')
      .map((r) => r.value);
  }
}

export const weatherService = new WeatherService();
