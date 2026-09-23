import React from 'react';
import { Modal } from '../ui/Modal';
import { DisasterEvent } from '../../types/disaster';
import { Badge } from '../ui/Badge';
import { MapPin, Calendar, Users, DollarSign, Wind, Droplets, BookOpen } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface DisasterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: DisasterEvent | null;
}

export const DisasterDetailModal: React.FC<DisasterDetailModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const { t } = useLanguage();

  if (!event) return null;

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cyclone':
        return t('disasters.type.cyclone', 'Tropical Cyclones');
      case 'flood':
        return t('disasters.type.flood', 'Severe Floods');
      case 'drought':
        return t('disasters.type.drought', 'Droughts');
      case 'heatwave':
        return t('disasters.type.heatwave', 'Heatwave Spells');
      case 'cloudburst':
        return t('disasters.type.cloudburst', 'Cloudbursts');
      case 'landslide':
        return t('disasters.type.landslide', 'Landslides');
      default:
        return type;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('disasters.modal.title', 'Disaster Dossier')}: ${event.name}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Header Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Badge variant="purple">{getTypeLabel(event.type)}</Badge>
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              {event.date}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            {event.state}
          </span>
        </div>

        {/* Impact Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-navy-950/80 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 flex items-center gap-1 mb-1">
              <Users className="w-3.5 h-3.5 text-red-400" />
              {t('disasters.modal.fatalities', 'Fatalities')}
            </span>
            <p className="text-base font-bold text-white tabular-numbers">{event.casualties}</p>
          </div>

          <div>
            <span className="text-slate-400 flex items-center gap-1 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              {t('disasters.modal.losses', 'Estimated Losses')}
            </span>
            <p className="text-sm font-bold text-amber-300">{event.economicImpact}</p>
          </div>

          {event.maxWindKmph && (
            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Wind className="w-3.5 h-3.5 text-indigo-400" />
                {t('disasters.modal.peakWind', 'Peak Gust')}
              </span>
              <p className="text-base font-bold text-slate-200 tabular-numbers">{event.maxWindKmph} km/h</p>
            </div>
          )}

          {event.maxRainfallMm && (
            <div>
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                {t('disasters.modal.rainfall', 'Max 24h Rain')}
              </span>
              <p className="text-base font-bold text-sky-300 tabular-numbers">{event.maxRainfallMm} mm</p>
            </div>
          )}
        </div>

        {/* Narrative Description */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            {t('disasters.modal.impact', 'Meteorological Summary & Impact')}:
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{event.description}</p>
        </div>

        {/* Districts Affected */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            {t('disasters.modal.districts', 'Severely Impacted Districts:')}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {event.districts.map((d, i) => (
              <span key={i} className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Key Lesson / Disaster Management Takeaway */}
        <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/30">
          <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <BookOpen className="w-4 h-4 text-sky-400" />
            {t('disasters.modal.response', 'Post-Disaster Response & Governance Insight')}:
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">{event.keyTakeaway}</p>
        </div>
      </div>
    </Modal>
  );
};
