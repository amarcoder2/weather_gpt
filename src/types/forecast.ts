import { WeatherConditionCode } from './weather';

export interface HourlyForecast {
  time: string; // e.g. "14:00"
  fullTimestamp: string;
  temp: number;
  feelsLike: number;
  rainProb: number; // percentage
  rainfallMm: number;
  windSpeed: number; // km/h
  condition: string;
  conditionCode: WeatherConditionCode;
  humidity: number;
}

export interface DailyForecast {
  day: string; // e.g. "Monday", "Tomorrow"
  date: string; // e.g. "21 Sep"
  tempMax: number;
  tempMin: number;
  rainProb: number;
  rainfallMm: number;
  windMax: number;
  condition: string;
  conditionCode: WeatherConditionCode;
  uvMax: number;
  summary: string;
}

export interface ForecastData {
  locationId: string;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  synopticOverview: string;
}
