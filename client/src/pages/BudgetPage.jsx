import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProgressBar from '../components/ui/ProgressBar';
import { formatCurrency, TRANSACTION_CATEGORIES } from '../utils/format';
import { WalletIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const now = new Date();
const defaultForm = {
  category: 'Groceries',
  monthlyLimit: '',
  month: now.getMonth() + 1,
  year: now.getFullYear(),
};

const BudgetPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data, loading, refetch } = useApi('/budgets', {
    params: { month: selectedMonth, year: selectedYear },
  });
  const { mutate, loading: saving } = useMutation();
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const budgets = data?.budgets || [];
  const totalBudget = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  const monthLabel = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const openCreate = () => {
    setForm({ ...defaultForm, month: selectedMonth, year: selectedYear });
    setModal('create');
  };
  const openEdit = (b) => {
    setEditTarget(b);
    setForm({ category: b.category, monthlyLimit: b.monthlyLimit, month: b.month, year: b.year });
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'create') {
        await mutate('post', '/budgets', form);
        toast.success('Budget set');
      } else {
        await mutate('patch', `/budgets/${editTarget.id}`, { monthlyLimit: form.monthlyLimit });
        toast.success('Budget updated');
      }
      setModal(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await mutate('delete', `/budgets/${deleteTarget.id}`);
      toast.success('Budget removed');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Planner</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Track spending against your monthly limits</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Budget
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-4">
        <button onClick={prevMonth} className="btn-secondary p-2">←</button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white w-44 text-center">{monthLabel}</h2>
        <button onClick={nextMonth} className="btn-secondary p-2">→</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Budget', value: totalBudget, color: 'text-gray-900 dark:text-white' },
          { label: 'Total Spent', value: totalSpent, color: totalSpent > totalBudget ? 'text-red-600' : 'text-emerald-600' },
          { label: 'Remaining', value: totalBudget - totalSpent, color: totalBudget - totalSpent >= 0 ? 'text-emerald-600' : 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{formatCurrency(s.value, currency)}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-24" />)}</div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <EmptyState icon={WalletIcon} title="No budgets for this month"
            description="Set spending limits for categories like groceries, dining, entertainment, and more."
            action={<button onClick={openCreate} className="btn-primary">Create budget</button>} />
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map(b => (
            <div key={b.id} className="card group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{b.category}</h3>
                    {b.percentage >= 100 && (
                      <span className="text-xs font-medium px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full">Over budget</span>
                    )}
                    {b.percentage >= 80 && b.percentage < 100 && (
                      <span className="text-xs font-medium px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full">Nearing limit</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatCurrency(b.spent, currency)} of {formatCurrency(b.monthlyLimit, currency)}
                    {b.remaining >= 0
                      ? ` — ${formatCurrency(b.remaining, currency)} left`
                      : ` — ${formatCurrency(Math.abs(b.remaining), currency)} over`}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(b)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <ProgressBar value={b.percentage} max={100} color="auto" size="md" showLabel />
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Budget' : 'Edit Budget'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {modal === 'create' && (
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {TRANSACTION_CATEGORIES.EXPENSE.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Monthly Limit</label>
            <input type="number" step="0.01" min="0" className="input" placeholder="500.00"
              value={form.monthlyLimit} onChange={e => setForm(f => ({ ...f, monthlyLimit: e.target.value }))} required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove Budget"
        message={`Remove the budget for "${deleteTarget?.category}"?`}
      />
    </div>
  );
};

export default BudgetPage;
