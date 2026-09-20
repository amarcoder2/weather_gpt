export type DisasterType = 'Cyclone' | 'Flood' | 'Heatwave' | 'Landslide' | 'Drought' | 'Thunderstorm';

export interface DisasterEvent {
  id: string;
  name: string;
  year: number;
  date: string;
  type: DisasterType;
  state: string;
  districts: string[];
  casualties: number;
  displacedPersons: string;
  economicImpact: string; // e.g. "₹1.05 Lakh Crore" or "Est. $13.5B USD"
  maxWindKmph?: number;
  maxRainfallMm?: number;
  description: string;
  keyTakeaway: string;
}
