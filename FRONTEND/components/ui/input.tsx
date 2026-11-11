'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftAddon, rightAddon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-stone-400">
              {leftAddon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-11 px-3.5 bg-white text-stone-900 border rounded-lg text-sm transition-colors',
              'placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-800/20 focus:border-[#881337]',
              leftAddon ? 'pl-10' : '',
              rightAddon ? 'pr-10' : '',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                : 'border-stone-200 hover:border-stone-300',
              'disabled:bg-stone-50 disabled:text-stone-500 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center text-stone-500 text-sm">
              {rightAddon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>
        ) : hint ? (
          <p className="text-xs text-stone-500 mt-1">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
