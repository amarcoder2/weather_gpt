'use client';

import React, { useState } from 'react';
import { MOCK_CLIMATE_TRENDS } from '../data/mockClimate';
import { AnomalyChart } from '../components/climate/AnomalyChart';
import { ClimateInsightPanel } from '../components/climate/ClimateInsightPanel';
import { Tabs } from '../components/ui/Tabs';
import { TrendingUp, Database } from 'lucide-react';

export const ClimateTrendsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'10-year' | '20-year' | '30-year'>('10-year');

  const periodTabs = [
    { id: '10-year', label: '10-Year Decadal (2014-2024)' },
    { id: '20-year', label: '20-Year Long-Term (2004-2024)' },
    { id: '30-year', label: '30-Year Climatological (1994-2024)' },
  ];

  const currentTrend = MOCK_CLIMATE_TRENDS[selectedPeriod];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Subcontinental Climate Trends & Anomalies
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluating historical baseline shifts, extreme weather intensity spikes, and precipitation restructuring across India
          </p>
        </div>

        <Tabs
          tabs={periodTabs}
          activeTab={selectedPeriod}
          onChange={(id) => setSelectedPeriod(id as any)}
        />
      </div>

      {/* Anomaly Chart */}
      <AnomalyChart records={currentTrend.records} period={selectedPeriod} />

      {/* Plain Language Interpretation */}
      <ClimateInsightPanel trend={currentTrend} />
    </div>
  );
};
