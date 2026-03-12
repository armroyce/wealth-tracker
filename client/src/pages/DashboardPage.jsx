import React from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import { formatCurrency, formatDate } from '../utils/format';
import {
  BanknotesIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChartBarIcon,
} from '@heroicons/react/24/outline';

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg p-3">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value, currency)}
        </p>
      ))}
    </div>
  );
};

const TransactionRow = ({ transaction, currency }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold
        ${transaction.type === 'INCOME'
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
          : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
        {transaction.category?.[0] || '?'}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {transaction.merchant || transaction.category}
        </p>
        <p className="text-xs text-gray-400">{formatDate(transaction.date, 'relative')}</p>
      </div>
    </div>
    <span className={`text-sm font-semibold ${transaction.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'}`}>
      {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount), currency)}
    </span>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const { data, loading } = useApi('/reports/dashboard');

  const d = data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
          Welcome back, {user?.name?.split(' ')[0]} — here's your financial overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net Worth"
          value={d.netWorth}
          subtitle="Total assets minus liabilities"
          icon={BanknotesIcon}
          color="brand"
          currency={currency}
          loading={loading}
        />
        <StatCard
          title="Total Assets"
          value={d.totalAssets}
          subtitle="All accounts & investments"
          icon={ArrowTrendingUpIcon}
          color="green"
          currency={currency}
          loading={loading}
        />
        <StatCard
          title="Monthly Income"
          value={d.monthlyIncome}
          subtitle="This month"
          icon={ChartBarIcon}
          color="blue"
          currency={currency}
          loading={loading}
        />
        <StatCard
          title="Monthly Expenses"
          value={d.monthlyExpenses}
          subtitle={`Saved ${formatCurrency((d.monthlyIncome || 0) - (d.monthlyExpenses || 0), currency)}`}
          icon={ArrowTrendingDownIcon}
          color="red"
          currency={currency}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            Income vs Expenses — Last 6 Months
          </h2>
          {loading ? (
            <div className="skeleton h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.monthlyChart || []} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Goals */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Goal Progress</h2>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="skeleton h-12 w-full" />)}
            </div>
          ) : d.goals?.length ? (
            <div className="space-y-4">
              {d.goals.map(goal => (
                <div key={goal.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{goal.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{goal.progress?.toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={goal.progress} max={100} color="auto" />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">{formatCurrency(goal.currentAmount, currency)}</span>
                    <span className="text-xs text-gray-400">{formatCurrency(goal.targetAmount, currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No goals set yet</p>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
          <a href="/transactions" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">View all</a>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-12 w-full" />)}
          </div>
        ) : d.recentTransactions?.length ? (
          <div>
            {d.recentTransactions.map(t => (
              <TransactionRow key={t.id} transaction={t} currency={currency} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No transactions yet</p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
