import React from 'react';
import { Card } from '../ui/Card';
import { Wind, Activity, AlertCircle } from 'lucide-react';

interface AirQualityIndexCardProps {
  aqi: number;
  category: 'Good' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';
  pm25: number;
  pm10: number;
}

export const AirQualityIndexCard: React.FC<AirQualityIndexCardProps> = ({
  aqi,
  category,
  pm25,
  pm10,
}) => {
  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case 'Good':
        return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
      case 'Moderate':
        return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
      case 'Poor':
        return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
      case 'Very Poor':
      case 'Severe':
        return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
      default:
        return { color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' };
    }
  };

  const style = getCategoryStyles(category);

  return (
    <Card variant="glass" className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-100">National Air Quality Index (NAQI)</h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.color}`}>
          {category}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 items-center">
        {/* Main AQI Score */}
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-extrabold font-sans tabular-numbers ${style.color}`}>
            {aqi}
          </span>
          <span className="text-xs text-slate-400 font-mono">AQI Score</span>
        </div>

        {/* PM Pollutants */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">PM2.5 (Fine particles)</span>
            <span className="font-mono text-slate-200">{pm25} µg/m³</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full"
              style={{ width: `${Math.min((pm25 / 60) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">PM10 (Coarse dust)</span>
            <span className="font-mono text-slate-200">{pm10} µg/m³</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full"
              style={{ width: `${Math.min((pm10 / 100) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        Air quality is acceptable; unusually sensitive individuals should consider limiting prolonged outdoor exertion.
      </p>
    </Card>
  );
};
