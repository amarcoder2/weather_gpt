import React from 'react';
import { Card } from '../ui/Card';

interface AtmosphericMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  subtitle?: string;
  statusBadge?: {
    text: string;
    color: 'emerald' | 'amber' | 'sky' | 'purple' | 'red';
  };
}

export const AtmosphericMetricCard: React.FC<AtmosphericMetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  subtitle,
  statusBadge,
}) => {
  const badgeColorStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
  }[statusBadge?.color || 'sky'];

  return (
    <Card variant="glass" hover className="p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <span className="text-slate-300">{icon}</span>
          {title}
        </span>
        {statusBadge && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeColorStyles}`}>
            {statusBadge.text}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white tabular-numbers font-sans">
            {value}
          </span>
          {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
        </div>
        {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </Card>
  );
};
