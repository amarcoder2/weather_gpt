'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WeatherData } from '../types/weather';
import { ForecastData } from '../types/forecast';
import { RiskAssessment } from '../types/risk';
import { LocationInfo } from '../types/location';
import { currentLocationService } from '../services/currentLocationService';
import { locationService } from '../services/locationService';
import { DEFAULT_LOCATIONS } from '../config/constants';
import { apiClient } from '../services/apiClient';

interface WeatherContextType {
  activeLocationId: string;
  setActiveLocationId: (id: string) => void;
  setActiveLocation: (location: LocationInfo) => void;
  activeLocation: LocationInfo;
  currentLocation: LocationInfo | null;
  isUsingCurrentLocation: boolean;
  detectAndSetCurrentLocation: () => Promise<boolean>;
  locationLoading: boolean;
  locationPermissionError: string | null;
  clearLocationError: () => void;
  weather: WeatherData | null;
  forecast: ForecastData | null;
  risk: RiskAssessment | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  tempUnit: 'C' | 'F';
  setTempUnit: (unit: 'C' | 'F') => void;
  formatTemp: (celsius: number) => string;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeLocationId, setActiveLocationIdState] = useState<string>('kolkata');
  const [resolvedLocation, setResolvedLocation] = useState<LocationInfo | null>(DEFAULT_LOCATIONS[0]);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationPermissionError, setLocationPermissionError] = useState<string | null>(null);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  // Check cached current location on boot
  useEffect(() => {
    const cached = currentLocationService.getCachedLocation();
    if (cached) {
      setCurrentLocation(cached);
    }
  }, []);

  const isUsingCurrentLocation = activeLocationId === 'current-location' || activeLocationId === 'current';

  // Active location object resolution
  const activeLocation: LocationInfo = isUsingCurrentLocation && currentLocation
    ? currentLocation
    : resolvedLocation && resolvedLocation.id === activeLocationId
    ? resolvedLocation
    : DEFAULT_LOCATIONS.find((l) => l.id === activeLocationId) || resolvedLocation || DEFAULT_LOCATIONS[0];

  const setActiveLocationId = (id: string) => {
    setLocationPermissionError(null);
    setActiveLocationIdState(id);
  };

  const setActiveLocation = (loc: LocationInfo) => {
    setLocationPermissionError(null);
    setResolvedLocation(loc);
    setActiveLocationIdState(loc.id);
  };

  const clearLocationError = () => {
    setLocationPermissionError(null);
  };

  const detectAndSetCurrentLocation = async (): Promise<boolean> => {
    setLocationLoading(true);
    setLocationPermissionError(null);
    try {
      const res = await currentLocationService.getCurrentLocationWeather();
      setCurrentLocation(res.location);
      setResolvedLocation(res.location);
      setWeather(res.weather);
      setForecast(res.forecast);
      setRisk(res.risk);
      setActiveLocationIdState('current-location');
      setLoading(false);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to determine your current location.';
      setLocationPermissionError(message);
      return false;
    } finally {
      setLocationLoading(false);
    }
  };

  const loadData = async (locId: string) => {
    setLoading(true);
    setError(null);
    try {
      if (locId === 'current-location' || locId === 'current') {
        const cachedRes = currentLocationService.getCachedResult();
        if (cachedRes) {
          setWeather(cachedRes.weather);
          setForecast(cachedRes.forecast);
          setRisk(cachedRes.risk);
          setCurrentLocation(cachedRes.location);
          setResolvedLocation(cachedRes.location);
        } else {
          // Fresh detection
          const res = await currentLocationService.getCurrentLocationWeather();
          setCurrentLocation(res.location);
          setResolvedLocation(res.location);
          setWeather(res.weather);
          setForecast(res.forecast);
          setRisk(res.risk);
        }
      } else {
        let loc: LocationInfo | undefined =
          resolvedLocation && resolvedLocation.id === locId
            ? resolvedLocation
            : await locationService.getLocationById(locId);

        if (!loc) {
          loc = DEFAULT_LOCATIONS.find((l) => l.id.toLowerCase() === locId.toLowerCase());
        }

        if (!loc) {
          throw new Error(
            `Location "${locId}" could not be resolved. Please search and select a valid location.`
          );
        }

        setResolvedLocation(loc);

        const params = new URLSearchParams({
          latitude: loc.lat.toString(),
          longitude: loc.lon.toString(),
          city: loc.name,
          district: loc.district,
          state: loc.state,
        });

        const res = await apiClient.get<{
          weather: WeatherData;
          forecast: ForecastData;
          risk: RiskAssessment;
        }>(`/weather/coordinates?${params.toString()}`);

        if (res.success && res.data?.weather && res.data?.forecast && res.data?.risk) {
          setWeather({
            ...res.data.weather,
            locationId: loc.id,
            locationName: loc.name,
            district: loc.district,
            state: loc.state,
            stationName: loc.stationCode
              ? `${loc.name} Weather Observatory (${loc.stationCode})`
              : `${loc.name} Weather Station`,
            dataFreshness: 'FRESH',
            isDemo: false,
          });
          setForecast({
            ...res.data.forecast,
            locationId: loc.id,
          });
          setRisk({
            ...res.data.risk,
            locationId: loc.id,
            locationName: loc.name,
            isDemoData: false,
          });
        } else {
          throw new Error(res.error?.message || `Unable to fetch live meteorological data for ${loc.name}.`);
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load meteorological data:', err);
      const msg = err instanceof Error ? err.message : 'Unable to fetch live meteorological data. Please retry.';
      setError(msg);
      setWeather(null);
      setForecast(null);
      setRisk(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeLocationId);
  }, [activeLocationId]);

  const refreshData = async () => {
    if (isUsingCurrentLocation) {
      await detectAndSetCurrentLocation();
    } else {
      await loadData(activeLocationId);
    }
  };

  const formatTemp = (celsius: number): string => {
    if (tempUnit === 'F') {
      const f = (celsius * 9) / 5 + 32;
      return `${Math.round(f)}°F`;
    }
    return `${Math.round(celsius * 10) / 10}°C`;
  };

  return (
    <WeatherContext.Provider
      value={{
        activeLocationId,
        setActiveLocationId,
        setActiveLocation,
        activeLocation,
        currentLocation,
        isUsingCurrentLocation,
        detectAndSetCurrentLocation,
        locationLoading,
        locationPermissionError,
        clearLocationError,
        weather,
        forecast,
        risk,
        loading,
        error,
        refreshData,
        tempUnit,
        setTempUnit,
        formatTemp,
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};
