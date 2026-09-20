import type { Metadata, Viewport } from 'next';
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google';
import '../index.css';
import { AppProviders } from './providers';
import { AppShell } from '../components/layout/AppShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WeatherGPT — Conversational AI for Weather, Alerts & Climate | MoES & IMD',
  description:
    'WeatherGPT: Ministry of Earth Sciences & India Meteorological Department (MoES/IMD) conversational weather intelligence and disaster risk management platform for SIH 2026.',
  icons: {
    icon: '/weathergpt-logo.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#060B18',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-navy-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden min-h-screen">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
