import type { Metadata } from 'next';
import { ForecastPage } from '@/views/ForecastPage';

export const metadata: Metadata = {
  title: 'Forecast Intelligence | WeatherGPT',
  description: 'High-resolution numerical weather prediction and multi-day meteorological forecasts.',
};

export default function Forecast() {
  return <ForecastPage />;
}
