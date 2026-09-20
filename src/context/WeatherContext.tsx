'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WeatherData } from '../types/weather';
import { ForecastData } from '../types/forecast';
import { RiskAssessment } from '../types/risk';
import { weatherService } from '../services/weatherService';
import { forecastService } from '../services/forecastService';
import { riskService } from '../services/riskService';
import { DEFAULT_LOCATIONS } from '../config/constants';

interface WeatherContextType {
  activeLocationId: string;
  setActiveLocationId: (id: string) => void;
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
  const [activeLocationId, setActiveLocationId] = useState<string>('kolkata');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  const loadData = async (locId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [w, f, r] = await Promise.all([
        weatherService.getCurrentWeather(locId),
        forecastService.getForecast(locId),
        riskService.getRiskAssessment(locId),
      ]);
      setWeather(w);
      setForecast(f);
      setRisk(r);
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
    await loadData(activeLocationId);
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
