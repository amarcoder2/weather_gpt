'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWeather } from '../context/WeatherContext';
import { CurrentWeatherHero } from '../components/weather/CurrentWeatherHero';
import { AtmosphericMetricCard } from '../components/weather/AtmosphericMetricCard';
import { AirQualityIndexCard } from '../components/weather/AirQualityIndexCard';
import { HourlyForecastChart } from '../components/forecast/HourlyForecastChart';
import { OverallRiskGauge } from '../components/risk/OverallRiskGauge';
import { RiskExplanationModal } from '../components/risk/RiskExplanationModal';
import { AlertBanner } from '../components/alerts/AlertBanner';
import { MOCK_ALERTS } from '../data/mockAlerts';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Droplets,
  Wind,
  Compass,
  Sun,
  Eye,
  Cloud,
  Thermometer,
  Bot,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { weather, forecast, risk, loading, error, refreshData } = useWeather();
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <EmptyState
          title="Telemetry Connection Issue"
          description="Unable to reach the automated weather observation station. Please verify your connection or retry."
          actionText="Retry Telemetry Ingest"
          onAction={refreshData}
        />
      </div>
    );
  }

  // Find relevant alert for this location if any
  const locationAlert = MOCK_ALERTS.find(
    (a) =>
      a.location.toLowerCase().includes(weather.locationName.toLowerCase()) ||
      a.state.toLowerCase().includes(weather.state.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Active Disaster Alert Ticker if relevant */}
      {locationAlert && <AlertBanner alert={locationAlert} />}

      {/* Main Weather Hero Card */}
      <CurrentWeatherHero weather={weather} />

      {/* Atmospheric Telemetry Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Atmospheric Sensors & In-Situ Observations
          </h3>
          <button
            onClick={refreshData}
            className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <AtmosphericMetricCard
            title="Relative Humidity"
            value={weather.humidity}
            unit="%"
            icon={<Droplets className="w-4 h-4 text-sky-400" />}
            subtitle="Dew pt: 25.1°C"
            statusBadge={{ text: weather.humidity > 75 ? 'Elevated' : 'Normal', color: 'sky' }}
          />
          <AtmosphericMetricCard
            title="Wind & Gusts"
            value={weather.windSpeed}
            unit="km/h"
            icon={<Wind className="w-4 h-4 text-indigo-400" />}
            subtitle={`Gusts to ${weather.windGust} km/h (${weather.windDirection})`}
            statusBadge={{ text: 'Active', color: 'purple' }}
          />
          <AtmosphericMetricCard
            title="Barometric Pressure"
            value={weather.pressure}
            unit="hPa"
            icon={<Compass className="w-4 h-4 text-emerald-400" />}
            subtitle="Sea-level normalized"
            statusBadge={{ text: 'Falling', color: 'amber' }}
          />
          <AtmosphericMetricCard
            title="UV Radiation"
            value={weather.uvIndex}
            unit="/ 11"
            icon={<Sun className="w-4 h-4 text-amber-400" />}
            subtitle="Peak at solar noon"
            statusBadge={{ text: weather.uvIndex >= 7 ? 'High' : 'Moderate', color: 'amber' }}
          />
          <AtmosphericMetricCard
            title="Optical Visibility"
            value={weather.visibility}
            unit="km"
            icon={<Eye className="w-4 h-4 text-sky-300" />}
            subtitle="Haze & rain attenuation"
            statusBadge={{ text: 'Adequate', color: 'emerald' }}
          />
          <AtmosphericMetricCard
            title="Cloud Fraction"
            value={weather.cloudCover}
            unit="%"
            icon={<Cloud className="w-4 h-4 text-slate-400" />}
            subtitle="Cumulonimbus bands"
            statusBadge={{ text: 'Overcast', color: 'sky' }}
          />
        </div>
      </div>

      {/* Air Quality & Risk Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <AirQualityIndexCard
            aqi={weather.airQualityIndex}
            category={weather.airQualityCategory}
            pm25={weather.pm25}
            pm10={weather.pm10}
          />

          {forecast && <HourlyForecastChart hourlyData={forecast.hourly} />}
        </div>

        <div className="lg:col-span-5 space-y-6">
          {risk && (
            <OverallRiskGauge
              assessment={risk}
              onOpenExplanation={() => setIsExplanationOpen(true)}
            />
          )}

          {/* Quick AI Question Assist Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 to-indigo-950/60 border border-indigo-500/30 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-sky-400">
              <Bot className="w-5 h-5" />
              <h4 className="text-sm font-bold text-white">Ask WeatherGPT about this area</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Have specific questions about tomorrow's rainfall, waterlogging threats, or agricultural recommendations?
            </p>
            <Link href="/chat" className="block pt-1">
              <Button variant="primary" size="sm" className="w-full" icon={<Bot className="w-4 h-4" />}>
                Start Conversational Query
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Risk Diagnostic Breakdown Modal */}
      <RiskExplanationModal
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        assessment={risk}
      />
    </div>
  );
};
