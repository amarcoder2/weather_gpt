// ==============================================================================
// DETERMINISTIC MOCK WEATHER PROVIDER (Section 21 & 49)
// ==============================================================================

import { IWeatherProvider } from './IWeatherProvider';
import { WeatherObservation, ForecastRecord, HourlyForecastItem, DailyForecastItem } from '../../types';

export interface StationMetadata {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lon: number;
  baseTemp: number;
  humidityBase: number;
  condition: string;
  conditionCode: string;
}

export const INDIAN_STATIONS: StationMetadata[] = [
  { id: 'delhi', name: 'New Delhi (Safdarjung)', district: 'New Delhi', state: 'Delhi', lat: 28.584, lon: 77.206, baseTemp: 32.5, humidityBase: 58, condition: 'Hazy Sun with Moderate Heat', conditionCode: 'partly-cloudy' },
  { id: 'mumbai', name: 'Mumbai (Colaba)', district: 'Mumbai City', state: 'Maharashtra', lat: 18.899, lon: 72.815, baseTemp: 31.0, humidityBase: 84, condition: 'Humid Breeze with Passing Showers', conditionCode: 'rain' },
  { id: 'kolkata', name: 'Kolkata (Alipore)', district: 'Kolkata', state: 'West Bengal', lat: 22.533, lon: 88.333, baseTemp: 33.2, humidityBase: 86, condition: 'Warm & Heavy Moisture with Thundercloud Formations', conditionCode: 'cloudy' },
  { id: 'chennai', name: 'Chennai (Meenambakkam)', district: 'Chennai', state: 'Tamil Nadu', lat: 12.994, lon: 80.180, baseTemp: 34.0, humidityBase: 78, condition: 'Humid Coastal Wind with Scattered Cirrus', conditionCode: 'clear' },
  { id: 'bengaluru', name: 'Bengaluru (HAL Airport)', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.956, lon: 77.668, baseTemp: 26.5, humidityBase: 65, condition: 'Pleasant Breeze with Mild Overcast', conditionCode: 'partly-cloudy' },
  { id: 'hyderabad', name: 'Hyderabad (Begumpet)', district: 'Hyderabad', state: 'Telangana', lat: 17.453, lon: 78.468, baseTemp: 32.8, humidityBase: 62, condition: 'Dry Heat & Light Westerly Wind', conditionCode: 'clear' },
  { id: 'ahmedabad', name: 'Ahmedabad (Sabarmati)', district: 'Ahmedabad', state: 'Gujarat', lat: 23.075, lon: 72.580, baseTemp: 37.0, humidityBase: 42, condition: 'Intense Dry Heat & High UV Index', conditionCode: 'heatwave' },
  { id: 'bhubaneswar', name: 'Bhubaneswar (IMD Met Centre)', district: 'Khurda', state: 'Odisha', lat: 20.259, lon: 85.818, baseTemp: 33.0, humidityBase: 88, condition: 'Squall Line Watch & High Coastal Humidity', conditionCode: 'rain' },
  { id: 'guwahati', name: 'Guwahati (Borjhar)', district: 'Kamrup Metropolitan', state: 'Assam', lat: 26.106, lon: 91.586, baseTemp: 28.5, humidityBase: 89, condition: 'Dense River Fog & Moderate Thunderstorms', conditionCode: 'thunderstorm' },
  { id: 'srinagar', name: 'Srinagar (Badgam Met)', district: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.004, lon: 74.774, baseTemp: 18.0, humidityBase: 55, condition: 'Cool Alpine Air with High Valley Cirrus', conditionCode: 'clear' },
  { id: 'jaipur', name: 'Jaipur (Sanganer)', district: 'Jaipur', state: 'Rajasthan', lat: 26.824, lon: 75.812, baseTemp: 36.2, humidityBase: 38, condition: 'Warm Gusty Winds & High Solar Irradiance', conditionCode: 'clear' },
  { id: 'thiruvananthapuram', name: 'Thiruvananthapuram (Observatory Hill)', district: 'Thiruvananthapuram', state: 'Kerala', lat: 8.507, lon: 76.956, baseTemp: 29.8, humidityBase: 85, condition: 'Tropical Maritime Showers & High Ocean Swell', conditionCode: 'rain' },
  { id: 'bhopal', name: 'Bhopal (Bairagarh)', district: 'Bhopal', state: 'Madhya Pradesh', lat: 23.287, lon: 77.337, baseTemp: 31.8, humidityBase: 50, condition: 'Moderate Northerly Breeze with Clear Skies', conditionCode: 'clear' },
  { id: 'patna', name: 'Patna (Airport Met)', district: 'Patna', state: 'Bihar', lat: 25.591, lon: 85.088, baseTemp: 32.0, humidityBase: 76, condition: 'Humid Gangetic Inflow & Scattered Low Clouds', conditionCode: 'cloudy' },
  { id: 'lucknow', name: 'Lucknow (Amausi)', district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.761, lon: 80.883, baseTemp: 33.1, humidityBase: 68, condition: 'Warm Hazy Sunshine with Light South-Easterly Drift', conditionCode: 'partly-cloudy' },
  { id: 'portblair', name: 'Port Blair (Haddo Met)', district: 'South Andaman', state: 'Andaman & Nicobar Islands', lat: 11.668, lon: 92.730, baseTemp: 28.5, humidityBase: 92, condition: 'Active Intertropical Convergence Band & Squally Wind', conditionCode: 'cyclonic-squall' },
];

