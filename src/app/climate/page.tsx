import type { Metadata } from 'next';
import { ClimateTrendsPage } from '@/views/ClimateTrendsPage';

export const metadata: Metadata = {
  title: 'Long-Term Climate Trends | WeatherGPT',
  description: 'Decadal climate anomaly patterns, monsoon variations, and sea surface temperature analysis.',
};

export default function Climate() {
  return <ClimateTrendsPage />;
}
