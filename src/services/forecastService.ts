import { ForecastData } from '../types/forecast';
import { MOCK_FORECASTS } from '../data/mockForecast';
import { apiClient } from './apiClient';

export interface IForecastService {
  getForecast(locationId: string): Promise<ForecastData>;
}

class ForecastService implements IForecastService {
  async getForecast(locationId: string): Promise<ForecastData> {
    const normalized = locationId.toLowerCase();
    try {
      const res = await apiClient.get<Record<string, unknown>>(`/weather/forecast?locationId=${encodeURIComponent(normalized)}`);
      if (res.success && res.data) {
        const d = res.data;
        const fallback = MOCK_FORECASTS[normalized] || MOCK_FORECASTS['kolkata'];
        return {
          locationId: normalized,
          hourly: Array.isArray(d.hourly) ? d.hourly : fallback.hourly,
          daily: Array.isArray(d.daily) ? d.daily : fallback.daily,
          synopticOverview: (d.synopticOverview as string) || (d.summaryText as string) || fallback.synopticOverview,
        };
      }
    } catch {
      // Fallback
    }

    const data = MOCK_FORECASTS[normalized] || MOCK_FORECASTS['kolkata'];
    return { ...data };
  }
}

export const forecastService = new ForecastService();
