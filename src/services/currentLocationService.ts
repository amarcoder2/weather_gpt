import { LocationInfo } from '../types/location';
import { WeatherData } from '../types/weather';
import { ForecastData } from '../types/forecast';
import { RiskAssessment } from '../types/risk';
import { apiClient } from './apiClient';

export interface CurrentLocationDetails extends LocationInfo {
  isCurrentLocation: true;
  accuracyMeters?: number;
  detectedAt: string;
}

export interface CurrentLocationWeatherResult {
  location: CurrentLocationDetails;
  weather: WeatherData;
  forecast: ForecastData;
  risk: RiskAssessment;
}

class CurrentLocationService {
  private cachedLocation: CurrentLocationDetails | null = null;
  private cachedResult: CurrentLocationWeatherResult | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('weathergpt_cached_current_location');
        if (saved) {
          this.cachedLocation = JSON.parse(saved);
        }
      } catch {
        // Ignore JSON error
      }
    }
  }

  getCachedLocation(): CurrentLocationDetails | null {
    return this.cachedLocation;
  }

  getCachedResult(): CurrentLocationWeatherResult | null {
    return this.cachedResult;
  }

  /**
   * Requests single-shot GPS coordinates using the browser Geolocation API.
   * Does NOT continuously track the user.
   */
  async acquireCoordinates(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser.');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let message = 'Unable to determine your location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access was not granted. You can select a city manually.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is currently unavailable. Please verify GPS settings.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out. Please try again.';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 120000, // 2 minutes
        }
      );
    });
  }

  /**
   * Reverse-geocodes coordinates to identify city, district, state, and country.
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<{
    city: string;
    district: string;
    state: string;
    country: string;
    display_name: string;
  }> {
    try {
      const res = await apiClient.get<{
        city: string;
        district: string;
        state: string;
        country: string;
        display_name: string;
      }>(`/location/reverse?latitude=${latitude}&longitude=${longitude}`);

      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fall through to default
    }

    return {
      city: 'Current Location',
      district: 'Local Area',
      state: 'India',
      country: 'India',
      display_name: `Current Location (${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E)`,
    };
  }

  /**
   * Fetches real-time weather, forecast, and risk telemetry for the user's coordinates.
   */
  async getCurrentLocationWeather(): Promise<CurrentLocationWeatherResult> {
    const coords = await this.acquireCoordinates();
    const geo = await this.reverseGeocode(coords.latitude, coords.longitude);

    const locationDetails: CurrentLocationDetails = {
      id: 'current-location',
      name: geo.city,
      district: geo.district,
      state: geo.state,
      lat: coords.latitude,
      lon: coords.longitude,
      stationCode: 'GPS-LIVE',
      isCurrentLocation: true,
      accuracyMeters: Math.round(coords.accuracy),
      detectedAt: new Date().toISOString(),
    };

    // Save to local storage for instant warm load
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('weathergpt_cached_current_location', JSON.stringify(locationDetails));
      } catch {
        // Safe local storage
      }
    }
    this.cachedLocation = locationDetails;

    // Fetch coordinate-based weather
    const queryParams = new URLSearchParams({
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString(),
      city: geo.city,
      district: geo.district,
      state: geo.state,
    });

    const res = await apiClient.get<{
      weather: WeatherData;
      forecast: ForecastData;
      risk: RiskAssessment;
    }>(`/weather/coordinates?${queryParams.toString()}`);

    if (res.success && res.data) {
      const result: CurrentLocationWeatherResult = {
        location: locationDetails,
        weather: res.data.weather,
        forecast: res.data.forecast,
        risk: res.data.risk,
      };
      this.cachedResult = result;

      // Asynchronously attempt to save to user profile if authenticated
      this.saveToUserProfile(coords.latitude, coords.longitude, geo.display_name).catch(() => {});

      return result;
    }

    throw new Error('Could not fetch meteorological telemetry for your current location.');
  }

  private async saveToUserProfile(latitude: number, longitude: number, locationName: string): Promise<void> {
    try {
      await apiClient.post('/location/save', {
        latitude,
        longitude,
        location_name: locationName,
      });
    } catch {
      // Non-blocking if guest or offline
    }
  }
}

export const currentLocationService = new CurrentLocationService();
