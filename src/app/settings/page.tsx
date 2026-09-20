import type { Metadata } from 'next';
import { SettingsPage } from '@/views/SettingsPage';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'User Preferences & Settings | WeatherGPT',
  description: 'Manage telemetry unit systems, language preferences, emergency notification thresholds, and voice speeds.',
};

export default function Settings() {
  return (
    <AuthGuard>
      <SettingsPage />
    </AuthGuard>
  );
}
