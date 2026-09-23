'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DisasterEvent, DisasterType } from '../types/disaster';
import { disasterService } from '../services/disasterService';
import { DisasterFilterBar } from '../components/history/DisasterFilterBar';
import { DisasterTimeline } from '../components/history/DisasterTimeline';
import { DisasterDetailModal } from '../components/history/DisasterDetailModal';
import { DisasterAnalyticsChart } from '../components/history/DisasterAnalyticsChart';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';
import { useLanguage } from '../context/LanguageContext';
import { History, BarChart3, Clock, Archive } from 'lucide-react';

export const HistoricalDisastersPage: React.FC = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);

  const [activeTab, setActiveTab] = useState<'timeline' | 'analytics' | 'archive'>('timeline');
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');

  const states = ['Odisha', 'West Bengal', 'Kerala', 'Gujarat', 'Uttarakhand', 'Maharashtra'];
  const types: (DisasterType | 'All')[] = ['All', 'Cyclone', 'Flood', 'Heatwave', 'Landslide'];
  const years: (number | 'All')[] = ['All', 2023, 2021, 2020, 2019, 2018, 1999];

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      const data = await disasterService.getHistoricalEvents({
        state: selectedState,
        type: selectedType as any,
        year: selectedYear === 'All' ? 'All' : parseInt(selectedYear),
        search,
      });
      setEvents(data);
      setLoading(false);
    };
    loadEvents();
  }, [search, selectedState, selectedType, selectedYear]);

  const handleReset = () => {
    setSearch('');
    setSelectedState('All');
    setSelectedType('All');
    setSelectedYear('All');
    setSelectedSeverity('All');
  };

  const filteredEvents = useMemo(() => {
    if (selectedSeverity === 'All') return events;
    if (selectedSeverity === 'catastrophic') {
      return events.filter((e) => e.casualties >= 500 || (e.maxWindKmph && e.maxWindKmph >= 220) || (e.maxRainfallMm && e.maxRainfallMm >= 700));
    }
    if (selectedSeverity === 'severe') {
      return events.filter(
        (e) =>
          (e.casualties >= 50 && e.casualties < 500) ||
          (e.maxWindKmph && e.maxWindKmph >= 150 && e.maxWindKmph < 220) ||
          (e.maxRainfallMm && e.maxRainfallMm >= 300 && e.maxRainfallMm < 700)
      );
    }
    if (selectedSeverity === 'moderate') {
      return events.filter((e) => e.casualties < 50);
    }
    return events;
  }, [events, selectedSeverity]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t('disasters.title', 'Historical Disaster Intelligence Archive')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('disasters.subtitle', 'Analyzing past cyclones, floods, and cloudbursts to derive lessons for contemporary early warning systems')}
          </p>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="glass" className="p-4 border border-slate-800/80">
          <div className="text-xs text-slate-400">{t('disasters.metrics.recordedEvents', 'Recorded Events')}</div>
          <div className="text-2xl font-bold text-white mt-1">12 Major</div>
        </Card>
        <Card variant="glass" className="p-4 border border-slate-800/80">
          <div className="text-xs text-slate-400">{t('disasters.metrics.totalImpacted', 'Total Impacted Lives')}</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">4.5M+</div>
        </Card>
        <Card variant="glass" className="p-4 border border-slate-800/80">
          <div className="text-xs text-slate-400">{t('disasters.metrics.economicLosses', 'Economic Impact Est.')}</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">₹1.8L+ Cr</div>
        </Card>
        <Card variant="glass" className="p-4 border border-slate-800/80">
          <div className="text-xs text-slate-400">{t('disasters.metrics.worstRegion', 'Worst Affected Region')}</div>
          <div className="text-sm md:text-base font-bold text-rose-400 mt-1 truncate">Bay of Bengal / Odisha</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'timeline'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {t('disasters.tabs.timeline', 'Timeline View')}
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'analytics'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          {t('disasters.tabs.analytics', 'Analytics & Trends')}
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'archive'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          {t('disasters.tabs.archive', 'Archive Search')}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'analytics' ? (
        <DisasterAnalyticsChart />
      ) : (
        <>
          {/* Filter Bar */}
          <DisasterFilterBar
            search={search}
            setSearch={setSearch}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedSeverity={selectedSeverity}
            setSelectedSeverity={setSelectedSeverity}
            onReset={handleReset}
            states={states}
            types={types}
            years={years}
          />

          {/* Events Timeline */}
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              title={t('disasters.timeline.empty', 'No Historical Disaster Matches')}
              description={t('disasters.timeline.emptyDesc', 'No historical records match your filter criteria. Try adjusting the search term or year.')}
              actionText={t('disasters.filters.reset', 'Reset Filters')}
              onAction={handleReset}
            />
          ) : (
            <DisasterTimeline events={filteredEvents} onSelectEvent={(ev) => setSelectedEvent(ev)} />
          )}
        </>
      )}

      {/* Deep-Dive Modal */}
      <DisasterDetailModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </div>
  );
};
