'use client';

import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';
import { HourlyForecastChart } from '../components/forecast/HourlyForecastChart';
import { SevenDayForecastList } from '../components/forecast/SevenDayForecastList';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { CloudSun, Compass, Calendar } from 'lucide-react';

export const ForecastPage: React.FC = () => {
  const { weather, forecast, loading, error } = useWeather();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'both' | 'hourly' | 'daily'>('both');

  const tabs = [
    { id: 'both', label: t('forecast.completeOutlook', 'Complete Outlook (Hourly + 7-Day)') },
    { id: 'hourly', label: t('forecast.synoptic24h', '24-Hour Synoptic') },
    { id: 'daily', label: t('forecast.synoptic7d', '7-Day Synoptic') },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (error || !forecast || !weather) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <EmptyState
          title={t('forecast.unavailable', 'Forecast Simulation Unavailable')}
          description={t('forecast.unavailableDesc', 'Could not load numerical prediction model feeds for this location.')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t('forecast.title', 'Numerical Weather Prediction Outlook')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('forecast.station', 'Forecasting Station')}: <strong className="text-slate-200">{weather.locationName}</strong>, {weather.state} (IMD Multi-Model Ensemble)
          </p>
        </div>

        <Tabs tabs={tabs} activeTab={viewMode} onChange={(id) => setViewMode(id as any)} />
      </div>

      {/* Synoptic Overview Card */}
      <Card variant="glass" className="p-5 border-sky-500/30 bg-navy-900/90">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
              {t('forecast.discussion', 'Synoptic Meteorological Discussion')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {forecast.synopticOverview}
            </p>
          </div>
        </div>
      </Card>

      {/* Hourly Section */}
      {(viewMode === 'both' || viewMode === 'hourly') && (
        <HourlyForecastChart hourlyData={forecast.hourly} />
      )}

      {/* 7-Day Section */}
      {(viewMode === 'both' || viewMode === 'daily') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" />
            <h3 className="text-base font-bold text-white">{t('forecast.dailyBreakdown', '7-Day Day-by-Day Forecast Breakdown')}</h3>
          </div>
          <SevenDayForecastList dailyData={forecast.daily} />
        </div>
      )}
    </div>
  );
};
