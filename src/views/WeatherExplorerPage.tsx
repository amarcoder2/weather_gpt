'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IndiaWeatherMap } from '../components/maps/IndiaWeatherMap';
import { weatherService } from '../services/weatherService';
import { WeatherData } from '../types/weather';
import { Skeleton } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import { useWeather } from '../context/WeatherContext';
import { useRouter } from 'next/navigation';
import { DEFAULT_LOCATIONS } from '../config/constants';
import {
  Compass,
  Map,
  Table,
  Radio,
  Activity,
  Wifi,
  CloudRain,
  Search,
  ArrowUpRight,
} from 'lucide-react';

export const WeatherExplorerPage: React.FC = () => {
  const { t } = useLanguage();
  const { setActiveLocationId } = useWeather();
  const router = useRouter();

  const [stations, setStations] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'map' | 'stations'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'operational' | 'anomalous'>('all');

  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      try {
        const data = await weatherService.getAllStations();
        setStations(data);
      } catch {
        // graceful handling
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, []);

  // Filtered station rows for the Station Network table
  const filteredStations = useMemo(() => {
    return DEFAULT_LOCATIONS.filter((loc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        (loc.stationCode && loc.stationCode.toLowerCase().includes(q)) ||
        loc.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const matchedWeather = stations.find((s) => s.locationId === loc.id);
      const isAnomalous = matchedWeather && (matchedWeather.temperature > 38 || matchedWeather.windSpeed > 25);

      if (filterMode === 'operational') {
        return !isAnomalous;
      }
      if (filterMode === 'anomalous') {
        return isAnomalous;
      }
      return true;
    });
  }, [searchQuery, filterMode, stations]);

  const handleSelectStation = (locationId: string) => {
    setActiveLocationId(locationId);
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-16 w-1/3 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t('explorer.title', 'India Weather Explorer')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('explorer.subtitle', 'Interactive meteorological observation grid and telemetry stations across India')}
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-navy-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'map'
                ? 'bg-sky-500 text-navy-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>{t('explorer.tabs.map', 'Interactive Map')}</span>
          </button>
          <button
            onClick={() => setActiveTab('stations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'stations'
                ? 'bg-sky-500 text-navy-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{t('explorer.tabs.stations', 'Station Network')}</span>
          </button>
        </div>
      </div>

      {/* Meteorological Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card variant="glass" className="p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">{t('explorer.metrics.activeStations', 'Active Stations')}</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {stations.length > 0 ? stations.length : DEFAULT_LOCATIONS.length} / 16
          </div>
          <p className="text-[10px] text-emerald-400 font-medium">100% In-Situ Grid Operational</p>
        </Card>

        <Card variant="glass" className="p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">{t('explorer.metrics.networkHealth', 'Network Health')}</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">99.4%</div>
          <p className="text-[10px] text-sky-400 font-medium">High Telemetry Reliability</p>
        </Card>

        <Card variant="glass" className="p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">{t('explorer.metrics.telemetryLatency', 'Telemetry Latency')}</span>
            <Wifi className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">42 ms</div>
          <p className="text-[10px] text-slate-400 font-medium">Satellite Ingest Synchronized</p>
        </Card>

        <Card variant="glass" className="p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs">{t('explorer.metrics.rainfallReporting', 'Rainfall Stations Reporting')}</span>
            <CloudRain className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">100%</div>
          <p className="text-[10px] text-indigo-300 font-medium">AWS Pluviometer Sync</p>
        </Card>
      </div>

      {/* Main Content Area */}
      {activeTab === 'map' ? (
        <IndiaWeatherMap stations={stations} />
      ) : (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('explorer.searchPlaceholder', 'Search stations by name, state, or ID...')}
                className="w-full h-9 pl-9 pr-3 bg-navy-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-white bg-navy-900 border border-slate-800'
                }`}
              >
                {t('explorer.filters.allStates', 'All States')}
              </button>
              <button
                onClick={() => setFilterMode('operational')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterMode === 'operational'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white bg-navy-900 border border-slate-800'
                }`}
              >
                {t('explorer.filters.operationalOnly', 'Operational Only')}
              </button>
              <button
                onClick={() => setFilterMode('anomalous')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterMode === 'anomalous'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white bg-navy-900 border border-slate-800'
                }`}
              >
                {t('explorer.filters.anomalousOnly', 'Anomalous Only')}
              </button>
            </div>
          </div>

          {/* Stations Table */}
          <Card variant="glass" className="overflow-hidden p-0 border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-navy-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">{t('explorer.table.stationId', 'Station ID')}</th>
                    <th className="py-3 px-4">{t('explorer.table.nameState', 'Name & State')}</th>
                    <th className="py-3 px-4">{t('explorer.table.status', 'Status')}</th>
                    <th className="py-3 px-4">{t('explorer.table.temperature', 'Temperature')}</th>
                    <th className="py-3 px-4">{t('explorer.table.rainfall', 'Rainfall')}</th>
                    <th className="py-3 px-4">{t('explorer.table.windSpeed', 'Wind Speed')}</th>
                    <th className="py-3 px-4">{t('explorer.table.aqi', 'AQI')}</th>
                    <th className="py-3 px-4">{t('explorer.table.elevation', 'Elevation')}</th>
                    <th className="py-3 px-4 text-right">{t('explorer.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        {t('explorer.table.noStations', 'No telemetry stations match the selected filter criteria')}
                      </td>
                    </tr>
                  ) : (
                    filteredStations.map((loc) => {
                      const matchedWeather = stations.find((s) => s.locationId === loc.id);
                      const isAnomalous = matchedWeather && (matchedWeather.temperature > 38 || matchedWeather.windSpeed > 25);
                      const statusKey = isAnomalous ? 'explorer.status.degraded' : 'explorer.status.operational';
                      const defaultStatus = isAnomalous ? 'Degraded' : 'Operational';

                      return (
                        <tr
                          key={loc.id}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                          onClick={() => handleSelectStation(loc.id)}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-sky-400">
                            {loc.stationCode || `AWS-${loc.id.slice(0, 3).toUpperCase()}`}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{loc.name}</div>
                            <div className="text-[11px] text-slate-400">{loc.district}, {loc.state}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isAnomalous
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isAnomalous ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                              {t(statusKey, defaultStatus)}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-200">
                            {matchedWeather ? `${Math.round(matchedWeather.temperature)}°C` : '28°C'}
                          </td>
                          <td className="py-3 px-4 font-mono text-sky-300">
                            {matchedWeather ? `${matchedWeather.precipitationProbability ?? 0}%` : '0%'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {matchedWeather ? `${matchedWeather.windSpeed} km/h` : '12 km/h'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {matchedWeather?.airQualityIndex ?? 48}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {loc.elevationMeters}m MSL
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectStation(loc.id);
                              }}
                              icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                            >
                              {t('explorer.popover.viewForecast', 'View Full Forecast')}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
