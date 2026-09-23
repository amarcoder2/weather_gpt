import React from 'react';
import { WeatherAlert } from '../../types/alert';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useLanguage } from '../../context/LanguageContext';
import {
  MapPin,
  Clock,
  Radio,
  CheckCircle,
  FileText,
  AlertOctagon,
} from 'lucide-react';

interface AlertCardProps {
  alert: WeatherAlert;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
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

  const getCategoryLabel = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'cyclone': return t('alerts.cyclone');
      case 'flood': return t('alerts.flood');
      case 'heatwave': return t('alerts.heatwave');
      case 'thunderstorm': return t('alerts.thunderstorm');
      default: return cat;
    }
  };

  return (
    <Card variant="elevated" className="p-6 border-slate-800 hover:border-slate-700">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Badge severity={alert.severity} dot>
            {getSeverityLabel(alert.severity)} · {getCategoryLabel(alert.category)}
          </Badge>
          {alert.bulletinNumber && (
            <span className="text-[11px] font-mono text-slate-400">
              {t('alerts.bulletin')} #{alert.bulletinNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            {t('alerts.issued')}: {alert.issuedTime}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-400">{t('alerts.validUntil')}: {alert.validUntil}</span>
        </div>
      </div>

      {/* Main Title & Headline */}
      <div className="mt-4">
        <h3 className="text-lg font-bold text-white tracking-tight">{alert.title}</h3>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <strong className="text-slate-300">{alert.location}</strong> ({alert.state})
        </p>

        <div className="p-3.5 mt-3 rounded-xl bg-navy-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          {alert.headline}
        </div>

        <p className="text-xs text-slate-400 mt-3 leading-relaxed">{alert.description}</p>
      </div>

      {/* Affected Districts */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          {t('alerts.vulnerableDistricts')}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {alert.affectedDistricts.map((d, i) => (
            <span
              key={i}
              className="px-2.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 text-xs"
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="mt-5 p-4 rounded-xl bg-navy-950/60 border border-slate-800">
        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
          <AlertOctagon className="w-4 h-4 text-amber-400" />
          {t('alerts.safetyDirectives')}
        </h4>
        <ul className="space-y-2">
          {alert.recommendedActions.map((act, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{act}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer / Attribution */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-slate-400" />
          {t('alerts.issuingAuthority')}: {alert.source}
        </span>
        <span>{t('alerts.sopLevel')}</span>
      </div>
    </Card>
  );
};
