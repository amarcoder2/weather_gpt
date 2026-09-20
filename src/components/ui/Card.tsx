import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated' | 'outline';
  hover?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  hover = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-xl transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-navy-900/90 border border-slate-800/80',
    glass: 'glass-card',
    elevated: 'bg-navy-850 border border-slate-700/60 shadow-xl',
    outline: 'bg-transparent border border-slate-800',
  }[variant];

  const hoverClasses = hover ? 'glass-card-hover' : '';

  return (
    <div className={`${baseClasses} ${variantClasses} ${hoverClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};
