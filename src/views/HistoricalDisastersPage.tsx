'use client';

import React, { useState, useEffect } from 'react';
import { DisasterEvent, DisasterType } from '../types/disaster';
import { disasterService } from '../services/disasterService';
import { DisasterFilterBar } from '../components/history/DisasterFilterBar';
import { DisasterTimeline } from '../components/history/DisasterTimeline';
import { DisasterDetailModal } from '../components/history/DisasterDetailModal';
import { DisasterAnalyticsChart } from '../components/history/DisasterAnalyticsChart';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { History, BookOpen } from 'lucide-react';

export const HistoricalDisastersPage: React.FC = () => {
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);

  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');

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

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Historical Disaster Intelligence Archive
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing past cyclones, floods, and cloudbursts to derive lessons for contemporary early warning systems
          </p>
        </div>
      </div>

      {/* Extreme Events Decadal Frequency Escalation Chart */}
      <DisasterAnalyticsChart />

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
      ) : events.length === 0 ? (
        <EmptyState
          title="No Historical Disaster Matches"
          description="No historical records match your filter criteria. Try adjusting the search term or year."
          actionText="Reset Filters"
          onAction={() => {
            setSearch('');
            setSelectedState('All');
            setSelectedType('All');
            setSelectedYear('All');
          }}
        />
      ) : (
        <DisasterTimeline events={events} onSelectEvent={(ev) => setSelectedEvent(ev)} />
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
