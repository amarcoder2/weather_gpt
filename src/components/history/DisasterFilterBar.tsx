import React from 'react';
import { Search, Filter } from 'lucide-react';
import { DisasterType } from '../../types/disaster';

interface DisasterFilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  selectedState: string;
  setSelectedState: (v: string) => void;
  selectedType: string;
  setSelectedType: (v: string) => void;
  selectedYear: string;
  setSelectedYear: (v: string) => void;
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
  states,
  types,
  years,
}) => {
  return (
    <div className="p-4 rounded-xl bg-navy-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search event name, district, or impact..."
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
        >
          <option value="All">All Disaster Types</option>
          {types.filter((t) => t !== 'All').map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* State */}
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="h-9.5 px-3 bg-navy-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="All">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="h-9.5 px-3 bg-navy-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500"
        >
          <option value="All">All Years</option>
          {years.filter((y) => y !== 'All').map((y) => (
            <option key={y} value={y.toString()}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
