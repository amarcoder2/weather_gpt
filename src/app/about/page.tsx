import type { Metadata } from 'next';
import { AboutPage } from '@/views/AboutPage';

export const metadata: Metadata = {
  title: 'About WeatherGPT | SIH 2026 #26068',
  description: 'Smart India Hackathon 2026 - Conversational AI for Weather Forecasting, Alerts, and Climate Information.',
};

export default function About() {
  return <AboutPage />;
}