export class MockWeatherProvider implements IWeatherProvider {
  readonly providerName = 'IMD-Synthetic-MockEngine-v1';

  private findStation(locationId: string): StationMetadata {
    const station = INDIAN_STATIONS.find(
      (s) => s.id.toLowerCase() === locationId.toLowerCase() || s.name.toLowerCase().includes(locationId.toLowerCase())
    );
    if (!station) {
      // Default to Delhi if not matched
      return INDIAN_STATIONS[0];
    }
    return station;
  }

  async getCurrentWeather(locationId: string): Promise<WeatherObservation> {
    const st = this.findStation(locationId);
    const now = new Date();

    return {
      id: `obs_${st.id}_${now.getTime()}`,
      locationId: st.id,
      locationName: st.name,
      district: st.district,
      state: st.state,
      latitude: st.lat,
      longitude: st.lon,
      observedAt: now.toISOString(),
      temperature: st.baseTemp,
      feelsLike: Math.round((st.baseTemp + (st.humidityBase > 70 ? 3.5 : 1.0)) * 10) / 10,
      tempMin: Math.round((st.baseTemp - 5.5) * 10) / 10,
      tempMax: Math.round((st.baseTemp + 4.2) * 10) / 10,
      humidity: st.humidityBase,
      pressure: 1008.4,
      windSpeed: 18.5,
      windDirection: 'SW',
      windGust: 28.0,
      visibility: 7.5,
      cloudCover: st.humidityBase > 75 ? 65 : 20,
      precipitation: st.conditionCode === 'rain' ? 3.8 : st.conditionCode === 'thunderstorm' ? 14.5 : 0.0,
      precipitationProbability: st.conditionCode === 'rain' ? 85 : st.conditionCode === 'thunderstorm' ? 90 : 15,
      condition: st.condition,
      conditionCode: st.conditionCode,
      uvIndex: st.conditionCode === 'heatwave' ? 11 : 7,
      dewPoint: Math.round((st.baseTemp - (100 - st.humidityBase) / 5) * 10) / 10,
      airQualityIndex: st.id === 'delhi' ? 198 : st.id === 'mumbai' ? 92 : 65,
      airQualityCategory: st.id === 'delhi' ? 'Poor' : st.id === 'mumbai' ? 'Moderate' : 'Good',
      source: 'IMD National Observation Network (Synthetic Demo)',
      sourceStation: `${st.name} [STN-${st.id.toUpperCase()}]`,
      quality: 'VALIDATED',
      dataFreshness: 'DEMO',
      isDemo: true,
      ingestedAt: now.toISOString(),
      createdAt: now.toISOString(),
    };
  }

