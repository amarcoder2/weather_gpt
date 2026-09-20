import type { Metadata } from 'next';
import { SettingsPage } from '@/views/SettingsPage';

export const metadata: Metadata = {
  title: 'Platform Preferences & Settings | WeatherGPT',
  description: 'Configure meteorological alert thresholds, telemetry units, language, and display settings.',
};

export default function Settings() {
  return <SettingsPage />;
}
