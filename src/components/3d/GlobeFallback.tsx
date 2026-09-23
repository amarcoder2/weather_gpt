import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const GlobeFallback: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Outer ambient glow */}
      <div className="absolute w-72 h-72 rounded-full bg-sky-500/10 blur-3xl animate-pulse-subtle" />
      <div className="absolute w-56 h-56 rounded-full bg-purple-500/10 blur-2xl" />

      {/* Atmospheric stylized planet orb */}
      <div className="relative w-64 h-64 rounded-full border border-sky-400/30 shadow-[0_0_50px_rgba(56,189,248,0.25)] flex items-center justify-center bg-gradient-to-tr from-navy-950 via-sky-950 to-indigo-900 overflow-hidden">
        {/* Cloud layer stripes */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-300 via-transparent to-transparent" />
        <div className="absolute w-80 h-32 -top-6 rounded-full border border-sky-400/20 rotate-12 opacity-50" />
        <div className="absolute w-80 h-32 top-14 rounded-full border border-purple-400/20 -rotate-6 opacity-40" />
        <div className="absolute w-80 h-32 top-36 rounded-full border border-cyan-400/20 rotate-8 opacity-50" />

        {/* Orbit Ring */}
        <div className="absolute inset-[-18px] rounded-full border border-dashed border-sky-400/30 animate-[spin_25s_linear_infinite]" />

        {/* Core highlight */}
        <div className="w-16 h-16 rounded-full bg-sky-400/10 blur-md" />
      </div>

      <div className="absolute bottom-4 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-navy-900/80 border border-slate-800 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {t('visualControls.fallbackNotice', 'Atmospheric System Simulation (Active)')}
        </span>
      </div>
    </div>
  );
};
