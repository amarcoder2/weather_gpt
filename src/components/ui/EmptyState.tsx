import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <AlertCircle className="w-12 h-12 text-slate-500" />,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-navy-900/40 border border-dashed border-slate-800 rounded-2xl ${className}`}
    >
      <div className="p-3 mb-4 rounded-full bg-slate-800/50">{icon}</div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="max-w-sm mt-1 text-sm text-slate-400">{description}</p>
      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="mt-4">
          {actionText}
        </Button>
      )}
    </div>
  );
};
