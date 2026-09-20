'use client';

import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';
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
          title="Risk Engine Offline"
          description="Unable to compute composite vulnerability index for this location."
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
              Multi-Hazard Risk Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Predictive vulnerability scoring synthesizing precipitation anomalies, thermodynamic energy, and hydrologic baselines
          </p>
        </div>

        <div className="flex items-center gap-2 bg-navy-900 px-3 py-1.5 rounded-full border border-slate-800 text-xs font-mono text-slate-400">
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span>Demo Risk Model (Phase 1)</span>
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
              <span>Diagnostic Explainability Engine</span>
            </div>
            <p className="leading-relaxed">
              In accordance with ethical AI standards, WeatherGPT does not output "black-box" risk numbers. Every vulnerability score is linked to transparent physical drivers (e.g., CAPE indices, WRF precipitation, river stage measurements).
            </p>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Categorical Hazard Severity Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-mono">6 Sensor Layers</span>
          </div>

          <HazardRiskBar hazards={risk.hazards} />
        </div>
      </div>

      {/* Risk Factors Breakdown Table */}
      <Card variant="glass" className="p-6">
        <h3 className="text-base font-bold text-white mb-4">
          Environmental Drivers & Hazard Multipliers
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Risk Factor</th>
                <th className="pb-3 font-semibold">Observed Metric / Telemetry</th>
                <th className="pb-3 font-semibold">Weightage</th>
                <th className="pb-3 font-semibold">Physical Consequence</th>
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
