import React from 'react';
import { cn } from '../../utils/format';

const ProgressBar = ({ value, max = 100, color = 'brand', size = 'md', showLabel = false, label }) => {
  const pct = Math.min((value / max) * 100, 100);

  const colors = {
    brand: 'bg-brand-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red:   'bg-red-500',
    blue:  'bg-blue-500',
  };

  const getColor = () => {
    if (color === 'auto') {
      if (pct >= 90) return 'bg-red-500';
      if (pct >= 75) return 'bg-amber-500';
      return 'bg-emerald-500';
    }
    return colors[color] || colors.brand;
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
          className={cn('h-full rounded-full transition-all duration-500', getColor())}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
