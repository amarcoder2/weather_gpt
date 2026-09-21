import type { Metadata } from 'next';
import { AdminClient } from './AdminClient';

export const metadata: Metadata = {
  title: 'Admin Control Center | WeatherGPT',
  description: 'Mission Operations, IMD Doppler & AWS ingestion telemetry, CAP alert broadcast, and system audit logs.',
};

export default function Admin() {
  return <AdminClient />;
}

