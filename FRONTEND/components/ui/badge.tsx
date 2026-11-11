import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'stone' | 'amber' | 'blue' | 'purple' | 'emerald' | 'teal' | 'rose' | 'red';
  dot?: boolean;
}

export function Badge({ className, variant = 'stone', dot = false, children, ...props }: BadgeProps) {
  const variantStyles = {
    stone: 'bg-stone-100 text-stone-800 border-stone-200',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    blue: 'bg-sky-50 text-sky-900 border-sky-200',
    purple: 'bg-purple-50 text-purple-900 border-purple-200',
    emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    teal: 'bg-teal-50 text-teal-900 border-teal-200',
    rose: 'bg-rose-50 text-rose-900 border-rose-200',
    red: 'bg-red-50 text-red-900 border-red-200',
  };

  const dotColors = {
    stone: 'bg-stone-500',
    amber: 'bg-amber-500',
    blue: 'bg-sky-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-600',
    teal: 'bg-teal-600',
    rose: 'bg-rose-600',
    red: 'bg-red-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
}
