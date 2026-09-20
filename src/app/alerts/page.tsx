import type { Metadata } from 'next';
import { DisasterAlertsPage } from '@/views/DisasterAlertsPage';

export const metadata: Metadata = {
  title: 'Active Alerts & CAP Warnings | WeatherGPT',
  description: 'Real-time Common Alerting Protocol (CAP) alerts, cyclone tracks, and IMD advisories.',
};

export default function Alerts() {
  return <DisasterAlertsPage />;
}
