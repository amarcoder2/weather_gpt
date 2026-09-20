import type { Metadata } from 'next';
import { HistoricalDisastersPage } from '@/views/HistoricalDisastersPage';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Disaster History & Case Studies | WeatherGPT',
  description: 'Historical archive of major cyclonic storms, extreme floods, and heatwave events across India.',
};

export default function History() {
  return (
    <AuthGuard>
      <HistoricalDisastersPage />
    </AuthGuard>
  );
}
