'use client';

import React from 'react';
import { MapStation } from '../../types/map';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { X, ArrowRight, Droplets, Wind, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWeather } from '../../context/WeatherContext';

interface StationPopoverProps {
  station: MapStation;
  onClose: () => void;
}

export const StationPopover: React.FC<StationPopoverProps> = ({ station, onClose }) => {
  const router = useRouter();
  const { setActiveLocationId, formatTemp } = useWeather();

  const handleOpenDashboard = () => {
    setActiveLocationId(station.id);
    router.push('/dashboard');
  };

  return (
    <Card
      variant="elevated"
      className="p-4 w-80 bg-navy-900/95 border-slate-700 shadow-2xl relative z-40 animate-in fade-in zoom-in-95 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-white">{station.name}</h4>
            <span className="text-[10px] font-mono text-slate-400">({station.state})</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {station.latitude.toFixed(2)}°N, {station.longitude.toFixed(2)}°E
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Close observatory details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Temperature & Condition */}
      <div className="my-3 flex items-baseline justify-between">
        <span className="text-3xl font-extrabold text-white tabular-numbers">
          {formatTemp(station.temperature)}
        </span>
        <span className="text-xs text-sky-300 font-semibold max-w-[150px] text-right truncate">
          {station.condition}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800 text-slate-300">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          <span>Humidity: {station.humidity}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-indigo-400" />
          <span>{station.windSpeed} km/h ({station.windDirection})</span>
        </div>
      </div>

      {/* Risk & Alert Callout */}
      <div className="mt-2.5 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            Risk Vulnerability:
          </span>
          <span className="font-bold text-white">
            {station.riskScore}/100 ({station.riskLevel})
          </span>
        </div>

        {station.alertSeverity && (
          <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-[11px] text-red-200">
            <div className="flex items-center gap-1 font-semibold mb-0.5">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              <span>{station.alertSeverity} Alert Active</span>
            </div>
            <p className="line-clamp-1 text-slate-300">{station.alertHeadline}</p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <Button
        variant="primary"
        size="sm"
        onClick={handleOpenDashboard}
        className="w-full mt-3"
        icon={<ArrowRight className="w-3.5 h-3.5" />}
      >
        Set as Active Observatory
      </Button>
    </Card>
  );
};
