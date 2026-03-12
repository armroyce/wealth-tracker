import React, { useEffect, useRef, useState } from 'react';
import { cn, formatCurrency } from '../../utils/format';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const useAnimatedNumber = (target, duration = 900) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef();
  const startRef = useRef(null);
  const prevTarget = useRef(null);

  useEffect(() => {
    if (target === null || target === undefined) return;
    if (prevTarget.current === target) return;
    const from = prevTarget.current ?? 0;
    prevTarget.current = target;
    startRef.current = null;

    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
};

const gradients = {
  brand: 'from-brand-500 to-indigo-600',
  green: 'from-emerald-400 to-teal-500',
  red:   'from-red-400 to-rose-500',
  amber: 'from-amber-400 to-orange-500',
  blue:  'from-blue-400 to-cyan-500',
};

const bgTints = {
  brand: 'bg-brand-50/60 dark:bg-brand-900/10',
  green: 'bg-emerald-50/60 dark:bg-emerald-900/10',
  red:   'bg-red-50/60 dark:bg-red-900/10',
  amber: 'bg-amber-50/60 dark:bg-amber-900/10',
  blue:  'bg-blue-50/60 dark:bg-blue-900/10',
};

const StatCard = ({ title, value, subtitle, change, changeLabel, icon: Icon, color = 'brand', currency = 'INR', loading, delay = 0 }) => {
  const animated = useAnimatedNumber(typeof value === 'number' ? value : null);

  if (loading) {
    return (
      <div className="card" style={{ animationDelay: `${delay}ms` }}>
        <div className="flex items-start justify-between mb-3">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-9 w-9 rounded-xl" />
        </div>
        <div className="skeleton h-8 w-36 mb-2" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  const isPositive = change >= 0;
  const displayValue = typeof value === 'number'
    ? formatCurrency(animated, currency)
    : value;

  return (
    <div
      className={cn(
        'card group cursor-default',
        'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
        'animate-slide-up opacity-0',
        bgTints[color],
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-tight">{title}</p>
        {Icon && (
          <div className={cn(
            'p-2 rounded-xl bg-gradient-to-br shadow-sm flex-shrink-0',
            gradients[color],
          )}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1 tabular-nums tracking-tight">
        {displayValue ?? '—'}
      </p>

      {(subtitle || change !== undefined) && (
        <div className="flex items-center gap-2 flex-wrap">
          {change !== undefined && (
            <span className={cn(
              'inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full',
              isPositive
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
            )}>
              {isPositive
                ? <ArrowTrendingUpIcon className="w-3 h-3" />
                : <ArrowTrendingDownIcon className="w-3 h-3" />}
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
