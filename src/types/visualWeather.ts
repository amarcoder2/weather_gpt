export type WeatherVisualState =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'fog'
  | 'heat'
  | 'wind'
  | 'cyclone'
  | 'night';

export type QualityLevel = 'high' | 'medium' | 'low';

export interface WeatherVisualConfig {
  state: WeatherVisualState;
  cloudDensity: number; // 0 (none) to 1 (dense storm)
  cloudColor: number; // Three.js hex
  cloudSpeed: number;
  rainCount: number; // 0 to 1200+
  rainSpeed: number;
  windSpeed: number; // km/h
  windDirectionAngle: number; // radians
  hasLightning: boolean;
  lightningIntervalRange: [number, number]; // [minMs, maxMs]
  fogDensity: number; // 0 to 0.05
  fogColor: number;
  hasHeatHaze: boolean;
  hasCycloneVortex: boolean;
  sunColor: number;
  sunIntensity: number;
  ambientColor: number;
  ambientIntensity: number;
  globeColor: number;
}

export function getVisualConfig(
  state: WeatherVisualState,
  quality: QualityLevel = 'high'
): WeatherVisualConfig {
  const particleScale = quality === 'high' ? 1.0 : quality === 'medium' ? 0.5 : 0.2;

  switch (state) {
    case 'clear':
      return {
        state,
        cloudDensity: 0.1,
        cloudColor: 0xffffff,
        cloudSpeed: 0.0015,
        rainCount: 0,
        rainSpeed: 0,
        windSpeed: 8,
        windDirectionAngle: 0.2,
        hasLightning: false,
        lightningIntervalRange: [0, 0],
        fogDensity: 0.0,
        fogColor: 0x071b3b,
        hasHeatHaze: false,
        hasCycloneVortex: false,
        sunColor: 0xfff3d4,
        sunIntensity: 2.0,
        ambientColor: 0x38bdf8,
        ambientIntensity: 0.45,
        globeColor: 0x0a234f,
      };

    case 'partly-cloudy':
      return {
        state,
        cloudDensity: 0.35,
        cloudColor: 0xe2e8f0,
        cloudSpeed: 0.002,
        rainCount: 0,
        rainSpeed: 0,
        windSpeed: 14,
        windDirectionAngle: 0.4,
        hasLightning: false,
        lightningIntervalRange: [0, 0],
        fogDensity: 0.0,
        fogColor: 0x071b3b,
        hasHeatHaze: false,
        hasCycloneVortex: false,
        sunColor: 0xffedd5,
        sunIntensity: 1.7,
        ambientColor: 0x60a5fa,
        ambientIntensity: 0.4,
        globeColor: 0x081e42,
      };

    case 'cloudy':
      return {
        state,
        cloudDensity: 0.7,
        cloudColor: 0x94a3b8,
        cloudSpeed: 0.0025,
        rainCount: 0,
        rainSpeed: 0,
        windSpeed: 18,
        windDirectionAngle: 0.6,
        hasLightning: false,
        lightningIntervalRange: [0, 0],
        fogDensity: 0.005,
        fogColor: 0x1e293b,
        hasHeatHaze: false,
        hasCycloneVortex: false,
        sunColor: 0xdbeafe,
        sunIntensity: 0.9,
        ambientColor: 0x475569,
        ambientIntensity: 0.4,
        globeColor: 0x061836,
      };

    case 'rain':
      return {
        state,
        cloudDensity: 0.8,
        cloudColor: 0x64748b,
        cloudSpeed: 0.003,
        rainCount: Math.round(500 * particleScale),
        rainSpeed: 0.06,
        windSpeed: 22,
        windDirectionAngle: 0.7,
        hasLightning: false,
        lightningIntervalRange: [0, 0],
        fogDensity: 0.01,
        fogColor: 0x0f172a,
        hasHeatHaze: false,
        hasCycloneVortex: false,
        sunColor: 0x93c5fd,
        sunIntensity: 0.8,
        ambientColor: 0x1e293b,
        ambientIntensity: 0.35,
        globeColor: 0x05132c,
      };

    case 'heavy-rain':
      return {
        state,
        cloudDensity: 0.9,
        cloudColor: 0x475569,
        cloudSpeed: 0.004,
        rainCount: Math.round(1000 * particleScale),
        rainSpeed: 0.09,
        windSpeed: 35,
        windDirectionAngle: 0.9,
        hasLightning: false,
        lightningIntervalRange: [0, 0],
        fogDensity: 0.018,
        fogColor: 0x090e1a,
        hasHeatHaze: false,
        hasCycloneVortex: false,
        sunColor: 0x60a5fa,
        sunIntensity: 0.5,
        ambientColor: 0x0f172a,
        ambientIntensity: 0.3,
        globeColor: 0x040e21,
      };

    case 'thunderstorm':
      return {
        state,
        cloudDensity: 1.0,
        cloudColor: 0x334155,
        cloudSpeed: 0.005,
        rainCount: Math.round(1100 * particleScale),
        rainSpeed: 0.1,
        windSpeed: 45,
        windDirectionAngle: 1.1,
        hasLightning: true,
        lightningIntervalRange: [3000, 7000],
        fogDensity: 0.02,
        fogColor: 0x080d19,
        hasHeatHaze: false,
        hasCycloneVortex: false,
        sunColor: 0x3b82f6,
        sunIntensity: 0.4,
        ambientColor: 0x172554,
        ambientIntensity: 0.25,
        globeColor: 0x030a18,
      };

    case 'fog':
      return {
        state,
        cloudDensity: 0.5,
        cloudColor: 0xcfd8dc,
        cloudSpeed: 0.001,
        rainCount: 0,
        rainSpeed: 0,
        windSpeed: 5,
        windDirectionAngle: 0.1,
        hasLightning: false,
        lightningIntervalRange: [0, 0],
        fogDensity: 0.035,
        fogColor: 0x1e293b,
        hasHeatHaze: false,
        hasCycloneVortex: false,
        sunColor: 0xdbeafe,
        sunIntensity: 0.7,
        ambientColor: 0x64748b,
        ambientIntensity: 0.4,
        globeColor: 0x081938,
      };

    case 'heat':
      return {
        state,
        cloudDensity: 0.05,
        cloudColor: 0xffedd5,
        cloudSpeed: 0.001,
        rainCount: 0,
        rainSpeed: 0,
        windSpeed: 10,
        windDirectionAngle: 0.2,
        hasLightning: false,
        lightningIntervalRange: [0, 0],
        fogDensity: 0.004,
        fogColor: 0x2e1a05,
        hasHeatHaze: true,
        hasCycloneVortex: false,
        sunColor: 0xfbbf24,
        sunIntensity: 2.6,
        ambientColor: 0xf97316,
        ambientIntensity: 0.5,
        globeColor: 0x131a26,
      };

    case 'wind':
      return {
        state,
        cloudDensity: 0.4,
        cloudColor: 0x94a3b8,
        cloudSpeed: 0.006,
        rainCount: 0,
        rainSpeed: 0,
        windSpeed: 55,
        windDirectionAngle: 1.3,
        hasLightning: false,
        lightningIntervalRange: [0, 0],
        fogDensity: 0.005,
        fogColor: 0x0f172a,
        hasHeatHaze: false,
        hasCycloneVortex: false,
        sunColor: 0xe0f2fe,
        sunIntensity: 1.4,
        ambientColor: 0x38bdf8,
        ambientIntensity: 0.4,
        globeColor: 0x061a3b,
      };

    case 'cyclone':
      return {
        state,
        cloudDensity: 1.0,
        cloudColor: 0x3b4252,
        cloudSpeed: 0.009,
        rainCount: Math.round(900 * particleScale),
        rainSpeed: 0.08,
        windSpeed: 85,
        windDirectionAngle: 2.2,
        hasLightning: true,
        lightningIntervalRange: [4000, 9000],
        fogDensity: 0.015,
        fogColor: 0x080f21,
        hasHeatHaze: false,
        hasCycloneVortex: true,
        sunColor: 0x6366f1,
        sunIntensity: 0.5,
        ambientColor: 0x4338ca,
        ambientIntensity: 0.35,
        globeColor: 0x030d22,
      };

    case 'night':
      return {
        state,
        cloudDensity: 0.3,
        cloudColor: 0x1e293b,
        cloudSpeed: 0.0012,
        rainCount: 0,
        rainSpeed: 0,
        windSpeed: 7,
        windDirectionAngle: 0.2,
        hasLightning: false,
        lightningIntervalRange: [0, 0],
        fogDensity: 0.005,
        fogColor: 0x030712,
        hasHeatHaze: false,
        hasCycloneVortex: false,
        sunColor: 0x38bdf8,
        sunIntensity: 0.3, // Soft moonlight
        ambientColor: 0x0f172a,
        ambientIntensity: 0.2,
        globeColor: 0x020713,
      };
  }
}

export function mapWeatherConditionToVisualState(
  conditionCode: string,
  isNight: boolean = false
): WeatherVisualState {
  if (isNight) return 'night';

  switch (conditionCode) {
    case 'clear':
      return 'clear';
    case 'partly-cloudy':
      return 'partly-cloudy';
    case 'cloudy':
      return 'cloudy';
    case 'rain':
      return 'rain';
    case 'heavy-rain':
      return 'heavy-rain';
    case 'thunderstorm':
      return 'thunderstorm';
    case 'cyclonic-squall':
      return 'cyclone';
    case 'fog':
      return 'fog';
    case 'heatwave':
      return 'heat';
    default:
      return 'partly-cloudy';
  }
}
