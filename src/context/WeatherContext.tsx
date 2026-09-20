'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WeatherData } from '../types/weather';
import { ForecastData } from '../types/forecast';
import { RiskAssessment } from '../types/risk';
import { LocationInfo } from '../types/location';
import { weatherService } from '../services/weatherService';
import { forecastService } from '../services/forecastService';
import { riskService } from '../services/riskService';
import { currentLocationService } from '../services/currentLocationService';
import { DEFAULT_LOCATIONS } from '../config/constants';

interface WeatherContextType {
  activeLocationId: string;
  setActiveLocationId: (id: string) => void;
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
    : DEFAULT_LOCATIONS.find((l) => l.id === activeLocationId) || DEFAULT_LOCATIONS[0];

  const setActiveLocationId = (id: string) => {
    setLocationPermissionError(null);
    setActiveLocationIdState(id);
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
        } else {
          // Fresh detection
          const res = await currentLocationService.getCurrentLocationWeather();
          setCurrentLocation(res.location);
          setWeather(res.weather);
          setForecast(res.forecast);
          setRisk(res.risk);
        }
      } else {
        const [w, f, r] = await Promise.all([
          weatherService.getCurrentWeather(locId),
          forecastService.getForecast(locId),
          riskService.getRiskAssessment(locId),
        ]);
        setWeather(w);
        setForecast(f);
        setRisk(r);
      }
    } catch (err) {
      console.error('Failed to load meteorological data:', err);
      setError('Unable to fetch live meteorological data. Please retry.');
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