  async getForecast(locationId: string): Promise<ForecastRecord> {
    const st = this.findStation(locationId);
    const now = new Date();

    const hourly: HourlyForecastItem[] = [];
    for (let i = 1; i <= 24; i++) {
      const forecastTime = new Date(now.getTime() + i * 3600 * 1000);
      const tempVar = Math.sin((i / 24) * Math.PI * 2) * 4;
      hourly.push({
        time: forecastTime.toISOString(),
        temperature: Math.round((st.baseTemp + tempVar) * 10) / 10,
        feelsLike: Math.round((st.baseTemp + tempVar + 2) * 10) / 10,
        condition: st.condition,
        conditionCode: st.conditionCode,
        precipitationProbability: Math.min(100, Math.max(0, Math.round(st.humidityBase - 20 + Math.random() * 20))),
        rainfallMm: st.conditionCode === 'rain' ? 1.5 : 0,
        windSpeed: Math.round((14 + Math.random() * 10) * 10) / 10,
        windDirection: 'SW',
        humidity: st.humidityBase,
      });
    }

    const daily: DailyForecastItem[] = [];
    for (let d = 0; d < 7; d++) {
      const forecastDate = new Date(now.getTime() + d * 86400 * 1000);
      daily.push({
        date: forecastDate.toISOString().split('T')[0],
        tempMin: Math.round((st.baseTemp - 6) * 10) / 10,
        tempMax: Math.round((st.baseTemp + 4) * 10) / 10,
        condition: st.condition,
        conditionCode: st.conditionCode,
        precipitationProbability: st.conditionCode === 'rain' ? 75 : 20,
        rainfallMm: st.conditionCode === 'rain' ? 8.2 : 0,
        windSpeed: 16,
        uvIndex: 8,
        summary: `Typical seasonal conditions expected across ${st.district} area.`,
      });
    }

    return {
      id: `fc_${st.id}_${now.getTime()}`,
      locationId: st.id,
      locationName: st.name,
      provider: this.providerName,
      issuedAt: now.toISOString(),
      validFrom: now.toISOString(),
      validUntil: new Date(now.getTime() + 7 * 86400 * 1000).toISOString(),
      hourly,
      daily,
      summaryText: `7-day meteorological outlook for ${st.name}: Dominant condition is ${st.condition}.`,
      createdAt: now.toISOString(),
    };
  }

  async getHistoricalWeather(locationId: string, limit = 7): Promise<WeatherObservation[]> {
    const st = this.findStation(locationId);
    const observations: WeatherObservation[] = [];
    const now = Date.now();

    for (let i = 0; i < limit; i++) {
      const pastTime = new Date(now - i * 86400 * 1000);
      observations.push({
        id: `obs_hist_${st.id}_${i}`,
        locationId: st.id,
        locationName: st.name,
        district: st.district,
        state: st.state,
        latitude: st.lat,
        longitude: st.lon,
        observedAt: pastTime.toISOString(),
        temperature: st.baseTemp - (i % 3),
        feelsLike: st.baseTemp - (i % 3) + 1.2,
        tempMin: st.baseTemp - 6,
        tempMax: st.baseTemp + 3,
        humidity: st.humidityBase,
        pressure: 1010 - (i % 4),
        windSpeed: 15,
        windDirection: 'W',
        visibility: 8.0,
        cloudCover: 30,
        precipitation: 0,
        precipitationProbability: 10,
        condition: 'Stable Atmospheric Flow',
        conditionCode: 'partly-cloudy',
        uvIndex: 7,
        source: 'IMD Historical Archives (Verified Demonstration)',
        quality: 'VALIDATED',
        dataFreshness: 'STALE',
        ingestedAt: pastTime.toISOString(),
        createdAt: pastTime.toISOString(),
      });
    }

    return observations;
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}

export const weatherProvider = new MockWeatherProvider();
