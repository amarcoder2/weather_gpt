export type WeatherConditionCode =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'cyclonic-squall'
  | 'fog'
  | 'heatwave';

export interface WeatherData {
  locationId: string;
  locationName: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  temperature: number; // in Celsius
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number; // percentage
  windSpeed: number; // km/h
  windDirection: string; // e.g. "SSW"
  windGust: number; // km/h
  pressure: number; // hPa
  visibility: number; // km
  uvIndex: number; // 0-11+
  precipitationProbability: number; // percentage
  condition: string; // e.g. "Warm & Humid with Scattered Clouds"
  conditionCode: WeatherConditionCode;
  dewPoint: number;
  cloudCover: number; // percentage
  airQualityIndex: number; // AQI
  airQualityCategory: 'Good' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
  pm25: number;
  pm10: number;
  updatedTime: string;
  stationName: string;
  dataFreshness?: 'FRESH' | 'STALE' | 'UNKNOWN' | 'DEMO';
  isDemo?: boolean;
}
