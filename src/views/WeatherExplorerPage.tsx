'use client';

import React, { useState, useEffect } from 'react';
import { IndiaWeatherMap } from '../components/maps/IndiaWeatherMap';
import { weatherService } from '../services/weatherService';
import { WeatherData } from '../types/weather';
import { Skeleton } from '../components/ui/Skeleton';

export const WeatherExplorerPage: React.FC = () => {
  const [stations, setStations] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      const data = await weatherService.getAllStations();
      setStations(data);
      setLoading(false);
    };
    fetchStations();
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-16 w-1/3 rounded-xl" />
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <IndiaWeatherMap stations={stations} />
    </div>
  );
};
