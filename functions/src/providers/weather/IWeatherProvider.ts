// ==============================================================================
// WEATHER PROVIDER ABSTRACTION (Section 21)
// ==============================================================================

import { WeatherObservation, ForecastRecord } from '../../types';

export interface IWeatherProvider {
  readonly providerName: string;
  getCurrentWeather(locationId: string): Promise<WeatherObservation>;
  getForecast(locationId: string): Promise<ForecastRecord>;
  getHistoricalWeather(locationId: string, limit?: number): Promise<WeatherObservation[]>;
  isHealthy(): Promise<boolean>;
}
