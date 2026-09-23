'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';
import { locationService } from '../services/locationService';
import { LocationInfo } from '../types/location';
import { DEFAULT_LOCATIONS } from '../config/constants';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  MapPin,
  Search,
  Star,
  CheckCircle2,
  Radio,
  Navigation,
  Plus,
  RefreshCw,
  Download,
  Trash2,
  X,
  Compass,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const INDIAN_STATES_AND_UTS = [
  'All States & UTs',
  'Andaman and Nicobar',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const LocationsPage: React.FC = () => {
  const { t } = useLanguage();
  const {
    activeLocationId,
    setActiveLocationId,
    setActiveLocation,
    currentLocation,
    isUsingCurrentLocation,
    detectAndSetCurrentLocation,
    locationLoading,
  } = useWeather();
  const router = useRouter();

  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'critical'>('all');
  const [favorites, setFavorites] = useState<string[]>(['bhubaneswar', 'kolkata', 'delhi']);
  const [primaryLocationId, setPrimaryLocationId] = useState<string>('delhi');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add location modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalStateFilter, setModalStateFilter] = useState('');
  const [modalSearchResults, setModalSearchResults] = useState<LocationInfo[]>(DEFAULT_LOCATIONS);
  const [isModalSearching, setIsModalSearching] = useState(false);

  // Load user saved tracked locations on mount
  useEffect(() => {
    const loadSaved = async () => {
      const saved = await locationService.getSavedLocations();
      setLocations(saved);
    };
    loadSaved();
  }, []);

  // Nationwide live search inside the Add Location modal
  useEffect(() => {
    if (!isAddModalOpen) return;
    const timer = setTimeout(async () => {
      setIsModalSearching(true);
      try {
        const stateArg = modalStateFilter && modalStateFilter !== 'All States & UTs' ? modalStateFilter : undefined;
        const data = await locationService.searchLocations(modalSearchQuery, {
          state: stateArg,
          limit: 30,
        });
        setModalSearchResults(data);
      } catch {
        // Fallback
      } finally {
        setIsModalSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [modalSearchQuery, modalStateFilter, isAddModalOpen]);

  const handleSelect = (locId: string) => {
    const matched = locations.find((l) => l.id.toLowerCase() === locId.toLowerCase());
    if (matched) {
      setActiveLocation(matched);
    } else {
      setActiveLocationId(locId);
    }
    router.push('/dashboard');
  };

  const handleUseCurrentLocation = async () => {
    await detectAndSetCurrentLocation();
    router.push('/dashboard');
  };

  const toggleFavorite = (e: React.MouseEvent, locId: string) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(locId) ? prev.filter((id) => id !== locId) : [...prev, locId]
    );
  };

  const handleRemoveLocation = async (e: React.MouseEvent, locId: string) => {
    e.stopPropagation();
    const updated = await locationService.removeSavedLocation(locId);
    setLocations(updated);
    setFavorites((prev) => prev.filter((id) => id !== locId));
  };

  const handleSetPrimary = (e: React.MouseEvent, locId: string) => {
    e.stopPropagation();
    setPrimaryLocationId(locId);
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    const saved = await locationService.getSavedLocations();
    setLocations(saved);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleExportList = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(locations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'weathergpt-locations.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered locations based on active tab and search query on saved locations
  const filteredLocations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return locations.filter((loc) => {
      const matchesSearch =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeTab === 'favorites') {
        return favorites.includes(loc.id);
      }
      if (activeTab === 'critical') {
        // Coastal or high-hazard monitoring stations
        return ['bhubaneswar', 'kolkata', 'chennai', 'mumbai'].includes(loc.id.toLowerCase());
      }
      return true;
    });
  }, [locations, activeTab, favorites, searchQuery]);

  const handleAddLocationFromModal = async (loc: LocationInfo) => {
    const updated = await locationService.saveLocation(loc);
    setLocations(updated);
    setIsAddModalOpen(false);
    setModalSearchQuery('');
    setModalStateFilter('');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t('locations.title', 'Saved & Monitored Locations')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('locations.subtitle', 'Manage your tracked Indian cities, agricultural districts, and critical weather monitoring stations')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            {t('locations.addLocation', 'Add Location')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            {t('locations.refreshAll', 'Refresh All')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportList}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            {t('locations.exportList', 'Export List')}
          </Button>
        </div>
      </div>

      {/* Featured Current Location Hero Banner */}
      <Card
        variant="glass"
        className={`p-6 border transition-all ${
          isUsingCurrentLocation
            ? 'border-emerald-500/70 bg-gradient-to-r from-navy-900 via-emerald-950/20 to-navy-900 shadow-glow-cyan'
            : 'border-slate-700/80 bg-navy-900/90'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Navigation className={`w-5 h-5 ${locationLoading ? 'animate-spin' : ''}`} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {t('locations.gps.title', 'Your Real-Time Current Location (GPS)')}
                  </h3>
                  {isUsingCurrentLocation && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> {t('locations.gps.active', 'Active Telemetry Source')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {currentLocation
                    ? `${currentLocation.name}, ${currentLocation.district} (${currentLocation.state}) · ${currentLocation.lat.toFixed(3)}°N, ${currentLocation.lon.toFixed(3)}°E`
                    : t('locations.gps.desc', 'Determine hyper-local meteorological conditions using your browser GPS')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant={isUsingCurrentLocation ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleUseCurrentLocation}
              disabled={locationLoading}
              icon={<Navigation className="w-4 h-4 text-emerald-400" />}
            >
              {locationLoading
                ? t('locations.gps.acquiring', 'Acquiring GPS...')
                : isUsingCurrentLocation
                ? t('locations.gps.refresh', 'Refresh GPS Telemetry')
                : t('locations.gps.use', 'Use My Current Location')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('locations.searchPlaceholder', 'Search saved locations...')}
            className="w-full h-10 pl-10 pr-4 bg-navy-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-navy-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-sky-500 text-navy-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('locations.tabs.all', 'All Saved')}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'favorites'
                ? 'bg-sky-500 text-navy-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('locations.tabs.favorites', 'Favorites')}
          </button>
          <button
            onClick={() => setActiveTab('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'critical'
                ? 'bg-sky-500 text-navy-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('locations.tabs.critical', 'Critical Alerts Active')}
          </button>
        </div>
      </div>

      {/* Locations Grid or Empty State */}
      {filteredLocations.length === 0 ? (
        <Card variant="glass" className="p-12 text-center space-y-3">
          <Compass className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">
            {t('locations.empty.title', 'No Saved Locations Yet')}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {t('locations.empty.desc', 'Search and bookmark Indian cities or monitoring stations to track their live telemetry and disaster alerts here.')}
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
                setIsAddModalOpen(true);
              }}
            >
              {t('locations.empty.action', 'Explore Indian Cities')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((loc) => {
            const isActive = !isUsingCurrentLocation && loc.id === activeLocationId;
            const isFavorite = favorites.includes(loc.id);
            const isPrimary = primaryLocationId === loc.id;

            return (
              <Card
                key={loc.id}
                variant="glass"
                hover
                className={`p-5 space-y-3 cursor-pointer transition-all ${
                  isActive ? 'border-sky-500/70 bg-navy-850 shadow-glow-cyan' : ''
                }`}
                onClick={() => handleSelect(loc.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-white">{loc.name}</h3>
                      {isPrimary && (
                        <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                          {t('locations.card.primaryBadge', 'Primary Location')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{loc.district}, {loc.state}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => toggleFavorite(e, loc.id)}
                      className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                      aria-label="Toggle favorite"
                    >
                      <Star
                        className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`}
                      />
                    </button>
                    <button
                      onClick={(e) => handleRemoveLocation(e, loc.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                      aria-label={t('locations.card.remove', 'Remove')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-slate-500" />
                    {t('locations.card.code', 'Code:')} {loc.stationCode || 'AWS'}
                  </span>
                  <span>{loc.elevationMeters}m MSL</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Button
                    variant={isActive ? 'primary' : 'secondary'}
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(loc.id);
                    }}
                  >
                    {isActive
                      ? t('locations.card.currentlyViewing', 'Currently Viewing')
                      : t('locations.card.viewForecast', 'View Full Forecast')}
                  </Button>

                  {!isPrimary && (
                    <button
                      onClick={(e) => handleSetPrimary(e, loc.id)}
                      className="w-full text-center text-[10px] text-slate-400 hover:text-amber-300 transition-colors pt-1"
                    >
                      {t('locations.card.setPrimary', 'Set as Primary')}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Location Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in">
          <Card
            variant="elevated"
            className="w-full max-w-lg p-6 bg-navy-900 border-slate-700 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {t('locations.modal.title', 'Add New Monitored Location')}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder={t('locations.modal.searchPlaceholder', 'Search 7,000+ Indian cities, towns & district HQs...')}
                  className="w-full h-10 pl-10 pr-4 bg-navy-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                  autoFocus
                />
              </div>
              <select
                value={modalStateFilter}
                onChange={(e) => setModalStateFilter(e.target.value)}
                className="h-10 px-3 bg-navy-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {INDIAN_STATES_AND_UTS.map((st) => (
                  <option key={st} value={st === 'All States & UTs' ? '' : st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/60">
              {isModalSearching ? (
                <div className="py-8 text-center text-xs text-sky-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching nationwide Indian location catalog...</span>
                </div>
              ) : modalSearchResults.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {t('locations.modal.noResults', 'No locations found matching your query')}
                </div>
              ) : (
                modalSearchResults.map((loc) => (
                  <div
                    key={loc.id}
                    className="pt-2 pb-2 flex items-center justify-between hover:bg-slate-800/40 px-2.5 rounded-lg transition-colors gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{loc.name}</span>
                        {loc.localityType && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-medium">
                            {loc.localityType}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {loc.district}, {loc.state} · <span className="font-mono text-[10px] text-slate-500">{loc.lat.toFixed(2)}°N, {loc.lon.toFixed(2)}°E</span>
                        {loc.elevationMeters ? ` · ${loc.elevationMeters}m` : ''}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddLocationFromModal(loc)}
                      className="shrink-0"
                    >
                      {t('locations.modal.addBtn', 'Add to Tracked')}
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Source: GeoNames Official Gazetteer (7,392 verified Indian locations)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                {t('locations.modal.cancel', 'Cancel')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
