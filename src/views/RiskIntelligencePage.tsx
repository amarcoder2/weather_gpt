'use client';

import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
import { useLanguage } from '../context/LanguageContext';
import { OverallRiskGauge } from '../components/risk/OverallRiskGauge';
import { HazardRiskBar } from '../components/risk/HazardRiskBar';
import { RiskExplanationModal } from '../components/risk/RiskExplanationModal';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ShieldAlert, Info, Database, CheckCircle2 } from 'lucide-react';

export const RiskIntelligencePage: React.FC = () => {
  const { risk, loading, error } = useWeather();
  const { t } = useLanguage();
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-28 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-5 h-80 rounded-2xl" />
          <Skeleton className="lg:col-span-7 h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !risk) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <EmptyState
          title={t('risk.engineOffline')}
          description={t('risk.engineOfflineDesc')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t('risk.title')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('risk.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-navy-900 px-3 py-1.5 rounded-full border border-slate-800 text-xs font-mono text-slate-400">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>{t('risk.demoModel')}</span>
        </div>
      </div>

      {/* Main Gauges & Individual Hazards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <OverallRiskGauge
            assessment={risk}
            onOpenExplanation={() => setIsExplanationOpen(true)}
          />

          {/* Scientific Disclaimer Card */}
          <Card variant="glass" className="p-5 border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <Info className="w-4 h-4" />
              <span>{t('risk.diagnosticEngine')}</span>
            </div>
            <p className="leading-relaxed">
              {t('risk.diagnosticDesc')}
            </p>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('risk.hazardBreakdown')}
            </h3>
            <span className="text-xs text-slate-400 font-mono">{t('risk.sensorLayers')}</span>
          </div>

          <HazardRiskBar hazards={risk.hazards} />
        </div>
      </div>

      {/* Risk Factors Breakdown Table */}
      <Card variant="glass" className="p-6">
        <h3 className="text-base font-bold text-white mb-4">
          {t('risk.driversTitle')}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">{t('risk.tableRiskFactor')}</th>
                <th className="pb-3 font-semibold">{t('risk.tableMetric')}</th>
                <th className="pb-3 font-semibold">{t('risk.tableWeightage')}</th>
                <th className="pb-3 font-semibold">{t('risk.tableConsequence')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {risk.factors.map((f, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="py-3 font-semibold text-white">{f.name}</td>
                  <td className="py-3 font-mono text-sky-300">{f.value}</td>
                  <td className="py-3">
                    <Badge
                      variant={
                        f.contribution === 'High'
                          ? 'danger'
                          : f.contribution === 'Medium'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {f.contribution}
                    </Badge>
                  </td>
                  <td className="py-3 text-slate-300 max-w-sm">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Diagnostic Explanation Modal */}
      <RiskExplanationModal
        isOpen={isExplanationOpen}
        onClose={() => setIsExplanationOpen(false)}
        assessment={risk}
      />
    </div>
  );
};
