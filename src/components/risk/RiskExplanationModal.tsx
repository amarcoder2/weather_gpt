import React from 'react';
import { Modal } from '../ui/Modal';
import { RiskAssessment } from '../../types/risk';
import { Badge } from '../ui/Badge';
import { CheckCircle, AlertCircle, Info, Database } from 'lucide-react';

interface RiskExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: RiskAssessment | null;
}

export const RiskExplanationModal: React.FC<RiskExplanationModalProps> = ({
  isOpen,
  onClose,
  assessment,
}) => {
  if (!assessment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Risk Diagnostic Engine: ${assessment.locationName}`}
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Core Scientific Narrative */}
        <div className="p-4 rounded-xl bg-navy-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>AI Risk Attribution Summary</span>
          </div>
          <p className="text-slate-300 leading-relaxed">{assessment.explanation}</p>
        </div>

        {/* Contributing Factor Breakdown */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            Key Environmental Risk Drivers & Weightages:
          </h4>
          <div className="space-y-2">
            {assessment.factors.map((factor, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-navy-850 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{factor.name}</span>
                    <Badge
                      variant={
                        factor.contribution === 'High'
                          ? 'danger'
                          : factor.contribution === 'Medium'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {factor.contribution} Impact
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{factor.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xs text-sky-300 font-medium">
                    {factor.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Action Directives */}
        <div className="p-4 rounded-xl bg-navy-950/60 border border-slate-800">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            Decision Support Recommendations:
          </h4>
          <ul className="space-y-1.5">
            {assessment.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800 flex items-center gap-1">
          <Database className="w-3 h-3 text-slate-500" />
          Note: Phase 1 utilizes simulated numerical datasets structured for future IMD WRF/CWC telemetry ingest.
        </p>
      </div>
    </Modal>
  );
};
