import React from 'react';
import { Card } from '../ui/Card';
import { RiskAssessment } from '../../types/risk';
import { RISK_LEVEL_CONFIG } from '../../config/theme';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface OverallRiskGaugeProps {
  assessment: RiskAssessment;
  onOpenExplanation: () => void;
}

export const OverallRiskGauge: React.FC<OverallRiskGaugeProps> = ({
  assessment,
  onOpenExplanation,
}) => {
  const config = RISK_LEVEL_CONFIG[assessment.overallLevel];

  // Calculate SVG circular arc values
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (assessment.overallScore / 100) * circumference;

  return (
    <Card variant="glass" className="p-6 flex flex-col items-center text-center relative overflow-hidden">
      {/* Top Tag & Demo Badge */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-300">Composite Multi-Hazard Index</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
          Simulated Risk Model
        </span>
      </div>

      {/* SVG Radial Dial */}
      <div className="relative my-6 flex items-center justify-center">
        <svg className="w-48 h-48 -rotate-90">
          {/* Background Track */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            className="text-slate-800/80 fill-none"
          />
          {/* Animated Value Arc */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke={config.color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="fill-none transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score & Level */}
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-extrabold text-white font-sans tabular-numbers">
            {assessment.overallScore}
          </span>
          <span className="text-[11px] font-mono text-slate-400">/ 100</span>
          <span
            className={`mt-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.bg} ${config.border} ${config.textColor}`}
          >
            {assessment.overallLevel}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 max-w-sm mb-4">
        {assessment.locationName}: {assessment.overallLevel} vulnerability based on synoptic rainfall intensity, convective storm energy, and river level telemetries.
      </p>

      {/* Action Button: Why is this risk high? */}
      <button
        onClick={onOpenExplanation}
        className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-sky-500/20 text-xs font-semibold text-slate-200 hover:text-sky-300 border border-slate-700 hover:border-sky-500/40 transition-all flex items-center justify-center gap-2"
      >
        <HelpCircle className="w-4 h-4 text-sky-400" />
        <span>Why is this risk score high? (Diagnostic Breakdown)</span>
      </button>
    </Card>
  );
};
