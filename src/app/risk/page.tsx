import type { Metadata } from 'next';
import { RiskIntelligencePage } from '@/views/RiskIntelligencePage';

export const metadata: Metadata = {
  title: 'Disaster Risk Intelligence | WeatherGPT',
  description: 'Predictive risk matrix, vulnerability scoring, and disaster intelligence for Indian states.',
};

export default function Risk() {
  return <RiskIntelligencePage />;
}
