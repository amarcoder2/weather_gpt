import { SeverityLevel } from '../types/alert';
import { RiskLevel } from '../types/risk';

export const SEVERITY_CONFIG: Record<SeverityLevel, {
  label: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
  glow: string;
}> = {
  Information: {
    label: 'Information',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-300',
    dot: 'bg-sky-400',
    glow: 'shadow-sky-500/20',
  },
  Watch: {
    label: 'Watch (Advisory)',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/35',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    glow: 'shadow-amber-500/20',
  },
  Warning: {
    label: 'Warning (Alert)',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/40',
    text: 'text-orange-300',
    dot: 'bg-orange-400',
    glow: 'shadow-orange-500/25',
  },
  Critical: {
    label: 'Critical (Severe)',
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-300',
    dot: 'bg-red-500 animate-ping',
    glow: 'shadow-red-500/30',
  },
};

export const RISK_LEVEL_CONFIG: Record<RiskLevel, {
  label: string;
  color: string;
  bg: string;
  border: string;
  textColor: string;
}> = {
  Low: {
    label: 'Low Risk',
    color: '#10B981',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
  },
  Moderate: {
    label: 'Moderate Risk',
    color: '#F59E0B',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    textColor: 'text-amber-400',
  },
  High: {
    label: 'High Risk',
    color: '#F97316',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/40',
    textColor: 'text-orange-400',
  },
  Severe: {
    label: 'Severe Risk',
    color: '#EF4444',
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    textColor: 'text-red-400',
  },
  Extreme: {
    label: 'Extreme Risk',
    color: '#A855F7',
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/50',
    textColor: 'text-purple-400',
  },
};
