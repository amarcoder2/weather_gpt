import type { Metadata } from 'next';
import { DashboardPage } from '@/views/DashboardPage';

export const metadata: Metadata = {
  title: 'Operational Dashboard | WeatherGPT',
  description: 'Real-time meteorological monitoring and telemetry for India.',
};

export default function Dashboard() {
  return <DashboardPage />;
}
