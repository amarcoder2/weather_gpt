import React from 'react';
import { WeatherMapLayer } from '../../types/map';
import {
  Layers,
  Thermometer,
  CloudRain,
  Wind,
  AlertTriangle,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface LayerControlsProps {
  activeLayer: WeatherMapLayer;
  onChange: (layer: WeatherMapLayer) => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({ activeLayer, onChange }) => {
  const layers: { id: WeatherMapLayer; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'temperature', label: 'Temperature Heatmap', icon: <Thermometer className="w-4 h-4" />, color: 'text-amber-400' },
    { id: 'rainfall', label: 'Precipitation Radar', icon: <CloudRain className="w-4 h-4" />, color: 'text-sky-400' },
    { id: 'wind', label: 'Wind Streamlines', icon: <Wind className="w-4 h-4" />, color: 'text-indigo-400' },
    { id: 'alerts', label: 'Disaster Bulletins', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-400' },
    { id: 'risk', label: 'Vulnerability Index', icon: <ShieldCheck className="w-4 h-4" />, color: 'text-purple-400' },
    { id: 'stations', label: 'All IMD Observatories', icon: <Radio className="w-4 h-4" />, color: 'text-emerald-400' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-navy-900/90 border border-slate-800 rounded-2xl shadow-lg">
      <div className="hidden sm:flex items-center gap-1 px-2.5 text-xs font-semibold text-slate-400">
        <Layers className="w-3.5 h-3.5 text-sky-400" />
        <span>Meteorological Layers:</span>
      </div>
      {layers.map((layer) => {
        const isActive = activeLayer === layer.id;
        return (
          <button
            key={layer.id}
            onClick={() => onChange(layer.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isActive
                ? 'bg-sky-500 text-navy-950 font-bold shadow-md shadow-sky-500/25'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className={isActive ? 'text-navy-950' : layer.color}>{layer.icon}</span>
            <span>{layer.label}</span>
          </button>
        );
      })}
    </div>
  );
};
