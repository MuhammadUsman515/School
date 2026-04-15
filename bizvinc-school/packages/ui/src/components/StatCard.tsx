import React from 'react';
import { cn } from '../utils';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({
  title, value, subtitle, icon: Icon, iconColor = 'text-purple-600',
  iconBg = 'bg-purple-50', trend, className,
}: StatCardProps) {
  const positive = trend && trend.value >= 0;
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs font-medium mt-2', positive ? 'text-green-600' : 'text-red-500')}>
              {positive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl flex-shrink-0', iconBg)}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
      </div>
    </div>
  );
}
