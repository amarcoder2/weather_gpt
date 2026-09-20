import type { Metadata } from 'next';
import { ForecastPage } from '@/views/ForecastPage';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Forecast Intelligence | WeatherGPT',
  description: 'High-resolution numerical weather prediction and multi-day meteorological forecasts.',
};

export default function Forecast() {
  return (
    <AuthGuard>
      <ForecastPage />
    </AuthGuard>
  );
}
