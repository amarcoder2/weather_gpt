import React from 'react';
import { Search } from 'lucide-react';
import { DisasterType } from '../../types/disaster';
import { useLanguage } from '../../context/LanguageContext';

interface DisasterFilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  selectedState: string;
  setSelectedState: (v: string) => void;
  selectedType: string;
  setSelectedType: (v: string) => void;
  selectedYear: string;
  setSelectedYear: (v: string) => void;
  selectedSeverity?: string;
  setSelectedSeverity?: (v: string) => void;
  onReset?: () => void;
  states: string[];
  types: (DisasterType | 'All')[];
  years: (number | 'All')[];
}

export const DisasterFilterBar: React.FC<DisasterFilterBarProps> = ({
  search,
  setSearch,
  selectedState,
  setSelectedState,
  selectedType,
  setSelectedType,
  selectedYear,
  setSelectedYear,
  selectedSeverity,
  setSelectedSeverity,
  onReset,
  states,
  types,
  years,
}) => {
  const { t } = useLanguage();

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
    <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('disasters.filters.searchPlaceholder', 'Search event name, district, or impact...')}
          className="w-full h-9.5 pl-10 pr-4 bg-navy-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Disaster Type */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="h-9.5 px-3 bg-navy-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          aria-label={t('disasters.filters.type', 'Filter by Disaster Type')}
        >
          <option value="All">{t('disasters.filters.allTypes', 'All Disaster Types')}</option>
          {types.filter((item) => item !== 'All').map((item) => (
            <option key={item} value={item}>{getTypeLabel(item)}</option>
          ))}
        </select>

        {/* State */}
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="h-9.5 px-3 bg-navy-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          aria-label="Filter by State"
        >
          <option value="All">{t('explorer.filters.allStates', 'All States')}</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="h-9.5 px-3 bg-navy-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          aria-label="Filter by Year"
        >
          <option value="All">{t('disasters.filters.allYears', 'All Years')}</option>
          {years.filter((y) => y !== 'All').map((y) => (
            <option key={y} value={y.toString()}>{y}</option>
          ))}
        </select>

        {/* Severity */}
        {setSelectedSeverity && (
          <select
            value={selectedSeverity || 'All'}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="h-9.5 px-3 bg-navy-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            aria-label={t('disasters.filters.severity', 'Severity Level')}
          >
            <option value="All">{t('disasters.filters.allSeverities', 'All Severities')}</option>
            <option value="catastrophic">{t('disasters.severity.catastrophic', 'Catastrophic (Cat 5)')}</option>
            <option value="severe">{t('disasters.severity.severe', 'Severe')}</option>
            <option value="moderate">{t('disasters.severity.moderate', 'Moderate')}</option>
          </select>
        )}

        {/* Reset */}
        {onReset && (
          <button
            onClick={onReset}
            type="button"
            className="h-9.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            {t('disasters.filters.reset', 'Reset Filters')}
          </button>
        )}
      </div>
    </div>
  );
};
