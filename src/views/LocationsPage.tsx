'use client';

import React, { useState, useEffect } from 'react';
import { useWeather } from '../context/WeatherContext';
import { locationService } from '../services/locationService';
import { LocationInfo } from '../types/location';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MapPin, Search, Star, CheckCircle2, Radio, Compass } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const LocationsPage: React.FC = () => {
  const { activeLocationId, setActiveLocationId, formatTemp } = useWeather();
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
            Manage monitored observation stations, set preferred location, and compare regional parameters
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search city, district, or observatory..."
          className="w-full h-10 pl-10 pr-4 bg-navy-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Location Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => {
          const isActive = loc.id === activeLocationId;
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
                {isActive ? 'Currently Viewing' : 'Switch Location'}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
