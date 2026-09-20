import type { Metadata } from 'next';
import { HistoricalDisastersPage } from '@/views/HistoricalDisastersPage';

export const metadata: Metadata = {
  title: 'Historical Disaster Archives | WeatherGPT',
  description: 'Historical disaster analysis, post-event reports, and longitudinal weather patterns.',
};

export default function History() {
  return <HistoricalDisastersPage />;
}
