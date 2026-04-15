import React from 'react';
import { cn } from '../utils';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-purple-600', sizeMap[size], className)}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center h-64 w-full">
      <Spinner size="lg" />
    </div>
  );
}
