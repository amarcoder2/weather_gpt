import React from 'react';
import { WeatherAlert } from '../../types/alert';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const RichAlertCard: React.FC<{ alert: WeatherAlert }> = ({ alert }) => {
  return (
    <Card variant="elevated" className="p-4 my-2 border-red-500/40 bg-navy-900 max-w-md">
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge severity={alert.severity} dot>
          {alert.severity} · {alert.category}
        </Badge>
        <span className="text-[11px] font-mono text-slate-400">IMD Bulletin</span>
      </div>

      <h4 className="text-sm font-bold text-white">{alert.title}</h4>
      <p className="text-xs text-slate-300 mt-1">{alert.headline}</p>

      <div className="mt-3 pt-2 border-t border-slate-800 space-y-1">
        <p className="text-[11px] font-semibold text-amber-300">Action Required:</p>
        <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
          {alert.recommendedActions.slice(0, 2).map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
};
