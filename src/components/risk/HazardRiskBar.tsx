import React from 'react';
import { HazardRisk } from '../../types/risk';
import { Card } from '../ui/Card';
import { RISK_LEVEL_CONFIG } from '../../config/theme';
import { useLanguage } from '../../context/LanguageContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HazardRiskBarProps {
  hazards: HazardRisk[];
}

export const HazardRiskBar: React.FC<HazardRiskBarProps> = ({ hazards }) => {
  const { t } = useLanguage();

  const getLevelLabel = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return t('risk.levelLow');
      case 'moderate': return t('risk.levelModerate');
      case 'high': return t('risk.levelHigh');
      case 'extreme': return t('risk.levelExtreme');
      default: return level;
    }
  };

  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return (
          <span className="flex items-center gap-1 text-[10px] text-red-400 font-mono">
            <TrendingUp className="w-3 h-3" /> {t('risk.trendRising')}
          </span>
        );
      case 'decreasing':
        return (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <TrendingDown className="w-3 h-3" /> {t('risk.trendFalling')}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <Minus className="w-3 h-3" /> {t('risk.trendSteady')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      {hazards.map((hz, idx) => {
        const config = RISK_LEVEL_CONFIG[hz.level];
        return (
          <Card key={idx} variant="glass" className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <h4 className="text-xs font-bold text-white">{hz.hazard}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{hz.summary}</p>
              </div>

              <div className="flex items-center gap-3">
                {getTrendIcon(hz.trend)}
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${config.bg} ${config.border} ${config.textColor}`}
                >
                  {hz.score} / 100 ({getLevelLabel(hz.level)})
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${hz.score}%`,
                  backgroundColor: config.color,
                }}
              />
            </div>
          </Card>
        );
      })}
    </div>
  );
};
