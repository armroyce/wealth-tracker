import React, { useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';
import { DocumentChartBarIcon } from '@heroicons/react/24/outline';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16'];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const now = new Date();

const ReportsPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const [view, setView] = useState('monthly');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: monthlyData, loading: monthlyLoading } = useApi('/reports/monthly', {
    params: { month, year },
  });
  const { data: annualData, loading: annualLoading } = useApi('/reports/annual', {
    params: { year },
  });

  const md = monthlyData || {};
  const ad = annualData || {};

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Insights</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Analyze your financial patterns</p>
        </div>
        <div className="flex gap-2">
          {['monthly', 'annual'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`text-sm px-4 py-2 rounded-lg font-medium capitalize transition-colors ${view === v ? 'bg-brand-600 text-white' : 'btn-secondary'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'monthly' && (
        <>
          {/* Month selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <select className="input w-36"
              value={month} onChange={e => setMonth(parseInt(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className="input w-28" value={year} onChange={e => setYear(parseInt(e.target.value))}>
              {[2022,2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {monthlyLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-24" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Income', value: md.summary?.income, color: 'text-emerald-600' },
                  { label: 'Expenses', value: md.summary?.expenses, color: 'text-red-500' },
                  { label: 'Savings', value: md.summary?.savings, color: md.summary?.savings >= 0 ? 'text-brand-600' : 'text-red-500' },
                  { label: 'Savings Rate', value: md.summary?.savingsRate ? `${md.summary.savingsRate.toFixed(1)}%` : '—', color: 'text-gray-900 dark:text-white' },
                ].map(s => (
                  <div key={s.label} className="card text-center">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>
                      {typeof s.value === 'number' ? formatCurrency(s.value, currency) : s.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category spending */}
                <div className="card">
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h2>
                  {md.categoryBreakdown?.length ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={md.categoryBreakdown} dataKey="spent" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                            {md.categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-2">
                        {md.categoryBreakdown.slice(0, 6).map((c, i) => (
                          <div key={c.category} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{c.category}</span>
                              {c.overBudget && <span className="text-xs text-red-500">Over</span>}
                            </div>
                            <span className="text-sm font-medium">{formatCurrency(c.spent, currency)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-8">No expense data</p>
                  )}
                </div>

                {/* Income sources */}
                <div className="card">
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Income Sources</h2>
                  {md.incomeBreakdown?.length ? (
                    <>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={md.incomeBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                            {md.incomeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-2">
                        {md.incomeBreakdown.map((c, i) => (
                          <div key={c.category} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{c.category}</span>
                            </div>
                            <span className="text-sm font-medium text-emerald-600">{formatCurrency(c.amount, currency)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-8">No income data</p>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {view === 'annual' && (
        <>
          <div className="flex items-center gap-3">
            <select className="input w-28" value={year} onChange={e => setYear(parseInt(e.target.value))}>
              {[2022,2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {annualLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32" />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Income', value: ad.summary?.totalIncome, color: 'text-emerald-600' },
                  { label: 'Total Expenses', value: ad.summary?.totalExpenses, color: 'text-red-500' },
                  { label: 'Total Savings', value: ad.summary?.totalSavings, color: 'text-brand-600' },
                  { label: 'Savings Rate', value: ad.summary?.savingsRate ? `${ad.summary.savingsRate.toFixed(1)}%` : '—', color: 'text-gray-900 dark:text-white' },
                ].map(s => (
                  <div key={s.label} className="card text-center">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>
                      {typeof s.value === 'number' ? formatCurrency(s.value, currency) : s.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="card">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Breakdown {year}</h2>
                {ad.monthlyBreakdown?.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={ad.monthlyBreakdown.map(m => ({
                      month: MONTH_NAMES[m.month - 1],
                      Income: m.income,
                      Expenses: m.expenses,
                      Savings: Math.max(0, m.savings),
                    }))} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.15)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                      <Legend iconType="circle" iconSize={8} />
                      <Bar dataKey="Income" fill="#10b981" radius={[3,3,0,0]} />
                      <Bar dataKey="Expenses" fill="#ef4444" radius={[3,3,0,0]} />
                      <Bar dataKey="Savings" fill="#6366f1" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-12">No data for {year}</p>
                )}
              </div>

              {/* Top spending categories */}
              {ad.topSpendingCategories?.length > 0 && (
                <div className="card">
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Top Spending Categories {year}</h2>
                  <div className="space-y-3">
                    {ad.topSpendingCategories.map((c, i) => {
                      const pct = ad.summary?.totalExpenses > 0 ? (c.amount / ad.summary.totalExpenses) * 100 : 0;
                      return (
                        <div key={c.category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 dark:text-gray-300">{c.category}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400 text-xs">{pct.toFixed(1)}%</span>
                              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(c.amount, currency)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
