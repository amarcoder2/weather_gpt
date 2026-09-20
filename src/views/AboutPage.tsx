'use client';

import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { SIH_METADATA } from '../config/constants';
import {
  ShieldCheck,
  Building2,
  Cpu,
  Database,
  Layers,
  Sparkles,
  Award,
  ArrowRight,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Hero / Hackathon Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-navy-900 via-navy-850 to-indigo-950/60 border border-slate-700/80 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">{SIH_METADATA.edition}</Badge>
          <Badge variant="purple">Problem ID: #{SIH_METADATA.problemStatementId}</Badge>
          <Badge variant="danger">{SIH_METADATA.theme}</Badge>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {SIH_METADATA.problemStatementTitle}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Ministry: <strong>{SIH_METADATA.organization}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Department: <strong>{SIH_METADATA.department}</strong></span>
          </div>
        </div>
      </div>

      {/* Vision & Problem Statement */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">
          1. Project Vision & Core Challenge
        </h2>
        <Card variant="glass" className="p-6 space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Weather information in India has historically remained confined to technical scientific websites with complex isobar charts, satellite matrices, and jargon-heavy PDF bulletins. When extreme climate events strike (e.g. Cyclone Amphan, Kerala floods, or severe summer heatwaves), ordinary citizens, local fishermen, and marginal farmers struggle to deduce concrete actions.
          </p>
          <p>
            <strong>WeatherGPT</strong> is engineered not as another generic weather website, but as an <em>intelligent meteorological command center and conversational advisory platform</em>. It bridges complex meteorological datasets with natural-language reasoning to empower decision-makers, emergency rescue battalions, and grassroot citizens.
          </p>
        </Card>
      </section>

      {/* Two-Phase Architectural Roadmap */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">
          2. Platform Architectural Phasing
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phase 1 (Completed Frontend) */}
          <Card variant="elevated" className="p-6 border-sky-500/40 bg-navy-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-sky-400">
                Phase 1 (Current Implementation)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Active & Verified
              </span>
            </div>

            <h3 className="text-base font-bold text-white">Frontend-First Production Architecture</h3>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>Decoupled TypeScript data contracts for all meteorological entities.</li>
              <li>Realistic mock service abstractions (<code className="text-sky-300">weatherService</code>, <code className="text-sky-300">forecastService</code>, <code className="text-sky-300">aiService</code>, <code className="text-sky-300">disasterService</code>, <code className="text-sky-300">riskService</code>).</li>
              <li>Interactive 3D Earth atmosphere canvas with automatic low-power CSS fallback.</li>
              <li>Full 12-route design system with deep atmospheric navy palette.</li>
              <li>Recharts-powered 24-hour synoptic progressions & historical disaster trends.</li>
              <li>Zero hardcoded API secrets in frontend bundles for security compliance.</li>
            </ul>
          </Card>

          {/* Phase 2 (Future Roadmap) */}
          <Card variant="glass" className="p-6 border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-purple-400">
                Phase 2 (Integration Roadmap)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Future Boundary
              </span>
            </div>

            <h3 className="text-base font-bold text-white">Live Services & Cloud Infrastructure</h3>
            <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
              <li><strong>Google Gemini LLM:</strong> Server-side streaming endpoint for deep meteorological queries.</li>
              <li><strong>Live IMD API Ingest:</strong> Doppler radar telemetry and AWS network data pipelines.</li>
              <li><strong>Firebase Authentication & Firestore:</strong> Secure citizen profiles and alert subscription records.</li>
              <li><strong>Cloudinary:</strong> Automated satellite imagery and radar GIF processing storage.</li>
              <li><strong>Web Speech API:</strong> Native real-time multilingual voice input & audio response synthesis.</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Data Flow Pipeline */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">
          3. Intelligence Pipeline
        </h2>
        <Card variant="glass" className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            {[
              { title: 'Radar & AWS Data', sub: 'Doppler / AWS' },
              { title: 'Data Cleaning', sub: 'QC & Assimilation' },
              { title: 'WRF Prediction', sub: 'Numerical Met' },
              { title: 'Risk Scorer', sub: 'Ground Saturation' },
              { title: 'AI Reasoning', sub: 'Intent Parser' },
              { title: 'Action Advisory', sub: 'Citizen Directives' },
            ].map((p, i) => (
              <div key={i} className="p-3 rounded-xl bg-navy-950 border border-slate-800">
                <span className="text-[10px] font-mono text-sky-400 font-bold block mb-1">0{i + 1}</span>
                <p className="text-xs font-bold text-white">{p.title}</p>
                <span className="text-[10px] text-slate-500">{p.sub}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};
