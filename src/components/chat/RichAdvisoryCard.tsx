import React from 'react';
import { ChatAdvisoryData } from '../../types/chat';
import { Card } from '../ui/Card';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export const RichAdvisoryCard: React.FC<{ advisory: ChatAdvisoryData }> = ({ advisory }) => {
  return (
    <Card variant="glass" className="p-4 my-2 border-amber-500/30 bg-navy-900/90 max-w-md">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          {advisory.targetGroup} Advisory
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
          {advisory.priority} Priority
        </span>
      </div>

      <div className="space-y-1.5 mt-2">
        {advisory.recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>{rec}</span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
        <strong>Optimal Window:</strong> {advisory.safeWindow}
      </p>
    </Card>
  );
};
