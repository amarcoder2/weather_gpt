import React, { useState } from 'react';
import { WeatherMapLayer, MapStation, MapRegion } from '../../types/map';
import { LayerControls } from './LayerControls';
import { StationPopover } from './StationPopover';
import {
  INDIA_BOUNDARY_PATH,
  ANDAMAN_NICOBAR_PATH,
  LAKSHADWEEP_PATH,
  INDIA_REGIONAL_SUBDIVISIONS,
  INDIA_MAP_STATIONS,
} from '../../data/geoIndia';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Navigation, Info, ShieldAlert, Thermometer, CloudRain, Wind } from 'lucide-react';

interface IndiaWeatherMapProps {
  stations?: any[]; // For backwards compatibility
}

export const IndiaWeatherMap: React.FC<IndiaWeatherMapProps> = () => {
  const [activeLayer, setActiveLayer] = useState<WeatherMapLayer>('rainfall');
  const [selectedStation, setSelectedStation] = useState<MapStation | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<MapRegion | null>(null);

  // Render layer-specific overlays
  const renderLayerVisuals = () => {
    switch (activeLayer) {
      case 'temperature':
        return (
          <g className="transition-opacity duration-300 pointer-events-none">
            {/* Northwest Extreme Heat (>40°C) */}
            <circle cx="210" cy="200" r="85" fill="rgba(239, 68, 68, 0.28)" filter="blur(30px)" />
            <circle cx="230" cy="190" r="50" fill="rgba(249, 115, 22, 0.35)" filter="blur(20px)" />
            {/* Central Highlands Warm (33-36°C) */}
            <circle cx="260" cy="330" r="90" fill="rgba(245, 158, 11, 0.22)" filter="blur(30px)" />
            {/* Northern Himalayan Cool Zone (<20°C) */}
            <ellipse cx="260" cy="85" rx="70" ry="40" fill="rgba(56, 189, 248, 0.3)" filter="blur(25px)" />
          </g>
        );

      case 'rainfall':
        return (
          <g className="transition-opacity duration-300 pointer-events-none">
            {/* Bay of Bengal Cyclonic Monsoon Plume */}
            <ellipse cx="400" cy="320" rx="100" ry="80" fill="rgba(2, 132, 199, 0.35)" filter="blur(25px)" />
            <ellipse cx="380" cy="310" rx="60" ry="50" fill="rgba(56, 189, 248, 0.45)" filter="blur(15px)" />
            {/* Assam Brahmaputra Orographic Inundation */}
            <ellipse cx="485" cy="235" rx="55" ry="35" fill="rgba(2, 132, 199, 0.42)" filter="blur(18px)" />
            {/* Western Ghats Orographic Rain Belt */}
            <path
              d="M 175,340 Q 210,480 240,610"
              stroke="#38BDF8"
              strokeWidth="32"
              strokeOpacity="0.25"
              fill="none"
              filter="blur(12px)"
            />
          </g>
        );

      case 'wind':
        return (
          <g className="transition-opacity duration-300 pointer-events-none">
            {/* Arabian Sea Southwest Monsoonal Flow */}
            <path d="M 110,440 Q 150,390 190,360" stroke="#818CF8" strokeWidth="2.5" fill="none" strokeDasharray="8 6" className="animate-[dash_3s_linear_infinite]" />
            <path d="M 130,500 Q 180,450 230,420" stroke="#818CF8" strokeWidth="2.5" fill="none" strokeDasharray="8 6" />
            <path d="M 150,560 Q 200,520 250,500" stroke="#818CF8" strokeWidth="2.5" fill="none" strokeDasharray="8 6" />
            {/* Bay of Bengal Cyclonic Recurvature Flow */}
            <path d="M 450,440 Q 400,380 370,330" stroke="#38BDF8" strokeWidth="3" fill="none" strokeDasharray="10 6" />
            <path d="M 430,360 Q 380,310 330,270" stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeDasharray="8 6" />
          </g>
        );

      case 'alerts':
        return (
          <g className="transition-opacity duration-300 pointer-events-none">
            {/* Red Alert Zone (Odisha & West Bengal Coast) */}
            <circle cx="390" cy="320" r="55" fill="rgba(239, 68, 68, 0.4)" className="animate-pulse" filter="blur(18px)" />
            {/* Orange Warning Zone (Assam Brahmaputra) */}
            <circle cx="485" cy="240" r="45" fill="rgba(249, 115, 22, 0.4)" className="animate-pulse" filter="blur(15px)" />
            {/* Heatwave Warning Zone (Delhi & Rajasthan) */}
            <circle cx="225" cy="200" r="50" fill="rgba(249, 115, 22, 0.35)" className="animate-pulse" filter="blur(16px)" />
          </g>
        );

      case 'risk':
        return (
          <g className="transition-opacity duration-300 pointer-events-none">
            {/* High Vulnerability Deltas */}
            <circle cx="395" cy="315" r="70" fill="rgba(168, 85, 247, 0.3)" filter="blur(22px)" />
            <circle cx="480" cy="240" r="50" fill="rgba(239, 68, 68, 0.28)" filter="blur(18px)" />
            <circle cx="215" cy="195" r="60" fill="rgba(249, 115, 22, 0.25)" filter="blur(20px)" />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Layer Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            India Meteorological GIS Command Map
          </h2>
          <p className="text-xs text-slate-400">
            Geospatial projection of sovereign borders, regional sub-divisions, and 16 primary IMD observation stations
          </p>
        </div>

        <LayerControls activeLayer={activeLayer} onChange={setActiveLayer} />
      </div>

      <Card variant="glass" className="p-4 md:p-6 relative overflow-hidden flex flex-col items-center">
        {/* Map Viewport Container */}
        <div className="relative w-full max-w-3xl h-[580px] bg-navy-950/95 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
          {/* Scientific Geospatial Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b25_1px,transparent_1px),linear-gradient(to_bottom,#1e293b25_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

          {/* SVG Map of India (ViewBox 0 0 600 680) */}
          <svg viewBox="0 0 600 680" className="w-full h-full p-2 select-none">
            <defs>
              <linearGradient id="indiaLandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0a1936" />
                <stop offset="100%" stopColor="#050e21" />
              </linearGradient>
              <filter id="mapGlow">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Sovereign India Boundary */}
            <path
              d={INDIA_BOUNDARY_PATH}
              fill="url(#indiaLandGradient)"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeOpacity="0.75"
              className="transition-colors duration-300 drop-shadow-lg"
              filter="url(#mapGlow)"
            />

            {/* Island Territories */}
            <path
              d={ANDAMAN_NICOBAR_PATH}
              fill="#0a1936"
              stroke="#38bdf8"
              strokeWidth="1.8"
              strokeOpacity="0.7"
            />
            <path
              d={LAKSHADWEEP_PATH}
              fill="#0a1936"
              stroke="#38bdf8"
              strokeWidth="1.8"
              strokeOpacity="0.7"
            />

            {/* Regional Meteorological Sub-Divisions */}
            {INDIA_REGIONAL_SUBDIVISIONS.map((reg) => {
              const isSelected = selectedRegion?.id === reg.id;
              return (
                <path
                  key={reg.id}
                  d={reg.path}
                  fill={isSelected ? 'rgba(56, 189, 248, 0.22)' : 'transparent'}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  className="cursor-pointer hover:fill-sky-500/15 transition-all"
                  onClick={() => {
                    setSelectedRegion(reg);
                    setSelectedStation(null);
                  }}
                >
                  <title>{reg.name} (Click to inspect)</title>
                </path>
              );
            })}

            {/* Dynamic Weather Layer Visuals */}
            {renderLayerVisuals()}

            {/* 16 IMD Meteorological Station Markers */}
            {INDIA_MAP_STATIONS.map((st) => {
              const isSelected = selectedStation?.id === st.id;
              const hasAlert = Boolean(st.alertSeverity);

              return (
                <g
                  key={st.id}
                  transform={`translate(${st.x}, ${st.y})`}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStation(st);
                    setSelectedRegion(null);
                  }}
                >
                  {/* Pulse ring for active alert stations */}
                  {hasAlert && (
                    <circle
                      r="16"
                      className="fill-red-500/20 stroke-red-500/50 stroke-1 animate-ping"
                    />
                  )}

                  {/* Station Marker Dot */}
                  <circle
                    r={isSelected ? '9' : '6'}
                    className={`transition-all duration-200 ${
                      isSelected
                        ? 'fill-amber-400 stroke-white stroke-2 shadow-lg'
                        : hasAlert
                        ? 'fill-red-400 stroke-navy-950 stroke-1'
                        : 'fill-sky-400 group-hover:fill-sky-300 stroke-navy-950 stroke-1'
                    }`}
                  />

                  {/* Station Label */}
                  <text
                    x="10"
                    y="4"
                    fontSize="10.5"
                    fill="#f8fafc"
                    fontFamily="Inter, sans-serif"
                    fontWeight="600"
                    className="select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                  >
                    {st.name} {Math.round(st.temperature)}°
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Clicked Station Popover */}
          {selectedStation && (
            <div className="absolute bottom-4 right-4 z-40 max-w-xs">
              <StationPopover station={selectedStation} onClose={() => setSelectedStation(null)} />
            </div>
          )}

          {/* Clicked Region Summary Card */}
          {selectedRegion && !selectedStation && (
            <div className="absolute bottom-4 left-4 z-40 max-w-sm p-4 rounded-xl bg-navy-900/95 border border-slate-700 shadow-2xl backdrop-blur-md animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white">{selectedRegion.name}</span>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs py-2">
                <div>
                  <span className="text-slate-400 block">Avg Temperature</span>
                  <strong className="text-white font-mono">{selectedRegion.avgTemp}°C</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Rainfall Status</span>
                  <strong className="text-sky-300">{selectedRegion.rainfallStatus}</strong>
                </div>
              </div>
              {selectedRegion.activeAlert && (
                <div className="mt-1 p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-[11px] text-red-200">
                  {selectedRegion.activeAlert}
                </div>
              )}
            </div>
          )}

          {/* Compass Rose */}
          <div className="absolute top-4 right-4 p-2 rounded-xl bg-navy-900/80 border border-slate-800 text-slate-400 flex flex-col items-center">
            <Navigation className="w-4 h-4 text-sky-400" />
            <span className="text-[9px] font-mono font-bold mt-0.5">N</span>
          </div>

          {/* Live Station Count Indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-900/85 border border-slate-800 text-[11px] text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>16 IMD Observatories Live</span>
          </div>
        </div>

        {/* Professional Meteorological Legend */}
        <div className="w-full max-w-3xl mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Temperature Spectrum */}
          {activeLayer === 'temperature' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Temperature:</span>
              <div className="h-2.5 w-32 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-red-500" />
              <span className="font-mono text-[10px] text-slate-300">15°C (Cool) → 45°C (Extreme Heat)</span>
            </div>
          )}

          {/* Rainfall Spectrum */}
          {activeLayer === 'rainfall' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Precipitation DBZ:</span>
              <div className="h-2.5 w-32 rounded-full bg-gradient-to-r from-sky-800 via-cyan-400 to-blue-600" />
              <span className="font-mono text-[10px] text-slate-300">Light (5 mm) → Heavy Inundation (120+ mm)</span>
            </div>
          )}

          {/* Wind Flow */}
          {activeLayer === 'wind' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Streamlines:</span>
              <span className="font-mono text-[11px] text-indigo-300">
                Southwest Arabian Sea Monsoonal Advection (20-45 km/h)
              </span>
            </div>
          )}

          {/* Alerts */}
          {activeLayer === 'alerts' && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-red-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                Critical Bulletin
              </span>
              <span className="flex items-center gap-1 text-orange-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                Warning Alert
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Advisory Watch
              </span>
            </div>
          )}

          {/* Risk */}
          {activeLayer === 'risk' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Risk Composite:</span>
              <span className="font-mono text-[11px] text-purple-300">
                Low (0-30) · Moderate (30-60) · High (60-80) · Severe (80-100)
              </span>
            </div>
          )}

          {/* Observatory Layer */}
          {activeLayer === 'stations' && (
            <div className="flex items-center gap-2 text-slate-400">
              <span>Click any observatory pin to view real-time meteorological readouts</span>
            </div>
          )}

          <span className="text-[11px] font-mono text-slate-500 ml-auto">
            Projection: Albers Equidistant Conic (India)
          </span>
        </div>
      </Card>
    </div>
  );
};
