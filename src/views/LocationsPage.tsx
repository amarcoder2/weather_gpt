'use client';

import React, { useState, useEffect } from 'react';
import { useWeather } from '../context/WeatherContext';
import { locationService } from '../services/locationService';
import { LocationInfo } from '../types/location';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MapPin, Search, Star, CheckCircle2, Radio, Navigation } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const LocationsPage: React.FC = () => {
  const {
    activeLocationId,
    setActiveLocationId,
    currentLocation,
    isUsingCurrentLocation,
    detectAndSetCurrentLocation,
    locationLoading,
  } = useWeather();
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadLocations = async () => {
      const data = await locationService.searchLocations(searchQuery);
      setLocations(data);
    };
    loadLocations();
  }, [searchQuery]);

  const handleSelect = (locId: string) => {
    setActiveLocationId(locId);
    router.push('/dashboard');
  };

  const handleUseCurrentLocation = async () => {
    await detectAndSetCurrentLocation();
    router.push('/dashboard');
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Observatory & Location Management
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Switch between your device’s live GPS coordinates and monitored IMD observation stations
          </p>
        </div>
      </div>

      {/* Featured Current Location Hero Banner (Requirement 6 & 11) */}
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
                  <h3 className="text-base font-bold text-white">Your Real-Time Current Location (GPS)</h3>
                  {isUsingCurrentLocation && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> Active Telemetry Source
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {currentLocation
                    ? `${currentLocation.name}, ${currentLocation.district} (${currentLocation.state}) · ${currentLocation.lat.toFixed(3)}°N, ${currentLocation.lon.toFixed(3)}°E`
                    : 'Determine hyper-local meteorological conditions using your browser GPS'}
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
                ? 'Acquiring GPS...'
                : isUsingCurrentLocation
                ? 'Refresh GPS Telemetry'
                : 'Use My Current Location'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Search Bar for Fixed Stations */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search city, district, or IMD observatory..."
          className="w-full h-10 pl-10 pr-4 bg-navy-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Location Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => {
          const isActive = !isUsingCurrentLocation && loc.id === activeLocationId;
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{loc.name}</h3>
                  <p className="text-xs text-slate-400">{loc.district}, {loc.state}</p>
                </div>
                {isActive ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/30">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <Star className="w-4 h-4 text-slate-500 hover:text-amber-400 transition-colors" />
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3 text-slate-500" />
                  Code: {loc.stationCode || 'AWS'}
                </span>
                <span>{loc.elevationMeters}m MSL</span>
              </div>

              <Button
                variant={isActive ? 'primary' : 'secondary'}
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(loc.id);
                }}
              >
                {isActive ? 'Currently Viewing' : 'Switch to Station'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
