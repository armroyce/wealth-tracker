import React from 'react';
import { cn } from '../../utils/format';

const gradients = {
  brand: 'from-brand-400 to-brand-600',
  green: 'from-emerald-400 to-teal-500',
  amber: 'from-amber-400 to-orange-500',
  red:   'from-red-400 to-rose-500',
  blue:  'from-blue-400 to-cyan-500',
};

const ProgressBar = ({ value, max = 100, color = 'brand', size = 'md', showLabel = false, label }) => {
  const pct = Math.min((value / max) * 100, 100);

  const getGradient = () => {
    if (color === 'auto') {
      if (pct >= 90) return gradients.red;
      if (pct >= 75) return gradients.amber;
      return gradients.green;
    }
    return gradients[color] || gradients.brand;
  };

  const sizes = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>}
          {showLabel && <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out relative overflow-hidden',
            getGradient(),
          )}
          style={{ width: `${pct}%` }}
        >
          {/* shimmer shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
