import { WeatherData } from '../types/weather';
import { MOCK_WEATHER_RECORDS } from '../data/mockWeather';
import { apiClient } from './apiClient';

export interface IWeatherService {
  getCurrentWeather(locationId: string): Promise<WeatherData>;
  getAllStations(): Promise<WeatherData[]>;
}

class WeatherService implements IWeatherService {
  async getCurrentWeather(locationId: string): Promise<WeatherData> {
    const normalized = locationId.toLowerCase();
    try {
      const response = await apiClient.get<Record<string, unknown>>(`/weather/current?locationId=${encodeURIComponent(normalized)}`);
      if (response.success && response.data) {
        const obs = response.data;
        const fallback = MOCK_WEATHER_RECORDS[normalized] || MOCK_WEATHER_RECORDS['kolkata'];

        return {
          locationId: (obs.locationId as string) || normalized,
          locationName: (obs.locationName as string) || fallback.locationName,
          district: (obs.district as string) || fallback.district,
          state: (obs.state as string) || fallback.state,
          lat: Number(obs.latitude || fallback.lat),
          lon: Number(obs.longitude || fallback.lon),
          temperature: Number(obs.temperature !== undefined ? obs.temperature : fallback.temperature),
          feelsLike: Number(obs.feelsLike !== undefined ? obs.feelsLike : fallback.feelsLike),
          tempMin: Number(obs.tempMin !== undefined ? obs.tempMin : fallback.tempMin),
          tempMax: Number(obs.tempMax !== undefined ? obs.tempMax : fallback.tempMax),
          humidity: Number(obs.humidity !== undefined ? obs.humidity : fallback.humidity),
          windSpeed: Number(obs.windSpeed !== undefined ? obs.windSpeed : fallback.windSpeed),
          windDirection: (obs.windDirection as string) || fallback.windDirection,
          windGust: Number(obs.windGust || fallback.windGust),
          pressure: Number(obs.pressure || fallback.pressure),
          visibility: Number(obs.visibility || fallback.visibility),
          uvIndex: Number(obs.uvIndex || fallback.uvIndex),
          precipitationProbability: Number(obs.precipitationProbability || fallback.precipitationProbability),
          condition: (obs.condition as string) || fallback.condition,
          conditionCode: (obs.conditionCode as WeatherData['conditionCode']) || fallback.conditionCode,
          dewPoint: Number(obs.dewPoint || fallback.dewPoint),
          cloudCover: Number(obs.cloudCover || fallback.cloudCover),
          airQualityIndex: Number(obs.airQualityIndex || fallback.airQualityIndex),
          airQualityCategory: (obs.airQualityCategory as WeatherData['airQualityCategory']) || fallback.airQualityCategory,
          pm25: fallback.pm25,
          pm10: fallback.pm10,
          updatedTime: (obs.observedAt as string) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stationName: (obs.sourceStation as string) || (obs.source as string) || fallback.stationName,
          dataFreshness: 'DEMO', // Clearly mark mock engine data
          isDemo: true,
        };
      }
    } catch {
      // Graceful fallback to bundled mock data
    }

    const data = MOCK_WEATHER_RECORDS[normalized] || MOCK_WEATHER_RECORDS['kolkata'];
    return {
      ...data,
      dataFreshness: 'DEMO',
      isDemo: true,
    };
  }

  async getAllStations(): Promise<WeatherData[]> {
    return Object.values(MOCK_WEATHER_RECORDS).map((rec) => ({
      ...rec,
      dataFreshness: 'DEMO',
      isDemo: true,
    }));
  }
}

export const weatherService = new WeatherService();
