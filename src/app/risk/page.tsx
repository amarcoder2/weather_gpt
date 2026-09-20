import type { Metadata } from 'next';
import { RiskIntelligencePage } from '@/views/RiskIntelligencePage';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Multi-Hazard Risk Intelligence | WeatherGPT',
  description: 'Explainable disaster vulnerability scoring, hazard breakdown, and localized resilience metrics.',
};

export default function Risk() {
  return (
    <AuthGuard>
      <RiskIntelligencePage />
    </AuthGuard>
  );
}
