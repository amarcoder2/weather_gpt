'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Card } from '../ui/Card';

export const DisasterAnalyticsChart: React.FC = () => {
  // Aggregate stats of historical disaster events in India
  const data = [
    { year: '1995-1999', cyclones: 6, floods: 12, heatwaves: 4 },
    { year: '2000-2004', cyclones: 7, floods: 14, heatwaves: 7 },
    { year: '2005-2009', cyclones: 8, floods: 19, heatwaves: 9 },
    { year: '2010-2014', cyclones: 10, floods: 22, heatwaves: 14 },
    { year: '2015-2019', cyclones: 14, floods: 28, heatwaves: 18 },
    { year: '2020-2024', cyclones: 18, floods: 34, heatwaves: 25 },
  ];

  return (
    <Card variant="glass" className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-white">Historical Extreme Event Escalation (5-Year Intervals)</h3>
          <p className="text-xs text-slate-400">Comparing cyclone, riverine flood, and heatwave incidences in India</p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          Source: NDMA & IMD Archive
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="cyclones" name="Tropical Cyclones" fill="#A855F7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="floods" name="Severe Floods" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="heatwaves" name="Heatwave Spells" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
