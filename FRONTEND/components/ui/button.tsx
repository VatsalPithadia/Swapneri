'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-800 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary: 'bg-[#881337] text-white hover:bg-[#701a2e] shadow-xs hover:shadow-sm',
      secondary: 'bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 hover:border-stone-300 shadow-2xs',
      outline: 'border border-[#881337] text-[#881337] hover:bg-rose-50',
      ghost: 'text-stone-700 hover:bg-stone-100 hover:text-stone-900',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-xs',
    };

    const sizes = {
      sm: 'text-xs h-9 px-3 gap-1.5',
      md: 'text-sm h-11 px-4 gap-2', // 44px tap target
      lg: 'text-base h-13 px-6 gap-2.5',
      icon: 'h-11 w-11 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
