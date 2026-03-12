import React from 'react';
import { cn, formatCurrency } from '../../utils/format';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, subtitle, change, changeLabel, icon: Icon, color = 'brand', currency = 'USD', loading }) => {
  const colors = {
    brand: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    red:   'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    blue:  'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-8 w-36 mb-2" />
        <div className="skeleton h-4 w-20" />
      </div>
    );
  }

  const isPositive = change >= 0;

  return (
    <div className="card group hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        {Icon && (
          <div className={cn('p-2 rounded-lg', colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {typeof value === 'number' ? formatCurrency(value, currency) : value}
      </p>
      {(subtitle || change !== undefined) && (
        <div className="flex items-center gap-2">
          {change !== undefined && (
            <span className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}>
              {isPositive ? <ArrowTrendingUpIcon className="w-3.5 h-3.5" /> : <ArrowTrendingDownIcon className="w-3.5 h-3.5" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
          {changeLabel && <p className="text-xs text-gray-400">{changeLabel}</p>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
