import type { Metadata } from 'next';
import { LocationsPage } from '@/views/LocationsPage';

export const metadata: Metadata = {
  title: 'Monitored Locations | WeatherGPT',
  description: 'Manage priority weather monitoring stations and multi-city telemetry.',
};

export default function Locations() {
  return <LocationsPage />;
}
