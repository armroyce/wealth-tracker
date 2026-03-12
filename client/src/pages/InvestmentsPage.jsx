import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useApi, useMutation } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatCard from '../components/ui/StatCard';
import { formatCurrency, formatPercent, INVESTMENT_TYPE_LABELS } from '../utils/format';
import { ChartBarIcon, PlusIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899'];
const TYPES = Object.keys(INVESTMENT_TYPE_LABELS);

const defaultForm = { ticker: '', name: '', shares: '', purchasePrice: '', currentPrice: '', type: 'STOCK', purchaseDate: '', notes: '' };

const InvestmentForm = ({ form, setForm, onSubmit, loading, onClose }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Ticker / Symbol</label>
        <input className="input uppercase" placeholder="e.g. AAPL" value={form.ticker}
          onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} required />
      </div>
      <div>
        <label className="label">Type</label>
        <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {TYPES.map(t => <option key={t} value={t}>{INVESTMENT_TYPE_LABELS[t]}</option>)}
        </select>
      </div>
    </div>
    <div>
      <label className="label">Name</label>
      <input className="input" placeholder="e.g. Apple Inc." value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="label">Shares</label>
        <input type="number" step="any" className="input" placeholder="0" value={form.shares}
          onChange={e => setForm(f => ({ ...f, shares: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Purchase Price</label>
        <input type="number" step="0.01" className="input" placeholder="0.00" value={form.purchasePrice}
          onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Current Price</label>
        <input type="number" step="0.01" className="input" placeholder="0.00" value={form.currentPrice}
          onChange={e => setForm(f => ({ ...f, currentPrice: e.target.value }))} />
      </div>
    </div>
    <div>
      <label className="label">Purchase Date (optional)</label>
      <input type="date" className="input" value={form.purchaseDate}
        onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
    </div>
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
      <button type="submit" disabled={loading} className="btn-primary flex-1">
        {loading ? 'Saving...' : 'Save Investment'}
      </button>
    </div>
  </form>
);

const InvestmentsPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const { data, loading, refetch } = useApi('/investments');
  const { data: allocData, refetch: refetchAlloc } = useApi('/investments/allocation');
  const { mutate, loading: saving } = useMutation();
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const investments = data?.investments || [];
  const summary = data?.summary || {};
  const allocation = allocData?.allocation || [];

  const openCreate = () => { setForm(defaultForm); setModal('create'); };
  const openEdit = (inv) => {
    setEditTarget(inv);
    setForm({
      ticker: inv.ticker, name: inv.name, shares: inv.shares,
      purchasePrice: inv.purchasePrice, currentPrice: inv.currentPrice,
      type: inv.type, purchaseDate: inv.purchaseDate ? new Date(inv.purchaseDate).toISOString().split('T')[0] : '',
      notes: inv.notes || '',
    });
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'create') {
        await mutate('post', '/investments', form);
        toast.success('Investment added');
      } else {
        await mutate('patch', `/investments/${editTarget.id}`, form);
        toast.success('Investment updated');
      }
      setModal(null);
      refetch();
      refetchAlloc();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await mutate('delete', `/investments/${deleteTarget.id}`);
      toast.success('Investment deleted');
      setDeleteTarget(null);
      refetch();
      refetchAlloc();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      const res = await mutate('post', '/investments/refresh-prices', {});
      toast.success(`Updated ${res.updated} prices`);
      refetch();
    } catch {
      toast.error('Failed to refresh prices (check API key)');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Investments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Track your portfolio performance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefreshPrices} disabled={refreshing}
            className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Prices'}
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Add Investment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Portfolio Value" value={summary.totalValue} icon={ChartBarIcon} color="brand" currency={currency} loading={loading} />
        <StatCard title="Total Cost" value={summary.totalCost} color="blue" currency={currency} loading={loading} />
        <StatCard
          title="Total Gain/Loss"
          value={summary.totalGainLoss}
          subtitle={summary.totalCost > 0 ? `${formatPercent(summary.totalGainLossPercent)} overall` : ''}
          color={summary.totalGainLoss >= 0 ? 'green' : 'red'}
          currency={currency}
          loading={loading}
        />
        <StatCard title="Holdings" value={investments.length} subtitle="positions" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <div className="card lg:col-span-2 p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Holdings</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-12" />)}</div>
          ) : investments.length === 0 ? (
            <EmptyState icon={ChartBarIcon} title="No investments yet"
              description="Add stocks, ETFs, crypto or other holdings to track your portfolio."
              action={<button onClick={openCreate} className="btn-primary">Add investment</button>} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Symbol','Name','Shares','Avg Cost','Price','Value','Gain/Loss',''].map(h => (
                      <th key={h} className={`text-xs font-medium text-gray-500 px-4 py-3 ${h === '' ? '' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {investments.map(inv => (
                    <tr key={inv.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{inv.ticker}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{inv.name}</p>
                        <p className="text-xs text-gray-400">{INVESTMENT_TYPE_LABELS[inv.type]}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{inv.shares}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatCurrency(inv.purchasePrice, currency)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{formatCurrency(inv.currentPrice, currency)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(inv.totalValue, currency)}</td>
                      <td className="px-4 py-3">
                        <p className={`text-sm font-semibold ${inv.gainLoss >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {inv.gainLoss >= 0 ? '+' : ''}{formatCurrency(inv.gainLoss, currency)}
                        </p>
                        <p className={`text-xs ${inv.gainLossPercent >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                          {formatPercent(inv.gainLossPercent)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(inv)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(inv)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Allocation Pie */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Allocation</h2>
          {allocation.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">No data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="type" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                    {allocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {allocation.map((a, i) => (
                  <div key={a.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{INVESTMENT_TYPE_LABELS[a.type] || a.type}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{a.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Investment' : 'Edit Investment'} size="lg">
        <InvestmentForm form={form} setForm={setForm} onSubmit={handleSubmit} loading={saving} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Investment"
        message={`Delete ${deleteTarget?.ticker} (${deleteTarget?.name})?`}
      />
    </div>
  );
};

export default InvestmentsPage;
