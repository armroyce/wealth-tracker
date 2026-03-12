import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatCurrency, ACCOUNT_TYPE_LABELS } from '../utils/format';
import { BanknotesIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS);

const ACCOUNT_COLORS = {
  CHECKING: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  SAVINGS: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
  BROKERAGE: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600',
  CRYPTO: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  REAL_ESTATE: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
  RETIREMENT: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  CREDIT_CARD: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  LOAN: 'bg-gray-100 dark:bg-gray-800 text-gray-600',
  OTHER: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
};

const defaultForm = { name: '', type: 'CHECKING', balance: '', currency: 'INR', institution: '' };

const AccountForm = ({ form, setForm, onSubmit, loading, onClose }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="label">Account Name</label>
      <input className="input" placeholder="e.g. Chase Checking" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Type</label>
        <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Currency</label>
        <select className="input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
          {['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
    <div>
      <label className="label">Current Balance</label>
      <input type="number" step="0.01" className="input" placeholder="0.00" value={form.balance}
        onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} required />
    </div>
    <div>
      <label className="label">Institution (optional)</label>
      <input className="input" placeholder="e.g. Chase Bank" value={form.institution}
        onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} />
    </div>
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
      <button type="submit" disabled={loading} className="btn-primary flex-1">
        {loading ? 'Saving...' : 'Save Account'}
      </button>
    </div>
  </form>
);

const AccountsPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const { data, loading, refetch } = useApi('/accounts');
  const { mutate, loading: saving } = useMutation();
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const accounts = data?.accounts || [];
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const openCreate = () => { setForm(defaultForm); setModal('create'); };
  const openEdit = (acc) => {
    setEditTarget(acc);
    setForm({ name: acc.name, type: acc.type, balance: acc.balance, currency: acc.currency, institution: acc.institution || '' });
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'create') {
        await mutate('post', '/accounts', form);
        toast.success('Account created');
      } else {
        await mutate('patch', `/accounts/${editTarget.id}`, form);
        toast.success('Account updated');
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
      await mutate('delete', `/accounts/${deleteTarget.id}`);
      toast.success('Account deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Manage your financial accounts</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Account
        </button>
      </div>

      <StatCard title="Total Balance" value={totalBalance} icon={BanknotesIcon} color="brand" currency={currency} loading={loading} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-36" />)}
        </div>
      ) : accounts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={BanknotesIcon}
            title="No accounts yet"
            description="Add your bank accounts, investment accounts, and more to track your total balance."
            action={<button onClick={openCreate} className="btn-primary">Add your first account</button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <div key={acc.id} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${ACCOUNT_COLORS[acc.type]}`}>
                  {ACCOUNT_TYPE_LABELS[acc.type]}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(acc)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(acc)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">{acc.name}</p>
              {acc.institution && <p className="text-xs text-gray-400 mt-0.5">{acc.institution}</p>}
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-3">
                {formatCurrency(acc.balance, acc.currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Account' : 'Edit Account'}>
        <AccountForm form={form} setForm={setForm} onSubmit={handleSubmit} loading={saving} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Account"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
};

export default AccountsPage;
