import React, { useState, useRef } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatCurrency, formatDate, TRANSACTION_CATEGORIES } from '../utils/format';
import {
  ArrowsRightLeftIcon, PlusIcon, PencilIcon, TrashIcon,
  MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon, ArrowUpTrayIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../utils/api';

const EXPENSE_CATEGORIES = TRANSACTION_CATEGORIES.EXPENSE;
const INCOME_CATEGORIES = TRANSACTION_CATEGORIES.INCOME;

const defaultForm = {
  amount: '', category: 'Groceries', type: 'EXPENSE',
  date: new Date().toISOString().split('T')[0],
  notes: '', merchant: '', accountId: '', isRecurring: false, recurringInterval: '',
};

const TransactionForm = ({ form, setForm, accounts, onSubmit, loading, onClose }) => {
  const categories = form.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type}
            onChange={e => setForm(f => ({
              ...f, type: e.target.value,
              category: e.target.value === 'INCOME' ? 'Salary' : 'Groceries'
            }))}>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </select>
        </div>
        <div>
          <label className="label">Amount</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00"
            value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
        </div>
      </div>
      <div>
        <label className="label">Merchant / Description</label>
        <input className="input" placeholder="e.g. Whole Foods" value={form.merchant}
          onChange={e => setForm(f => ({ ...f, merchant: e.target.value }))} />
      </div>
      <div>
        <label className="label">Account (optional)</label>
        <select className="input" value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}>
          <option value="">None</option>
          {accounts?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <input className="input" placeholder="Any notes..." value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="recurring" checked={form.isRecurring}
          onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))} />
        <label htmlFor="recurring" className="text-sm text-gray-700 dark:text-gray-300">Recurring transaction</label>
      </div>
      {form.isRecurring && (
        <div>
          <label className="label">Recurrence</label>
          <select className="input" value={form.recurringInterval} onChange={e => setForm(f => ({ ...f, recurringInterval: e.target.value }))}>
            <option value="">Select interval</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : 'Save Transaction'}
        </button>
      </div>
    </form>
  );
};

const TransactionsPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type: '', category: '', search: '', startDate: '', endDate: '' });
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const fileRef = useRef();

  const { data: txData, loading, refetch } = useApi('/transactions', {
    params: { page, limit: 15, ...filters },
  });
  const { data: accData } = useApi('/accounts');
  const { mutate, loading: saving } = useMutation();

  const transactions = txData?.transactions || [];
  const pagination = txData?.pagination;
  const accounts = accData?.accounts || [];

  const openCreate = () => { setForm(defaultForm); setModal('create'); };
  const openEdit = (t) => {
    setEditTarget(t);
    setForm({
      amount: t.amount, category: t.category, type: t.type,
      date: new Date(t.date).toISOString().split('T')[0],
      notes: t.notes || '', merchant: t.merchant || '',
      accountId: t.accountId || '', isRecurring: t.isRecurring,
      recurringInterval: t.recurringInterval || '',
    });
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'create') {
        await mutate('post', '/transactions', form);
        toast.success('Transaction added');
      } else {
        await mutate('patch', `/transactions/${editTarget.id}`, form);
        toast.success('Transaction updated');
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
      await mutate('delete', `/transactions/${deleteTarget.id}`);
      toast.success('Transaction deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/transactions/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported!');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/transactions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Imported ${res.data.imported} transactions`);
      refetch();
    } catch {
      toast.error('Import failed');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Track income and expenses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowUpTrayIcon className="w-4 h-4" /> Export
          </button>
          <button onClick={() => fileRef.current.click()} className="btn-secondary flex items-center gap-2 text-sm">
            <ArrowDownTrayIcon className="w-4 h-4" /> Import
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search transactions..."
              value={filters.search} onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }} />
          </div>
          <select className="input w-36" value={filters.type}
            onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}>
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <input type="date" className="input w-40" value={filters.startDate}
            onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1); }} />
          <input type="date" className="input w-40" value={filters.endDate}
            onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1); }} />
          {Object.values(filters).some(Boolean) && (
            <button onClick={() => setFilters({ type: '', category: '', search: '', startDate: '', endDate: '' })}
              className="btn-secondary text-sm">Clear</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-12 w-full" />)}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ArrowsRightLeftIcon}
            title="No transactions found"
            description="Start adding income and expense transactions to track your cash flow."
            action={<button onClick={openCreate} className="btn-primary">Add transaction</button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Description</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Category</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Account</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">Amount</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                      <td className="px-6 py-3.5 text-sm text-gray-500">{formatDate(t.date)}</td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t.merchant || t.category}</p>
                        {t.notes && <p className="text-xs text-gray-400">{t.notes}</p>}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={t.type === 'INCOME' ? 'badge-income' : 'badge-expense'}>{t.category}</span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-500">{t.account?.name || '—'}</td>
                      <td className={`px-6 py-3.5 text-sm font-semibold text-right ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(t.amount), currency)}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(t)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="btn-secondary p-2 disabled:opacity-40">
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <button disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}
                    className="btn-secondary p-2 disabled:opacity-40">
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Transaction' : 'Edit Transaction'} size="lg">
        <TransactionForm form={form} setForm={setForm} accounts={accounts} onSubmit={handleSubmit} loading={saving} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Transaction"
        message={`Delete this ${deleteTarget?.type?.toLowerCase()} of ${formatCurrency(deleteTarget?.amount, currency)}?`}
      />
    </div>
  );
};

export default TransactionsPage;
