'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { GlobeFallback } from '../components/3d/GlobeFallback';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useWeather } from '../context/WeatherContext';
import { DEFAULT_LOCATIONS, SIH_METADATA } from '../config/constants';
import {
  CloudSun,
  Bot,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Globe2,
  Mic,
  ArrowRight,
  Database,
  Cpu,
  Compass,
  FileCheck,
  Zap,
  Navigation,
} from 'lucide-react';

const AtmosphericGlobe = dynamic(
  () => import('../components/3d/AtmosphericGlobe').then((m) => m.AtmosphericGlobe),
  {
    ssr: false,
    loading: () => <GlobeFallback />,
  }
);

export const LandingPage: React.FC = () => {
  const { setActiveLocationId, detectAndSetCurrentLocation, locationLoading } = useWeather();
  const router = useRouter();

  const handleSelectLocation = (locId: string) => {
    setActiveLocationId(locId);
    router.push('/dashboard');
  };

  const featurePillars = [
    { title: 'Real-Time Weather', desc: 'Telemetry from Doppler weather radars and automated weather stations (AWS).', icon: CloudSun, color: 'text-sky-400' },
    { title: 'Intelligent Forecasting', desc: 'Numerical weather prediction models translated into 24-hour and 7-day outlooks.', icon: Compass, color: 'text-indigo-400' },
    { title: 'Disaster Alerts', desc: 'Operational early warning bulletins for cyclones, flash floods, and severe heatwaves.', icon: AlertTriangle, color: 'text-red-400' },
    { title: 'Risk Intelligence', desc: 'Multi-hazard vulnerability scores with explainable scientific diagnostics.', icon: ShieldCheck, color: 'text-emerald-400' },
    { title: 'AI Conversational Engine', desc: 'Natural language understanding for plain-language questions and advisories.', icon: Bot, color: 'text-purple-400' },
    { title: 'Multilingual Access', desc: 'Support for 11 regional Indian languages for rural and urban citizen access.', icon: Globe2, color: 'text-amber-400' },
    { title: 'Voice Interaction', desc: 'Hands-free voice query assistance designed for rural farmers and responders.', icon: Mic, color: 'text-cyan-400' },
    { title: 'Extreme Climate Tracking', desc: 'Decadal trends and meteorological anomalies compared against 30-year IMD normals.', icon: TrendingUp, color: 'text-rose-400' },
  ];

  const workflowSteps = [
    { step: '01', title: 'Meteorological Data', desc: 'INSAT-3DR Satellite imagery, IMD Doppler Radars & CWC river gauge feeds' },
    { step: '02', title: 'Data Processing', desc: 'Data quality checks, mesoscale assimilation & high-resolution spatial gridding' },
    { step: '03', title: 'Weather Intelligence', desc: 'WRF & GFS numerical prediction models with synoptic pattern recognition' },
    { step: '04', title: 'Risk Analysis', desc: 'Multi-hazard vulnerability scoring, ground saturation & tidal lock calculations' },
    { step: '05', title: 'AI Understanding', desc: 'Conversational LLM parsing user context (farmer, urban commuter, responder)' },
    { step: '06', title: 'Human-Friendly Advisory', desc: 'Plain-language, actionable decisions delivered in voice, text, and 11 languages' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-navy-900/90 via-navy-950/80 to-navy-950 border border-slate-800 p-6 md:p-10 shadow-2xl backdrop-blur-md">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Narrative */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>SIH 2026 Problem ID: 26068 · Disaster Management</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Conversational AI for <br />
                <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Weather, Alerts & Disaster Risk
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Empowering India with instant meteorological intelligence, early cyclone & flood warnings, and explainable risk assessments for citizens, farmers, and disaster management authorities.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/dashboard">
                <Button size="lg" variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                  Explore Weather Command Center
                </Button>
              </Link>
              <Button
                size="lg"
                variant="secondary"
                onClick={async () => {
                  await detectAndSetCurrentLocation();
                  router.push('/dashboard');
                }}
                disabled={locationLoading}
                icon={<Navigation className="w-4 h-4 text-emerald-400" />}
              >
                {locationLoading ? 'Acquiring GPS...' : '📍 Detect My Location'}
              </Button>
              <Link href="/chat">
                <Button size="lg" variant="secondary" icon={<Bot className="w-4 h-4 text-purple-400" />}>
                  Ask WeatherGPT
                </Button>
              </Link>
            </div>

            {/* Quick Location Pills */}
            <div className="pt-4 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 block mb-2 font-medium">
                Jump to Meteorological Station or Real-Time Coordinates:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={async () => {
                    await detectAndSetCurrentLocation();
                    router.push('/dashboard');
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-colors font-semibold flex items-center gap-1.5"
                >
                  <Navigation className="w-3 h-3 text-emerald-400" />
                  <span>📍 Current Location (GPS)</span>
                </button>
                {DEFAULT_LOCATIONS.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectLocation(loc.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-navy-900 border border-slate-800 text-slate-300 hover:text-white hover:border-sky-500/50 hover:bg-slate-800/60 transition-colors"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Hero 3D Earth Atmosphere Experience */}
          <div className="lg:col-span-5 h-[380px] sm:h-[420px] flex items-center justify-center">
            <AtmosphericGlobe />
          </div>
        </div>
      </section>

      {/* The Story / Problem vs Solution (SIH Presentation Narrative) */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono text-sky-400 uppercase tracking-wider font-bold">
            Disaster Management Theme · MoES & IMD
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Bridging Complex Meteorological Science to Everyday Citizens
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Why traditional weather websites fail during emergencies and how WeatherGPT solves it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass" className="p-6 border-red-500/30 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">The Problem</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Meteorological bulletins use dense jargon (isobars, CAPE, QPF) across fragmented websites. Farmers and rural citizens struggle to interpret whether heavy rain will destroy their crop or when storm surge will hit their village.
            </p>
          </Card>

          <Card variant="glass" className="p-6 border-sky-500/30 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">The Solution</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              WeatherGPT synthesizes Doppler radars, satellite imagery, and numerical forecasts into structured risk scores, delivering plain-language recommendations tailored to the specific citizen in their native tongue.
            </p>
          </Card>

          <Card variant="glass" className="p-6 border-emerald-500/30 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">The Decision Support</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Instead of simply displaying "85% precipitation", WeatherGPT tells farmers: <em>"Postpone pesticide spraying for 48 hours to prevent chemical runoff,"</em> saving livelihoods and securing disaster resilience.
            </p>
          </Card>
        </div>
      </section>

      {/* Visual System Data-Flow Architecture (Requirement 6) */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono text-sky-400 uppercase tracking-wider font-bold">
            System Data-Flow Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How WeatherGPT Transforms Telemetry into Action
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {workflowSteps.map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-navy-900 border border-slate-800 flex flex-col justify-between relative group hover:border-sky-500/40 transition-colors"
            >
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                  {step.step}
                </span>
                <h4 className="text-xs font-bold text-white mt-2">{step.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">{step.desc}</p>
              </div>

              {idx < workflowSteps.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-600">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Platform Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            A serious meteorological intelligence platform built for government agencies, emergency managers, and citizens.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featurePillars.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} variant="glass" hover className="p-5 space-y-2.5">
                <div className="p-2.5 rounded-xl bg-navy-900 border border-slate-800 w-fit">
                  <Icon className={`w-5 h-5 ${feat.color}`} />
                </div>
                <h3 className="text-sm font-bold text-white">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer Branding for Hackathon */}
      <footer className="pt-8 pb-4 border-t border-slate-800 text-center space-y-2 text-xs text-slate-500">
        <p className="font-semibold text-slate-400">
          WeatherGPT · {SIH_METADATA.organization} · {SIH_METADATA.department}
        </p>
        <p>
          Smart India Hackathon 2026 · Problem Statement ID: 26068 · Disaster Management Theme
        </p>
      </footer>
    </div>
  );
};
