import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProgressBar from '../components/ui/ProgressBar';
import { formatCurrency, formatDate } from '../utils/format';
import { FlagIcon, PlusIcon, PencilIcon, TrashIcon, TrophyIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const GOAL_CATEGORIES = ['Savings', 'Travel', 'Real Estate', 'Vehicle', 'Education', 'Emergency Fund', 'Retirement', 'Business', 'Other'];

const defaultForm = { name: '', targetAmount: '', currentAmount: '', deadline: '', category: 'Savings', notes: '' };

const GoalForm = ({ form, setForm, onSubmit, loading, onClose }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="label">Goal Name</label>
      <input className="input" placeholder="e.g. Emergency Fund" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
    </div>
    <div>
      <label className="label">Category</label>
      <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
        {GOAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Target Amount</label>
        <input type="number" step="0.01" className="input" placeholder="10000.00" value={form.targetAmount}
          onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Current Amount</label>
        <input type="number" step="0.01" className="input" placeholder="0.00" value={form.currentAmount}
          onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))} />
      </div>
    </div>
    <div>
      <label className="label">Target Date (optional)</label>
      <input type="date" className="input" value={form.deadline}
        onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
    </div>
    <div>
      <label className="label">Notes (optional)</label>
      <input className="input" placeholder="Any notes..." value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
    </div>
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
      <button type="submit" disabled={loading} className="btn-primary flex-1">
        {loading ? 'Saving...' : 'Save Goal'}
      </button>
    </div>
  </form>
);

const ContributeModal = ({ goal, onClose, onSuccess, currency }) => {
  const { mutate, loading } = useMutation();
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await mutate('post', `/goals/${goal.id}/contribute`, { amount: parseFloat(amount) });
      toast.success(res.message);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Add funds to <span className="font-medium text-gray-900 dark:text-white">{goal.name}</span>.
        Currently {formatCurrency(goal.currentAmount, currency)} of {formatCurrency(goal.targetAmount, currency)}.
      </p>
      <div>
        <label className="label">Amount to Add</label>
        <input type="number" step="0.01" min="0" className="input" placeholder="500.00"
          value={amount} onChange={e => setAmount(e.target.value)} required />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : 'Add Contribution'}
        </button>
      </div>
    </form>
  );
};

const CATEGORY_ICONS = {
  Savings: '💰', Travel: '✈️', 'Real Estate': '🏠', Vehicle: '🚗',
  Education: '📚', 'Emergency Fund': '🛡️', Retirement: '🏖️', Business: '💼', Other: '🎯',
};

const GoalsPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const { data, loading, refetch } = useApi('/goals');
  const { mutate, loading: saving } = useMutation();
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [contributeTarget, setContributeTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const goals = data?.goals || [];
  const active = goals.filter(g => !g.isCompleted);
  const completed = goals.filter(g => g.isCompleted);

  const openCreate = () => { setForm(defaultForm); setModal('create'); };
  const openEdit = (g) => {
    setEditTarget(g);
    setForm({
      name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount,
      deadline: g.deadline ? new Date(g.deadline).toISOString().split('T')[0] : '',
      category: g.category || 'Savings', notes: g.notes || '',
    });
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'create') {
        await mutate('post', '/goals', form);
        toast.success('Goal created');
      } else {
        await mutate('patch', `/goals/${editTarget.id}`, form);
        toast.success('Goal updated');
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
      await mutate('delete', `/goals/${deleteTarget.id}`);
      toast.success('Goal deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Goals</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Track progress toward your savings targets</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> New Goal
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-48" />)}
        </div>
      ) : active.length === 0 ? (
        <div className="card">
          <EmptyState icon={FlagIcon} title="No goals yet"
            description="Set savings goals with target amounts and deadlines to stay motivated."
            action={<button onClick={openCreate} className="btn-primary">Create your first goal</button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {active.map(goal => (
            <div key={goal.id} className="card group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[goal.category] || '🎯'}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                    <p className="text-xs text-gray-400">{goal.category}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(goal)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(goal)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(goal.currentAmount, currency)}
                  </span>
                  <span className="text-sm text-gray-500">of {formatCurrency(goal.targetAmount, currency)}</span>
                </div>
                <ProgressBar value={goal.progress} max={100} color="auto" size="md" />
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs font-medium text-brand-600 dark:text-brand-400">{goal.progress?.toFixed(1)}%</span>
                  <span className="text-xs text-gray-400">
                    {formatCurrency(goal.remaining, currency)} to go
                  </span>
                </div>
              </div>

              {goal.deadline && (
                <p className="text-xs text-gray-400 mb-3">
                  Target: {formatDate(goal.deadline)} {goal.monthsToGoal !== null && `(${goal.monthsToGoal} months)`}
                </p>
              )}

              <button onClick={() => setContributeTarget(goal)}
                className="w-full btn-secondary text-sm py-1.5">
                + Add Contribution
              </button>
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-amber-500" /> Completed Goals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.map(goal => (
              <div key={goal.id} className="card opacity-75 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[goal.category] || '🎯'}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {goal.name}
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full">Completed</span>
                    </h3>
                    <p className="text-sm text-gray-500">{formatCurrency(goal.targetAmount, currency)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'New Goal' : 'Edit Goal'} size="lg">
        <GoalForm form={form} setForm={setForm} onSubmit={handleSubmit} loading={saving} onClose={() => setModal(null)} />
      </Modal>

      <Modal open={!!contributeTarget} onClose={() => setContributeTarget(null)} title="Add Contribution" size="sm">
        {contributeTarget && (
          <ContributeModal goal={contributeTarget} currency={currency} onClose={() => setContributeTarget(null)} onSuccess={refetch} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Goal"
        message={`Delete "${deleteTarget?.name}"?`}
      />
    </div>
  );
};

export default GoalsPage;
