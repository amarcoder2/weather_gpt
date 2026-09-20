import React from 'react';
import { Card } from '../ui/Card';
import { ShieldAlert, MapPin } from 'lucide-react';

interface AlertMapPreviewProps {
  onSelectZone?: (location: string) => void;
}

export const AlertMapPreview: React.FC<AlertMapPreviewProps> = ({ onSelectZone }) => {
  const alertZones = [
    { name: 'Odisha & Bengal Coast', type: 'Cyclone / Gale Surge', severity: 'Critical', color: 'bg-red-500', top: '56%', left: '72%' },
    { name: 'Brahmaputra Valley (Assam)', type: 'River Flood', severity: 'Warning', color: 'bg-orange-500', top: '38%', left: '85%' },
    { name: 'Delhi NCR & NW Plains', type: 'Severe Heatwave', severity: 'Warning', color: 'bg-orange-500', top: '32%', left: '42%' },
    { name: 'Gangetic West Bengal', type: 'Severe Lightning', severity: 'Watch', color: 'bg-amber-400', top: '52%', left: '76%' },
    { name: 'Konkan Coast (Mumbai)', type: 'High Swell Tide', severity: 'Information', color: 'bg-sky-400', top: '64%', left: '34%' },
  ];

  return (
    <Card variant="glass" className="p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            National Geospatial Hazard Overlay (India)
          </h3>
          <p className="text-xs text-slate-400">
            Multi-hazard telemetry mapped across active IMD meteorological sub-divisions
          </p>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
          GIS Active
        </span>
      </div>

      {/* Stylized India Spatial Map Canvas / Container */}
      <div className="relative h-80 w-full bg-navy-950/90 rounded-xl border border-slate-800 flex items-center justify-center p-4 overflow-hidden">
        {/* Geographic Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Abstract India Silhouette representation */}
        <svg viewBox="0 0 400 450" className="w-full h-full max-w-sm opacity-30 text-sky-500 stroke-current fill-sky-950/20" strokeWidth="1.5">
          <path d="M190 20 L220 50 L250 80 L230 110 L280 130 L320 120 L350 150 L340 190 L290 200 L270 230 L250 280 L220 340 L190 410 L160 340 L140 280 L120 220 L100 170 L130 130 L160 80 Z" />
          <path d="M300 140 L370 140 L390 170 L340 180 Z" strokeDasharray="3 3" />
        </svg>

        {/* Interactive Alert Pins */}
        {alertZones.map((zone, idx) => (
          <div
            key={idx}
            style={{ top: zone.top, left: zone.left }}
            onClick={() => onSelectZone && onSelectZone(zone.name)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
          >
            <div className="relative flex items-center justify-center">
              <span className={`absolute w-7 h-7 rounded-full ${zone.color} opacity-40 animate-ping`} />
              <span className={`w-3.5 h-3.5 rounded-full ${zone.color} border-2 border-navy-950 shadow-lg`} />
            </div>

            {/* Tooltip Card on Hover */}
            <div className="hidden group-hover:block absolute bottom-6 left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-xl bg-navy-900 border border-slate-700 shadow-2xl z-20 pointer-events-none">
              <p className="text-xs font-bold text-white">{zone.name}</p>
              <p className="text-[11px] text-sky-300 font-medium">{zone.type}</p>
              <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                Severity: {zone.severity}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            Critical Zone
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            Warning Zone
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Watch Zone
          </span>
        </div>

        <span className="text-[11px] font-mono text-slate-500">
          Source: IMD Earth Observation GIS Grid
        </span>
      </div>
    </Card>
  );
};
