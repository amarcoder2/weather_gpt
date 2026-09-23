'use client';

import React from 'react';
import { WeatherAlert } from '../../types/alert';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';

export const AlertBanner: React.FC<{ alert: WeatherAlert }> = ({ alert }) => {
  const { t } = useLanguage();

  const getSeverityLabel = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return t('alerts.critical');
      case 'warning': return t('alerts.warning');
      case 'watch': return t('alerts.watch');
      case 'information': return t('alerts.info');
      default: return sev;
    }
  };

  return (
    <div className="w-full bg-red-500/15 border-y md:border md:rounded-xl border-red-500/40 p-3.5 flex flex-wrap items-center justify-between gap-3 text-red-200">
      <div className="flex items-center gap-3">
        <span className="p-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
              {getSeverityLabel(alert.severity)} {t('alerts.bulletinTag')}
            </span>
            <span className="text-xs font-semibold text-white">{alert.title}</span>
          </div>
          <p className="text-xs text-red-300 mt-0.5 line-clamp-1">{alert.headline}</p>
        </div>
      </div>

      <Link
        href="/alerts"
        className="text-xs font-semibold text-red-300 hover:text-white flex items-center gap-1 shrink-0 ml-auto md:ml-0"
      >
        <span>{t('alerts.viewDirectives')}</span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
