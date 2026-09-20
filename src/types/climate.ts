export interface ClimateYearData {
  year: number;
  tempAnomaly: number; // in °C relative to baseline
  rainfallAnomalyMm: number; // in mm relative to baseline
  extremeEventsCount: number;
}

export interface ClimateTrend {
  period: '10-year' | '20-year' | '30-year';
  basePeriod: string;
  avgTempRise: number;
  rainfallShiftPct: number;
  extremeWeatherIncreasePct: number;
  records: ClimateYearData[];
  interpretation: string;
  keyDrivers: string[];
}
