import type { Metadata } from 'next';
import { DisasterAlertsPage } from '@/views/DisasterAlertsPage';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Active Disaster Alerts | WeatherGPT',
  description: 'Real-time cyclone, flood, heatwave, and severe thunderstorm bulletins from IMD and MoES.',
};

export default function Alerts() {
  return (
    <AuthGuard>
      <DisasterAlertsPage />
    </AuthGuard>
  );
}
