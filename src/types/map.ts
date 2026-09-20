import { WeatherConditionCode } from './weather';
import { SeverityLevel } from './alert';
import { RiskLevel } from './risk';

export type WeatherMapLayer = 'temperature' | 'rainfall' | 'wind' | 'alerts' | 'risk' | 'stations';

export interface MapStation {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  x: number; // Projected SVG coordinate
  y: number; // Projected SVG coordinate
  temperature: number;
  condition: string;
  conditionCode: WeatherConditionCode;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  rainProb: number;
  riskScore: number;
  riskLevel: RiskLevel;
  alertSeverity?: SeverityLevel;
  alertHeadline?: string;
}

export interface MapRegion {
  id: string;
  name: string;
  code: string;
  path: string;
  avgTemp: number;
  rainfallStatus: 'Deficient' | 'Normal' | 'Excess' | 'Severe Inundation';
  riskLevel: RiskLevel;
  activeAlert?: string;
}

export interface IndiaMapData {
  boundaryPath: string;
  subdivisions: MapRegion[];
  stations: MapStation[];
}
