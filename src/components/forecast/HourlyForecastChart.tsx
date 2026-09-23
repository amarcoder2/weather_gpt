'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { HourlyForecast } from '../../types/forecast';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { useWeather } from '../../context/WeatherContext';
import { useLanguage } from '../../context/LanguageContext';

interface HourlyForecastChartProps {
  hourlyData: HourlyForecast[];
}

export const HourlyForecastChart: React.FC<HourlyForecastChartProps> = ({ hourlyData }) => {
  const [activeMetric, setActiveMetric] = useState<'temp' | 'rain' | 'wind'>('temp');
  const { formatTemp } = useWeather();
  const { t } = useLanguage();

  const metricsTabs = [
    { id: 'temp', label: t('forecast.tabTemperature', 'Temperature (°C)') },
    { id: 'rain', label: t('forecast.tabPrecipProb', 'Precipitation Prob (%)') },
    { id: 'wind', label: t('forecast.tabWindSpeed', 'Wind Velocity (km/h)') },
  ];

  const getMetricConfig = () => {
    switch (activeMetric) {
      case 'rain':
        return {
          dataKey: 'rainProb',
          color: '#38BDF8',
          fillColor: 'rgba(56, 189, 248, 0.2)',
          unit: '%',
          name: t('weather.precipProbability', 'Rain Probability'),
        };
      case 'wind':
        return {
          dataKey: 'windSpeed',
          color: '#818CF8',
          fillColor: 'rgba(129, 140, 248, 0.2)',
          unit: ' km/h',
          name: t('weather.surfaceWind', 'Wind Velocity'),
        };
      default:
        return {
          dataKey: 'temp',
          color: '#F59E0B',
          fillColor: 'rgba(245, 158, 11, 0.2)',
          unit: '°C',
          name: t('forecast.temperature', 'Temperature'),
        };
    }
  };

  const config = getMetricConfig();

  return (
    <Card variant="glass" className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-100">{t('forecast.hourlyHeading', '24-Hour Synoptic Progression')}</h3>
          <p className="text-xs text-slate-400">{t('forecast.hourlySubtitle', 'High-resolution hourly meteorological curve')}</p>
        </div>

        <Tabs tabs={metricsTabs} activeTab={activeMetric} onChange={(id) => setActiveMetric(id as any)} />
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(v) => `${v}${config.unit}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as HourlyForecast;
                  return (
                    <div className="p-3 bg-navy-900 border border-slate-700 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-semibold text-slate-200">{data.fullTimestamp}</p>
                      <p className="text-sky-300 font-medium">{t('weather.condition.' + data.conditionCode, data.condition)}</p>
                      <div className="pt-1 text-slate-300 font-mono">
                        <span>{config.name}: </span>
                        <strong className="text-white">
                          {activeMetric === 'temp' ? formatTemp(data.temp) : `${data[config.dataKey as keyof HourlyForecast]}${config.unit}`}
                        </strong>
                      </div>
                      <p className="text-[10px] text-slate-400">{t('weather.relativeHumidity', 'Humidity')}: {data.humidity}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey={config.dataKey}
              stroke={config.color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#metricGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
