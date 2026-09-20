export type SeverityLevel = 'Information' | 'Watch' | 'Warning' | 'Critical';

export type AlertCategory =
  | 'Cyclone'
  | 'Flood'
  | 'Heavy Rainfall'
  | 'Heatwave'
  | 'Thunderstorm'
  | 'Lightning'
  | 'Extreme Wind'
  | 'Coastal Surge';

export interface WeatherAlert {
  id: string;
  title: string;
  category: AlertCategory;
  severity: SeverityLevel;
  location: string;
  state: string;
  affectedDistricts: string[];
  issuedTime: string;
  validUntil: string;
  headline: string;
  description: string;
  recommendedActions: string[];
  source: string; // e.g. "IMD Regional Specialised Meteorological Centre"
  bulletinNumber?: string;
  impactLevel?: 'Low' | 'Moderate' | 'High' | 'Catastrophic';
  coordinates?: [number, number];
}
