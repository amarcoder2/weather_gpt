'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWeather } from '../context/WeatherContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  Bot,
  RefreshCw,
  MapPin,
  Search,
  AlertCircle,
  X,
  Navigation,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const {
    weather,
    forecast,
    risk,
    loading,
    error,
    refreshData,
    isUsingCurrentLocation,
    detectAndSetCurrentLocation,
    locationLoading,
    locationPermissionError,
    clearLocationError,
  } = useWeather();

  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  // Auto-attempt current location on initial dashboard load if user hasn't explicitly chosen a station
  useEffect(() => {
    if (!isUsingCurrentLocation && typeof window !== 'undefined' && 'geolocation' in navigator) {
      // Non-intrusively check if permission was already granted in browser
      navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          detectAndSetCurrentLocation();
        }
      }).catch(() => {});
    }
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-16 w-full rounded-2xl" />
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
          title={t('dashboard.connectionIssue', 'Telemetry Connection Issue')}
          description={t('dashboard.connectionIssueDesc', 'Unable to reach the automated weather observation station. Please verify your connection or retry.')}
          actionText={t('dashboard.retryTelemetry', 'Retry Telemetry Ingest')}
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
      {/* Location Permission Notification Banner if denied */}
      {locationPermissionError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-200 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-amber-300">
                {locationPermissionError}
              </p>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                {t('dashboard.locationDeniedDesc', 'Location access was not granted. You can select an observatory or city manually below.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/locations">
              <button className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold transition-colors">
                {t('dashboard.selectCityManually', 'Select City Manually')}
              </button>
            </Link>
            <button
              onClick={clearLocationError}
              className="p-1 text-amber-400 hover:text-white rounded-lg"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Personalized Welcome & Location Controller Banner (Section 11 Requirement) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-navy-900/95 via-navy-850 to-navy-900/95 border border-slate-700/80 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
              {t('dashboard.liveStation', 'Live Weather Station')}
            </span>
            {isUsingCurrentLocation ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Navigation className="w-3 h-3 text-emerald-400 animate-pulse" />
                {t('dashboard.currentLocation', 'Current Location (GPS Live)')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Compass className="w-3 h-3 text-sky-400" />
                {t('dashboard.selectedObservatory', 'Selected Observatory')}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5 tracking-tight font-sans">
            {t('dashboard.welcome', 'Welcome')},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">
              {user?.name || t('dashboard.citizenMeteorologist', 'Citizen Meteorologist')}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              {t('dashboard.viewingTelemetry', 'Currently viewing telemetry for')}{' '}
              <strong className="text-white font-bold">{weather.locationName}</strong>, {weather.district} ({weather.state})
            </span>
          </p>
        </div>

        {/* Location Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant={isUsingCurrentLocation ? 'primary' : 'secondary'}
            size="sm"
            onClick={detectAndSetCurrentLocation}
            disabled={locationLoading}
            className="shadow-sm"
            icon={<MapPin className={`w-4 h-4 text-emerald-400 ${locationLoading ? 'animate-bounce' : ''}`} />}
          >
            {locationLoading ? t('header.acquiringGPS', 'Acquiring GPS...') : `📍 ${t('header.useCurrentLocation', 'Use My Current Location')}`}
          </Button>

          <Link href="/locations">
            <Button
              variant="secondary"
              size="sm"
              icon={<Search className="w-4 h-4 text-sky-400" />}
            >
              {`🔎 ${t('common.searchLocation', 'Search Location')}`}
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Disaster Alert Ticker if relevant */}
      {locationAlert && <AlertBanner alert={locationAlert} />}

      {/* Main Weather Hero Card */}
      <CurrentWeatherHero weather={weather} />

      {/* Atmospheric Telemetry Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {t('dashboard.atmosphericSensors', 'Atmospheric Sensors & In-Situ Observations')}
          </h3>
          <button
            onClick={refreshData}
            className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('dashboard.refreshTelemetry', 'Refresh Telemetry')}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <AtmosphericMetricCard
            title={t('weather.relativeHumidity', 'Relative Humidity')}
            value={weather.humidity}
            unit="%"
            icon={<Droplets className="w-4 h-4 text-sky-400" />}
            subtitle={`${t('weather.dewPoint', 'Dew pt')}: ${weather.dewPoint}°C`}
            statusBadge={{ text: weather.humidity > 75 ? t('weather.elevated', 'Elevated') : t('weather.normal', 'Normal'), color: 'sky' }}
          />
          <AtmosphericMetricCard
            title={t('weather.windGust', 'Wind & Gusts')}
            value={weather.windSpeed}
            unit="km/h"
            icon={<Wind className="w-4 h-4 text-indigo-400" />}
            subtitle={`${t('weather.windGust', 'Gusts')} ${weather.windGust} km/h (${weather.windDirection})`}
            statusBadge={{ text: t('common.active', 'Active'), color: 'purple' }}
          />
          <AtmosphericMetricCard
            title={t('weather.atmosphericPressure', 'Barometric Pressure')}
            value={weather.pressure}
            unit="hPa"
            icon={<Compass className="w-4 h-4 text-emerald-400" />}
            subtitle={t('weather.seaLevelNormalized', 'Sea-level normalized')}
            statusBadge={{ text: t('weather.falling', 'Falling'), color: 'amber' }}
          />
          <AtmosphericMetricCard
            title={t('weather.uvIndex', 'UV Radiation')}
            value={weather.uvIndex}
            unit="/ 11"
            icon={<Sun className="w-4 h-4 text-amber-400" />}
            subtitle={t('weather.solarNoonPeak', 'Peak at solar noon')}
            statusBadge={{ text: weather.uvIndex >= 7 ? t('weather.high', 'High') : t('weather.moderate', 'Moderate'), color: 'amber' }}
          />
          <AtmosphericMetricCard
            title={t('weather.visibility', 'Optical Visibility')}
            value={weather.visibility}
            unit="km"
            icon={<Eye className="w-4 h-4 text-sky-300" />}
            subtitle={t('weather.hazeAttenuation', 'Haze & rain attenuation')}
            statusBadge={{ text: t('weather.adequate', 'Adequate'), color: 'emerald' }}
          />
          <AtmosphericMetricCard
            title={t('weather.cloudCover', 'Cloud Fraction')}
            value={weather.cloudCover}
            unit="%"
            icon={<Cloud className="w-4 h-4 text-slate-400" />}
            subtitle={t('weather.cumulonimbusBands', 'Cumulonimbus bands')}
            statusBadge={{ text: weather.cloudCover > 60 ? t('weather.overcast', 'Overcast') : t('weather.scattered', 'Scattered'), color: 'sky' }}
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
              <h4 className="text-sm font-bold text-white">{t('chat.askWeatherGPTArea', 'Ask WeatherGPT about this area')}</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Have specific questions about {weather.locationName}'s rainfall probability, waterlogging threats, or agricultural advisories?
            </p>
            <Link href="/chat" className="block pt-1">
              <Button variant="primary" size="sm" className="w-full" icon={<Bot className="w-4 h-4" />}>
                {t('chat.startQuery', 'Start Conversational Query')}
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
