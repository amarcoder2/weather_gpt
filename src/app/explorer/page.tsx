import type { Metadata } from 'next';
import { WeatherExplorerPage } from '@/views/WeatherExplorerPage';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Weather Explorer | WeatherGPT',
  description: 'Interactive geospatial map visualizing live weather stations, radar feeds, and regional telemetry.',
};

export default function Explorer() {
  return (
    <AuthGuard>
      <WeatherExplorerPage />
    </AuthGuard>
  );
}
