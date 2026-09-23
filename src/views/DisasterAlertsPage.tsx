'use client';

import React, { useState, useEffect } from 'react';
import { WeatherAlert, AlertCategory, SeverityLevel } from '../types/alert';
import { disasterService } from '../services/disasterService';
import { AlertCard } from '../components/alerts/AlertCard';
import { AlertMapPreview } from '../components/alerts/AlertMapPreview';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Tabs } from '../components/ui/Tabs';
import { useLanguage } from '../context/LanguageContext';
import { AlertTriangle, Radio, Filter, Search } from 'lucide-react';

export const DisasterAlertsPage: React.FC = () => {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory | 'All'>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categoryTabs = [
    { id: 'All', label: t('alerts.allCategories') },
    { id: 'Cyclone', label: t('alerts.cyclone') },
    { id: 'Flood', label: t('alerts.flood') },
    { id: 'Heatwave', label: t('alerts.heatwave') },
    { id: 'Thunderstorm', label: t('alerts.thunderstorm') },
    { id: 'Coastal Surge', label: t('alerts.coastalSwell') },
  ];

  const severityTabs = [
    { id: 'All', label: t('alerts.allSeverities') },
    { id: 'Critical', label: t('alerts.critical') },
    { id: 'Warning', label: t('alerts.warning') },
    { id: 'Watch', label: t('alerts.watch') },
    { id: 'Information', label: t('alerts.info') },
  ];

  const loadAlerts = async () => {
    setLoading(true);
    const data = await disasterService.getActiveAlerts({
      category: selectedCategory,
      severity: selectedSeverity,
      search: searchTerm,
    });
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, [selectedCategory, selectedSeverity, searchTerm]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {t('alerts.pageTitle')}
              </h1>
              <p className="text-xs text-slate-400">
                {t('alerts.pageSubtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-navy-900 border border-slate-800 px-3 py-1.5 rounded-full text-xs font-mono text-emerald-400">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>{t('alerts.broadcastFrequency')}</span>
        </div>
      </div>

      {/* Geospatial Map Preview */}
      <AlertMapPreview
        onSelectZone={(zone) => {
          setSearchTerm(zone.split(' ')[0]);
        }}
      />

      {/* Filter Toolbar */}
      <div className="space-y-3 bg-navy-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('alerts.filterActive')}</span>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('alerts.filterPlaceholder')}
              className="w-full h-8 pl-8 pr-3 bg-navy-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <Tabs
            tabs={categoryTabs}
            activeTab={selectedCategory}
            onChange={(id) => setSelectedCategory(id as any)}
          />
          <Tabs
            tabs={severityTabs}
            activeTab={selectedSeverity}
            onChange={(id) => setSelectedSeverity(id as any)}
          />
        </div>
      </div>

      {/* Alerts Feed */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          title={t('alerts.noMatchingBulletins')}
          description={t('alerts.noMatchingBulletinsDesc')}
          actionText={t('alerts.resetFilters')}
          onAction={() => {
            setSelectedCategory('All');
            setSelectedSeverity('All');
            setSearchTerm('');
          }}
        />
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
};
