import React from 'react';
import { ClimateTrend } from '../../types/climate';
import { Card } from '../ui/Card';
import { CheckCircle2, ShieldQuestion } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ClimateInsightPanelProps {
  trend: ClimateTrend;
}

export const ClimateInsightPanel: React.FC<ClimateInsightPanelProps> = ({ trend }) => {
  const { t } = useLanguage();

  return (
    <Card variant="glass" className="p-6 space-y-5">
      <div className="flex items-center gap-2 text-sky-400">
        <ShieldQuestion className="w-5 h-5" />
        <h3 className="text-base font-bold text-white tracking-tight">
          {t('climate.insights.title', 'What Does This Trend Mean for Disaster Preparedness?')}
        </h3>
      </div>

      <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
        {trend.interpretation}
      </div>

      {/* Key Metric Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">
            {t('climate.insights.surfaceWarming', 'Mean Surface Warming')}
          </span>
          <span className="text-xl font-bold text-amber-400 font-sans tabular-numbers">
            +{trend.avgTempRise}°C
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {t('climate.insights.vsPreIndustrial', 'vs Pre-industrial norm')}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">
            {t('climate.insights.rainVolatility', 'Heavy Rain Volatility Shift')}
          </span>
          <span className="text-xl font-bold text-sky-400 font-sans tabular-numbers">
            +{trend.rainfallShiftPct}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {t('climate.insights.flashFloodRisk', 'Hydrological flash flood risk')}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">
            {t('climate.insights.eventFrequency', 'Extreme Event Frequency')}
          </span>
          <span className="text-xl font-bold text-purple-400 font-sans tabular-numbers">
            +{trend.extremeWeatherIncreasePct}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {t('climate.insights.hazardEscalation', 'High-impact hazard escalation')}
          </span>
        </div>
      </div>

      {/* Primary Climate Drivers */}
      <div>
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
          {t('climate.insights.driversTitle', 'Primary Meteorological & Oceanographic Drivers:')}
        </h4>
        <div className="space-y-2">
          {trend.keyDrivers.map((driver, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{driver}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
