import React from 'react';
import { SeverityLevel } from '../../types/alert';
import { SEVERITY_CONFIG } from '../../config/theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'info';
  severity?: SeverityLevel;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  severity,
  className = '',
  dot = false,
}) => {
  if (severity) {
    const config = SEVERITY_CONFIG[severity];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${config.bg} ${config.border} ${config.text} ${className}`}
      >
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
        {children}
      </span>
    );
  }

  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700/80',
    primary: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-300 border-red-500/40',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    info: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
};
