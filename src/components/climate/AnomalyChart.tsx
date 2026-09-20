'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ClimateYearData } from '../../types/climate';
import { Card } from '../ui/Card';

interface AnomalyChartProps {
  records: ClimateYearData[];
  period: string;
}

export const AnomalyChart: React.FC<AnomalyChartProps> = ({ records, period }) => {
  return (
    <Card variant="glass" className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-white">
            Long-Term Thermal & Hydrological Anomalies ({period})
          </h3>
          <p className="text-xs text-slate-400">
            Temperature departure (°C) and extreme weather incidence index
          </p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
          Climatological Normal Baseline
        </span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={records} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
            <YAxis
              yAxisId="temp"
              stroke="#F59E0B"
              fontSize={11}
              tickFormatter={(v) => `+${v}°C`}
            />
            <YAxis
              yAxisId="events"
              orientation="right"
              stroke="#38BDF8"
              fontSize={11}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0B132B',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar
              yAxisId="events"
              dataKey="extremeEventsCount"
              name="Extreme Weather Episodes"
              fill="rgba(56, 189, 248, 0.4)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="tempAnomaly"
              name="Temperature Anomaly (°C)"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{ r: 4, fill: '#F59E0B' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
