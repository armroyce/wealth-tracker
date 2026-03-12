import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import { formatCurrency, formatDate, INSURANCE_TYPE_LABELS } from '../utils/format';
import {
  BanknotesIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  ChartBarIcon, BellAlertIcon, SparklesIcon,
} from '@heroicons/react/24/outline';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getRenewalColor = (days) => {
  if (days <= 15) return 'bg-red-100 dark:bg-red-900/30 text-red-600 border border-red-200 dark:border-red-800';
  if (days <= 30) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border border-amber-200 dark:border-amber-800';
  return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-800';
};

const TYPE_EMOJI = {
  HEALTH: '🏥', TERM_LIFE: '🛡️', WHOLE_LIFE: '💼', CAR: '🚗',
  BIKE: '🏍️', HOME: '🏠', TRAVEL: '✈️', OTHER: '📋',
};

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-gray-600 dark:text-gray-300 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(p.value, currency)}</span>
        </div>
      ))}
    </div>
  );
};

const SavingsRing = ({ rate = 0, savings, currency }) => {
  const pct = Math.min(Math.max(rate, 0), 100);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 25 ? '#10b981' : pct >= 10 ? '#f59e0b' : '#ef4444';
  const label = pct >= 25 ? 'Excellent' : pct >= 10 ? 'Good' : 'Low';

  return (
    <div className="flex flex-col items-center justify-center h-full gap-1">
      <div className="relative">
        <svg width="96" height="96" className="-rotate-90">
          <circle cx="48" cy="48" r={r} fill="none"
            stroke="currentColor" className="text-gray-100 dark:text-gray-800"
            strokeWidth="8" />
          <circle cx="48" cy="48" r={r} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{pct.toFixed(0)}%</span>
        </div>
      </div>
      <p className="text-xs font-semibold" style={{ color }}>{label}</p>
      <p className="text-xs text-gray-400">Savings Rate</p>
      {savings !== undefined && (
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          +{formatCurrency(savings, currency)}
        </p>
      )}
    </div>
  );
};

const TransactionRow = ({ transaction, currency, delay = 0 }) => (
  <div
    className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800/80 last:border-0 group animate-fade-in opacity-0"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
  >
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
        ${transaction.type === 'INCOME'
          ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
          : 'bg-gradient-to-br from-red-400 to-rose-500 text-white'}`}>
        {transaction.category?.[0] || '?'}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {transaction.merchant || transaction.category}
        </p>
        <p className="text-xs text-gray-400">{formatDate(transaction.date, 'relative')}</p>
      </div>
    </div>
    <span className={`text-sm font-semibold ${transaction.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
      {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount), currency)}
    </span>
  </div>
);

const fmt = (v, currency) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(0)}K`;
  return formatCurrency(v, currency);
};

const DashboardPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const { data, loading } = useApi('/reports/dashboard');
  const d = data || {};

  const savingsRate = useMemo(() => {
    if (!d.monthlyIncome) return 0;
    return Math.max(((d.monthlyIncome - d.monthlyExpenses) / d.monthlyIncome) * 100, 0);
  }, [d.monthlyIncome, d.monthlyExpenses]);

  const monthlySavings = (d.monthlyIncome || 0) - (d.monthlyExpenses || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <SparklesIcon className="w-4 h-4 text-brand-500" />
            <p className="text-sm text-brand-600 dark:text-brand-400 font-medium">
              {getGreeting()}, {user?.name?.split(' ')[0]}
            </p>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Net Worth"        value={d.netWorth}        subtitle="Assets minus liabilities" icon={BanknotesIcon}       color="brand" currency={currency} loading={loading} delay={0}   />
        <StatCard title="Total Assets"     value={d.totalAssets}     subtitle="All accounts & holdings"  icon={ArrowTrendingUpIcon}  color="green" currency={currency} loading={loading} delay={75}  />
        <StatCard title="Monthly Income"   value={d.monthlyIncome}   subtitle="This month"               icon={ChartBarIcon}         color="blue"  currency={currency} loading={loading} delay={150} />
        <StatCard title="Monthly Expenses" value={d.monthlyExpenses} subtitle={`Saved ${formatCurrency(monthlySavings, currency)}`} icon={ArrowTrendingDownIcon} color="red" currency={currency} loading={loading} delay={225} />
      </div>

      {/* Insurance Reminders */}
      {d.insuranceReminders?.length > 0 && (
        <div className="card border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 animate-slide-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <BellAlertIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-semibold text-amber-800 dark:text-amber-400">Insurance Renewals Coming Up</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {d.insuranceReminders.map(p => (
              <div key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${getRenewalColor(p.daysUntilRenewal)}`}>
                <span>{TYPE_EMOJI[p.type]}</span>
                <span>{p.name}</span>
                <span className="font-bold">{p.daysUntilRenewal === 0 ? 'Today!' : `${p.daysUntilRenewal}d`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart + Savings Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2 animate-slide-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '200ms' }}>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Income vs Expenses — Last 6 Months
          </h2>
          {loading ? (
            <div className="skeleton h-52 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={d.monthlyChart || []} barCategoryGap="30%">
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmt(v, currency)} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="income"   name="Income"   stroke="#10b981" strokeWidth={2.5} fill="url(#incomeGrad)"  dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2.5} fill="url(#expenseGrad)" dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Savings Rate */}
        <div className="card flex flex-col animate-scale-in opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '300ms' }}>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">This Month</h2>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="skeleton h-24 w-24 rounded-full" />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <SavingsRing rate={savingsRate} savings={monthlySavings > 0 ? monthlySavings : undefined} currency={currency} />
            </div>
          )}
        </div>
      </div>

      {/* Goals + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals */}
        <div className="card animate-slide-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '250ms' }}>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Goal Progress</h2>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="skeleton h-12 w-full" />)}
            </div>
          ) : d.goals?.length ? (
            <div className="space-y-4">
              {d.goals.slice(0, 5).map((goal, i) => (
                <div key={goal.id} className="animate-fade-in opacity-0" style={{ animationDelay: `${300 + i * 60}ms`, animationFillMode: 'forwards' }}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{goal.name}</span>
                    <span className="text-xs font-semibold text-gray-500 ml-2 flex-shrink-0">{goal.progress?.toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={goal.progress} max={100} color="auto" />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-gray-400">{formatCurrency(goal.currentAmount, currency, true)}</span>
                    <span className="text-xs text-gray-400">{formatCurrency(goal.targetAmount, currency, true)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No goals set yet</p>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card lg:col-span-2 animate-slide-up opacity-0" style={{ animationFillMode: 'forwards', animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
            <a href="/transactions" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">View all →</a>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-12 w-full" />)}
            </div>
          ) : d.recentTransactions?.length ? (
            <div>
              {d.recentTransactions.map((t, i) => (
                <TransactionRow key={t.id} transaction={t} currency={currency} delay={350 + i * 40} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
