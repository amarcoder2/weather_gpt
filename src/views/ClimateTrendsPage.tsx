'use client';

import React, { useState } from 'react';
import { MOCK_CLIMATE_TRENDS } from '../data/mockClimate';
import { AnomalyChart } from '../components/climate/AnomalyChart';
import { ClimateInsightPanel } from '../components/climate/ClimateInsightPanel';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';
import {
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Thermometer,
  CloudRain,
  Zap,
  Waves,
  Compass,
  FileText,
} from 'lucide-react';

export const ClimateTrendsPage: React.FC = () => {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<'10-year' | '20-year' | '30-year'>('10-year');
  const [selectedRegion, setSelectedRegion] = useState('allIndia');
  const [activeTab, setActiveTab] = useState<'tempAnomaly' | 'monsoon' | 'extremeEvents' | 'seaLevel'>('tempAnomaly');

  const currentTrend = MOCK_CLIMATE_TRENDS[selectedPeriod];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t('climate.title', 'Subcontinental Climate Trends & Anomalies')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              'climate.subtitle',
              'Evaluating historical baseline shifts, extreme weather intensity spikes, and precipitation restructuring across India'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => {
              alert('Generating IMD/IPCC Climate Analysis Summary...');
            }}
          >
            {t('climate.insights.downloadReport', 'Download Full Climate Report (PDF)')}
          </Button>
        </div>
      </div>

      {/* Control Bar: Region & Period Selectors */}
      <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Region Selector */}
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-sky-400 shrink-0" />
          <label htmlFor="climate-region-select" className="text-xs text-slate-300 font-medium">
            {t('climate.region.label', 'Select Region / Climate Zone')}:
          </label>
          <select
            id="climate-region-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="h-9 px-3 bg-navy-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="allIndia">{t('climate.region.allIndia', 'All-India Average')}</option>
            <option value="himalayan">{t('climate.region.himalayan', 'Himalayan Region')}</option>
            <option value="indoGangetic">{t('climate.region.indoGangetic', 'Indo-Gangetic Plain')}</option>
            <option value="peninsular">{t('climate.region.peninsular', 'Peninsular India')}</option>
            <option value="coastal">{t('climate.region.coastal', 'Coastal Zones')}</option>
          </select>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="text-xs text-slate-300 font-medium">
            {t('climate.period.label', 'Analysis Period')}:
          </span>
          <div className="flex rounded-lg bg-navy-950 border border-slate-800 p-0.5">
            <button
              onClick={() => setSelectedPeriod('10-year')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedPeriod === '10-year'
                  ? 'bg-sky-500 text-navy-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('climate.period.tenYear', '10-Year Decadal (2014-2024)')}
            </button>
            <button
              onClick={() => setSelectedPeriod('20-year')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedPeriod === '20-year'
                  ? 'bg-sky-500 text-navy-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('climate.period.twentyYear', '20-Year Long-Term (2004-2024)')}
            </button>
            <button
              onClick={() => setSelectedPeriod('30-year')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedPeriod === '30-year'
                  ? 'bg-sky-500 text-navy-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('climate.period.thirtyYear', '30-Year Climatological (1994-2024)')}
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="p-4 border border-slate-800/80">
          <div className="text-xs text-slate-400">{t('climate.metrics.warmingTrend', 'Mean Surface Warming')}</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">+{currentTrend.avgTempRise}°C</div>
          <div className="text-[10px] text-slate-500 mt-0.5">IMD / IPCC WG1 AR6</div>
        </Card>
        <Card variant="glass" className="p-4 border border-slate-800/80">
          <div className="text-xs text-slate-400">
            {t('climate.metrics.monsoonVariability', 'Monsoon Variability Index')}
          </div>
          <div className="text-2xl font-bold text-sky-400 mt-1">+{currentTrend.rainfallShiftPct}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Hydrological departure</div>
        </Card>
        <Card variant="glass" className="p-4 border border-slate-800/80">
          <div className="text-xs text-slate-400">{t('climate.metrics.heatwaveDays', 'Heatwave Days / Year')}</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">18.4 Days</div>
          <div className="text-[10px] text-slate-500 mt-0.5">+4.2 days decadal drift</div>
        </Card>
        <Card variant="glass" className="p-4 border border-slate-800/80">
          <div className="text-xs text-slate-400">{t('climate.metrics.projectedShift', 'Projected 2050 Shift')}</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">+1.8°C</div>
          <div className="text-[10px] text-slate-500 mt-0.5">CMIP6 SSP2-4.5</div>
        </Card>
      </div>

      {/* Focus Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('tempAnomaly')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'tempAnomaly'
              ? 'border-sky-500 text-white bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5" />
          {t('climate.tabs.tempAnomaly', 'Temperature Anomaly')}
        </button>
        <button
          onClick={() => setActiveTab('monsoon')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'monsoon'
              ? 'border-sky-500 text-white bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          {t('climate.tabs.monsoon', 'Monsoon Precipitation')}
        </button>
        <button
          onClick={() => setActiveTab('extremeEvents')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'extremeEvents'
              ? 'border-sky-500 text-white bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          {t('climate.tabs.extremeEvents', 'Extreme Event Frequency')}
        </button>
        <button
          onClick={() => setActiveTab('seaLevel')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'seaLevel'
              ? 'border-sky-500 text-white bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          {t('climate.tabs.seaLevel', 'Sea Level Rise')}
        </button>
      </div>

      {/* Anomaly Chart */}
      <AnomalyChart records={currentTrend.records} period={selectedPeriod} />

      {/* Plain Language Interpretation */}
      <ClimateInsightPanel trend={currentTrend} />

      {/* Key Climate Insights & Projections Section */}
      <Card variant="glass" className="p-6 space-y-4 border border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('climate.insights.keyProjections', 'Key Climate Insights & Projections')}
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {t('climate.source.label', 'Source: IMD Climate Research & IPCC AR6')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800 space-y-1">
            <span className="font-semibold text-white block">
              {t('climate.insights.monsoonShift', 'Monsoon Onset & Withdrawal Shifts')}
            </span>
            <p className="text-slate-400 text-xs leading-relaxed">
              Extended dry stretches interspersed with intense 24-48 hour precipitation bursts, impacting agricultural sowing windows.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800 space-y-1">
            <span className="font-semibold text-white block">
              {t('climate.insights.himalayanGlaciers', 'Himalayan Glacial Mass Balance')}
            </span>
            <p className="text-slate-400 text-xs leading-relaxed">
              Accelerated terminus retreat elevating Glacial Lake Outburst Flood (GLOF) potential across Bhagirathi and Alaknanda catchments.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800 space-y-1">
            <span className="font-semibold text-white block">
              {t('climate.insights.extremePrecip', 'Extreme Precipitation Concentration')}
            </span>
            <p className="text-slate-400 text-xs leading-relaxed">
              Sub-hourly rainfall intensity rising over coastal cities (Mumbai, Chennai, Kochi) challenging municipal stormwater drainage baselines.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800 space-y-1">
            <span className="font-semibold text-white block">
              {t(
                'climate.insights.recommendations',
                'Adaptive Recommendations for Agriculture & Urban Planning'
              )}
            </span>
            <p className="text-slate-400 text-xs leading-relaxed">
              Deployment of climate-resilient flood channels, hyper-local automated weather stations, and crop weather advisory systems.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
