import type { Metadata } from 'next';
import { LocationsPage } from '@/views/LocationsPage';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Observatory & Location Management | WeatherGPT',
  description: 'Manage active observation stations, GPS current location, and regional telemetry parameters.',
};

export default function Locations() {
  return (
    <AuthGuard>
      <LocationsPage />
    </AuthGuard>
  );
}
