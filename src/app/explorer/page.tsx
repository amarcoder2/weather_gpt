import type { Metadata } from 'next';
import { WeatherExplorerPage } from '@/views/WeatherExplorerPage';

export const metadata: Metadata = {
  title: 'Weather Intelligence Explorer | WeatherGPT',
  description: 'Interactive geospatial map, Doppler radar overlays, AWS network stations, and satellite telemetry.',
};

export default function Explorer() {
  return <WeatherExplorerPage />;
}
