import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProgressBar from '../components/ui/ProgressBar';
import StatCard from '../components/ui/StatCard';
import { formatCurrency, DEBT_TYPE_LABELS } from '../utils/format';
import { CreditCardIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DEBT_TYPES = Object.keys(DEBT_TYPE_LABELS);
const defaultForm = { name: '', balance: '', originalBalance: '', interestRate: '', minimumPayment: '', type: 'CREDIT_CARD', dueDate: '', notes: '' };

const DebtForm = ({ form, setForm, onSubmit, loading, onClose }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="label">Name</label>
      <input className="input" placeholder="e.g. Chase Sapphire" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
    </div>
    <div>
      <label className="label">Type</label>
      <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
        {DEBT_TYPES.map(t => <option key={t} value={t}>{DEBT_TYPE_LABELS[t]}</option>)}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Current Balance</label>
        <input type="number" step="0.01" className="input" placeholder="0.00" value={form.balance}
          onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Original Balance</label>
        <input type="number" step="0.01" className="input" placeholder="0.00" value={form.originalBalance}
          onChange={e => setForm(f => ({ ...f, originalBalance: e.target.value }))} />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Interest Rate (%)</label>
        <input type="number" step="0.01" className="input" placeholder="5.99" value={form.interestRate}
          onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Min. Payment</label>
        <input type="number" step="0.01" className="input" placeholder="0.00" value={form.minimumPayment}
          onChange={e => setForm(f => ({ ...f, minimumPayment: e.target.value }))} required />
      </div>
    </div>
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
      <button type="submit" disabled={loading} className="btn-primary flex-1">
        {loading ? 'Saving...' : 'Save Debt'}
      </button>
    </div>
  </form>
);

const DebtsPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const { data, loading, refetch } = useApi('/debts');
  const { data: payoffData, refetch: refetchPlan } = useApi('/debts/payoff-plan', { params: { method: 'avalanche' } });
  const { mutate, loading: saving } = useMutation();
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [payoffMethod, setPayoffMethod] = useState('avalanche');

  const debts = data?.debts || [];
  const summary = data?.summary || {};

  const openCreate = () => { setForm(defaultForm); setModal('create'); };
  const openEdit = (d) => {
    setEditTarget(d);
    setForm({ name: d.name, balance: d.balance, originalBalance: d.originalBalance || '', interestRate: d.interestRate, minimumPayment: d.minimumPayment, type: d.type, notes: d.notes || '', dueDate: '' });
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'create') {
        await mutate('post', '/debts', form);
        toast.success('Debt added');
      } else {
        await mutate('patch', `/debts/${editTarget.id}`, form);
        toast.success('Debt updated');
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
      await mutate('delete', `/debts/${deleteTarget.id}`);
      toast.success('Debt deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const markPaidOff = async (debt) => {
    try {
      await mutate('patch', `/debts/${debt.id}`, { isPaidOff: true });
      toast.success('Marked as paid off!');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Debt Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Manage loans, credit cards, and mortgages</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> Add Debt
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Debt" value={summary.totalDebt} icon={CreditCardIcon} color="red" currency={currency} loading={loading} />
        <StatCard title="Total Min. Payment" value={summary.totalMinPayment} subtitle="per month" color="amber" currency={currency} loading={loading} />
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32" />)}</div>
      ) : debts.filter(d => !d.isPaidOff).length === 0 ? (
        <div className="card">
          <EmptyState icon={CreditCardIcon} title="No active debts"
            description="Add debts to track balances, interest rates, and calculate your payoff schedule."
            action={<button onClick={openCreate} className="btn-primary">Add debt</button>} />
        </div>
      ) : (
        <div className="space-y-4">
          {debts.filter(d => !d.isPaidOff).map(debt => {
            const paidPct = debt.originalBalance
              ? ((debt.originalBalance - debt.balance) / debt.originalBalance) * 100
              : 0;
            return (
              <div key={debt.id} className="card group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{debt.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                        {DEBT_TYPE_LABELS[debt.type]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {debt.interestRate}% APR · Min. {formatCurrency(debt.minimumPayment, currency)}/mo
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center">
                    <button onClick={() => markPaidOff(debt)} className="text-xs px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50">
                      Paid off
                    </button>
                    <button onClick={() => openEdit(debt)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(debt)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(debt.balance, currency)}</p>
                  {debt.payoffMonths && (
                    <p className="text-xs text-gray-400">Payoff in ~{debt.payoffMonths} months</p>
                  )}
                </div>
                {debt.originalBalance && (
                  <ProgressBar value={paidPct} max={100} color="green" size="md" showLabel label={`${paidPct.toFixed(0)}% paid off`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payoff Strategy */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Payoff Strategy</h2>
          <div className="flex gap-2">
            {['avalanche', 'snowball'].map(m => (
              <button key={m} onClick={() => setPayoffMethod(m)}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${payoffMethod === m ? 'bg-brand-600 text-white' : 'btn-secondary'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {payoffMethod === 'avalanche'
            ? 'Avalanche: Pay highest interest rate first. Minimizes total interest paid.'
            : 'Snowball: Pay smallest balance first. Builds momentum with quick wins.'}
        </p>
        {debts.filter(d => !d.isPaidOff).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No active debts</p>
        ) : (
          <div className="space-y-2">
            {[...debts.filter(d => !d.isPaidOff)]
              .sort((a, b) => payoffMethod === 'avalanche' ? b.interestRate - a.interestRate : a.balance - b.balance)
              .map((d, i) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{d.name}</p>
                      <p className="text-xs text-gray-400">{d.interestRate}% · {formatCurrency(d.balance, currency)}</p>
                    </div>
                  </div>
                  {d.payoffMonths && (
                    <span className="text-xs text-gray-500">~{d.payoffMonths}mo</span>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Add Debt' : 'Edit Debt'} size="lg">
        <DebtForm form={form} setForm={setForm} onSubmit={handleSubmit} loading={saving} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Debt"
        message={`Delete "${deleteTarget?.name}"?`}
      />
    </div>
  );
};

export default DebtsPage;
