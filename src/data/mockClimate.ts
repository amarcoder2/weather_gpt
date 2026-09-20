import { ClimateTrend } from '../types/climate';

export const MOCK_CLIMATE_TRENDS: Record<string, ClimateTrend> = {
  '10-year': {
    period: '10-year',
    basePeriod: '2014 - 2024 vs 1961 - 1990 Baseline',
    avgTempRise: 0.64,
    rainfallShiftPct: 6.8,
    extremeWeatherIncreasePct: 34.0,
    interpretation:
      'Over the past decade (2014-2024), annual mean surface temperatures across the Indian subcontinent have consistently registered 0.5°C to 0.7°C above the climatological normal. Notably, the frequency of "very heavy" rainfall events (>115 mm/day) has spiked by 34%, while low-to-moderate rain events have shrunk, leading to longer dry spells punctured by intense flash flood episodes.',
    keyDrivers: [
      'Elevated Bay of Bengal & Arabian Sea sea-surface temperatures (SST > 30°C)',
      'Intensification of convective available potential energy (CAPE) over Indo-Gangetic plains',
      'Urban heat island effects accelerating localized convective storms',
    ],
    records: [
      { year: 2015, tempAnomaly: 0.42, rainfallAnomalyMm: -120, extremeEventsCount: 14 },
      { year: 2016, tempAnomaly: 0.71, rainfallAnomalyMm: -35, extremeEventsCount: 19 },
      { year: 2017, tempAnomaly: 0.54, rainfallAnomalyMm: -48, extremeEventsCount: 16 },
      { year: 2018, tempAnomaly: 0.40, rainfallAnomalyMm: -105, extremeEventsCount: 22 },
      { year: 2019, tempAnomaly: 0.36, rainfallAnomalyMm: 110, extremeEventsCount: 27 },
      { year: 2020, tempAnomaly: 0.29, rainfallAnomalyMm: 98, extremeEventsCount: 24 },
      { year: 2021, tempAnomaly: 0.44, rainfallAnomalyMm: 12, extremeEventsCount: 29 },
      { year: 2022, tempAnomaly: 0.58, rainfallAnomalyMm: 72, extremeEventsCount: 31 },
      { year: 2023, tempAnomaly: 0.65, rainfallAnomalyMm: -65, extremeEventsCount: 36 },
      { year: 2024, tempAnomaly: 0.76, rainfallAnomalyMm: 45, extremeEventsCount: 38 },
    ],
  },
  '20-year': {
    period: '20-year',
    basePeriod: '2004 - 2024 vs 1961 - 1990 Baseline',
    avgTempRise: 0.58,
    rainfallShiftPct: 9.2,
    extremeWeatherIncreasePct: 52.0,
    interpretation:
      'The 20-year longitudinal view reveals a structural transformation in the South Asian monsoon dynamics. Pre-monsoon heatwaves arrive 10-14 days earlier and persist longer. Arabian Sea cyclogenesis, traditionally quiet compared to the Bay of Bengal, has experienced a 52% surge in rapid-intensification tropical systems.',
    keyDrivers: [
      'Weakening lower-tropospheric monsoon circulation paired with higher atmospheric moisture holding capacity (Clausius-Clapeyron scaling)',
      'Shifting Western Disturbance trajectories impacting Himalayan snowfall and winter precipitation',
      'Rapid warming of Western Indian Ocean',
    ],
    records: [
      { year: 2005, tempAnomaly: 0.38, rainfallAnomalyMm: 45, extremeEventsCount: 12 },
      { year: 2007, tempAnomaly: 0.32, rainfallAnomalyMm: 60, extremeEventsCount: 14 },
      { year: 2009, tempAnomaly: 0.56, rainfallAnomalyMm: -218, extremeEventsCount: 11 },
      { year: 2010, tempAnomaly: 0.63, rainfallAnomalyMm: 18, extremeEventsCount: 17 },
      { year: 2012, tempAnomaly: 0.34, rainfallAnomalyMm: -72, extremeEventsCount: 13 },
      { year: 2014, tempAnomaly: 0.48, rainfallAnomalyMm: -115, extremeEventsCount: 15 },
      { year: 2016, tempAnomaly: 0.71, rainfallAnomalyMm: -35, extremeEventsCount: 19 },
      { year: 2018, tempAnomaly: 0.40, rainfallAnomalyMm: -105, extremeEventsCount: 22 },
      { year: 2020, tempAnomaly: 0.29, rainfallAnomalyMm: 98, extremeEventsCount: 24 },
      { year: 2022, tempAnomaly: 0.58, rainfallAnomalyMm: 72, extremeEventsCount: 31 },
      { year: 2024, tempAnomaly: 0.76, rainfallAnomalyMm: 45, extremeEventsCount: 38 },
    ],
  },
  '30-year': {
    period: '30-year',
    basePeriod: '1994 - 2024 vs 1961 - 1990 Baseline',
    avgTempRise: 0.82,
    rainfallShiftPct: 14.5,
    extremeWeatherIncreasePct: 84.0,
    interpretation:
      'Over the thirty-year timeframe, India has observed an unmistakable upward march in thermal extremes and hydrological volatility. The number of hot nights (daily min temp > 28°C) in major cities has tripled since the mid-1990s, preventing nocturnal bodily recovery during heatwaves.',
    keyDrivers: [
      'Anthropogenic greenhouse gas radiative forcing',
      'Broadscale land-use and land-cover changes across river basins',
      'Himalayan cryosphere retreat altering downstream perennial river discharge patterns',
    ],
    records: [
      { year: 1994, tempAnomaly: 0.08, rainfallAnomalyMm: 120, extremeEventsCount: 8 },
      { year: 1998, tempAnomaly: 0.51, rainfallAnomalyMm: 55, extremeEventsCount: 11 },
      { year: 2002, tempAnomaly: 0.48, rainfallAnomalyMm: -192, extremeEventsCount: 9 },
      { year: 2006, tempAnomaly: 0.41, rainfallAnomalyMm: 22, extremeEventsCount: 13 },
      { year: 2010, tempAnomaly: 0.63, rainfallAnomalyMm: 18, extremeEventsCount: 17 },
      { year: 2014, tempAnomaly: 0.48, rainfallAnomalyMm: -115, extremeEventsCount: 15 },
      { year: 2018, tempAnomaly: 0.40, rainfallAnomalyMm: -105, extremeEventsCount: 22 },
      { year: 2022, tempAnomaly: 0.58, rainfallAnomalyMm: 72, extremeEventsCount: 31 },
      { year: 2024, tempAnomaly: 0.76, rainfallAnomalyMm: 45, extremeEventsCount: 38 },
    ],
  },
};
