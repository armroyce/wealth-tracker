import React, { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useApi, useMutation } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import { formatCurrency, formatDate } from '../utils/format';
import { PresentationChartLineIcon, CameraIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg p-3 text-sm">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCurrency(p.value, currency)}
        </p>
      ))}
    </div>
  );
};

const NetWorthPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [months, setMonths] = useState(12);
  const { data: nwData, loading } = useApi('/networth');
  const { data: histData, loading: histLoading, refetch: refetchHist } = useApi('/networth/history', { params: { months } });
  const { mutate, loading: snapshotting } = useMutation();

  const nw = nwData || {};
  const history = histData?.history || [];

  const chartData = history.map(s => ({
    date: formatDate(s.date, 'short'),
    'Net Worth': s.totalAssets - s.totalLiabilities,
    Assets: s.totalAssets,
    Liabilities: s.totalLiabilities,
  }));

  const handleSnapshot = async () => {
    try {
      await mutate('post', '/networth/snapshot', {});
      toast.success('Snapshot saved!');
      refetchHist();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const breakdown = nw.breakdown || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Net Worth</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Your complete financial picture</p>
        </div>
        <button onClick={handleSnapshot} disabled={snapshotting} className="btn-secondary flex items-center gap-2 text-sm">
          <CameraIcon className="w-4 h-4" />
          {snapshotting ? 'Saving...' : 'Save Snapshot'}
        </button>
      </div>

      {/* Net worth hero */}
      <div className="card text-center py-10">
        <p className="text-sm font-medium text-gray-500 mb-2">Total Net Worth</p>
        <p className={`text-5xl font-bold ${nw.netWorth >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
          {loading ? '—' : formatCurrency(nw.netWorth, currency)}
        </p>
        <p className="text-sm text-gray-400 mt-2">Total Assets − Total Liabilities</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Assets" value={nw.totalAssets} color="green" currency={currency} loading={loading} />
        <StatCard title="Total Liabilities" value={nw.totalLiabilities} color="red" currency={currency} loading={loading} />
        <StatCard title="Liquid Assets" value={breakdown.liquidAssets} color="blue" currency={currency} loading={loading} />
        <StatCard title="Investments" value={breakdown.investments} color="brand" currency={currency} loading={loading} />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Asset Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: 'Liquid Assets', value: breakdown.liquidAssets, color: 'bg-blue-500' },
              { label: 'Investments', value: breakdown.investments, color: 'bg-brand-500' },
              { label: 'Real Estate', value: breakdown.realEstate, color: 'bg-orange-500' },
              { label: 'Retirement', value: breakdown.retirement, color: 'bg-purple-500' },
              { label: 'Other Assets', value: breakdown.otherAssets, color: 'bg-gray-400' },
            ].map(item => {
              const pct = nw.totalAssets > 0 ? (item.value / nw.totalAssets) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.value || 0, currency)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
          <div className="space-y-4">
            {[
              { label: 'Debt-to-Asset Ratio', value: nw.totalAssets > 0 ? `${((nw.totalLiabilities / nw.totalAssets) * 100).toFixed(1)}%` : '—' },
              { label: 'Asset Utilization', value: nw.totalAssets > 0 ? `${(((nw.totalAssets - nw.totalLiabilities) / nw.totalAssets) * 100).toFixed(1)}%` : '—' },
              { label: 'Liquid Assets %', value: nw.totalAssets > 0 ? `${((breakdown.liquidAssets / nw.totalAssets) * 100).toFixed(1)}%` : '—' },
              { label: 'Investment %', value: nw.totalAssets > 0 ? `${((breakdown.investments / nw.totalAssets) * 100).toFixed(1)}%` : '—' },
            ].map(stat => (
              <div key={stat.label} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Net Worth History</h2>
          <div className="flex gap-2">
            {[3, 6, 12, 24].map(m => (
              <button key={m} onClick={() => setMonths(m)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${months === m ? 'bg-brand-600 text-white' : 'btn-secondary'}`}>
                {m}mo
              </button>
            ))}
          </div>
        </div>
        {histLoading ? (
          <div className="skeleton h-64" />
        ) : chartData.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <PresentationChartLineIcon className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">Take your first snapshot to start tracking net worth over time.</p>
            <button onClick={handleSnapshot} className="btn-primary mt-3 text-sm">Take Snapshot</button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,114,128,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="Net Worth" stroke="#6366f1" fill="url(#nwGradient)" strokeWidth={2} />
              <Line type="monotone" dataKey="Assets" stroke="#10b981" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Liabilities" stroke="#ef4444" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default NetWorthPage;
