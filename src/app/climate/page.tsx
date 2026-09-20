import type { Metadata } from 'next';
import { ClimateTrendsPage } from '@/views/ClimateTrendsPage';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Climate Trends & Anomalies | WeatherGPT',
  description: 'Long-term decadal temperature anomalies, precipitation deviations, and 30-year IMD climate baselines.',
};

export default function Climate() {
  return (
    <AuthGuard>
      <ClimateTrendsPage />
    </AuthGuard>
  );
}
