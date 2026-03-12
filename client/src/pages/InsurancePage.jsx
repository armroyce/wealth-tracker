import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatCurrency, formatDate, INSURANCE_TYPE_LABELS } from '../utils/format';
import { ShieldCheckIcon, PlusIcon, PencilIcon, TrashIcon, BellAlertIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const INSURANCE_TYPES = Object.keys(INSURANCE_TYPE_LABELS);
const INTERVALS = ['monthly', 'quarterly', 'yearly'];

const TYPE_COLORS = {
  HEALTH:     'bg-rose-100 dark:bg-rose-900/30 text-rose-600',
  TERM_LIFE:  'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  WHOLE_LIFE: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
  CAR:        'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  BIKE:       'bg-sky-100 dark:bg-sky-900/30 text-sky-600',
  HOME:       'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
  TRAVEL:     'bg-green-100 dark:bg-green-900/30 text-green-600',
  OTHER:      'bg-gray-100 dark:bg-gray-800 text-gray-500',
};

const TYPE_EMOJI = {
  HEALTH: '🏥', TERM_LIFE: '🛡️', WHOLE_LIFE: '💼', CAR: '🚗',
  BIKE: '🏍️', HOME: '🏠', TRAVEL: '✈️', OTHER: '📋',
};

const getRenewalColor = (days) => {
  if (days <= 15) return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', badge: 'bg-red-100 dark:bg-red-900/30 text-red-600' };
  if (days <= 30) return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' };
  return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' };
};

const defaultForm = {
  name: '', type: 'HEALTH', provider: '', policyNumber: '',
  premium: '', premiumInterval: 'yearly', coverageAmount: '',
  startDate: '', renewalDate: '', notes: '',
};

const InsuranceForm = ({ form, setForm, onSubmit, loading, onClose }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="label">Policy Name</label>
      <input className="input" placeholder="e.g. Family Health Plan" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Type</label>
        <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {INSURANCE_TYPES.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {INSURANCE_TYPE_LABELS[t]}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Provider</label>
        <input className="input" placeholder="e.g. LIC, HDFC ERGO" value={form.provider}
          onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} />
      </div>
    </div>
    <div>
      <label className="label">Policy Number <span className="text-gray-400 text-xs">optional</span></label>
      <input className="input" placeholder="e.g. P/123456789" value={form.policyNumber}
        onChange={e => setForm(f => ({ ...f, policyNumber: e.target.value }))} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Premium (₹)</label>
        <input type="number" step="1" className="input" placeholder="0" value={form.premium}
          onChange={e => setForm(f => ({ ...f, premium: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Frequency</label>
        <select className="input" value={form.premiumInterval} onChange={e => setForm(f => ({ ...f, premiumInterval: e.target.value }))}>
          {INTERVALS.map(i => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}
        </select>
      </div>
    </div>
    <div>
      <label className="label">Coverage Amount (₹) <span className="text-gray-400 text-xs">optional</span></label>
      <input type="number" step="1" className="input" placeholder="e.g. 500000" value={form.coverageAmount}
        onChange={e => setForm(f => ({ ...f, coverageAmount: e.target.value }))} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Start Date <span className="text-gray-400 text-xs">optional</span></label>
        <input type="date" className="input" value={form.startDate}
          onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
      </div>
      <div>
        <label className="label">Renewal Date</label>
        <input type="date" className="input" value={form.renewalDate}
          onChange={e => setForm(f => ({ ...f, renewalDate: e.target.value }))} required />
      </div>
    </div>
    <div>
      <label className="label">Notes <span className="text-gray-400 text-xs">optional</span></label>
      <textarea className="input" rows={2} value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
    </div>
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
      <button type="submit" disabled={loading} className="btn-primary flex-1">
        {loading ? 'Saving...' : 'Save Policy'}
      </button>
    </div>
  </form>
);

const InsurancePage = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const { data, loading, refetch } = useApi('/insurances');
  const { mutate, loading: saving } = useMutation();
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const insurances = data?.insurances || [];
  const upcoming = insurances.filter(p => p.daysUntilRenewal <= 60 && p.daysUntilRenewal >= 0);
  const totalAnnualPremium = insurances.reduce((s, p) => {
    const factor = p.premiumInterval === 'monthly' ? 12 : p.premiumInterval === 'quarterly' ? 4 : 1;
    return s + p.premium * factor;
  }, 0);

  const openCreate = () => { setForm(defaultForm); setModal('create'); };
  const openEdit = (p) => {
    setEditTarget(p);
    setForm({
      name: p.name, type: p.type, provider: p.provider || '', policyNumber: p.policyNumber || '',
      premium: p.premium, premiumInterval: p.premiumInterval,
      coverageAmount: p.coverageAmount || '',
      startDate: p.startDate ? p.startDate.slice(0, 10) : '',
      renewalDate: p.renewalDate.slice(0, 10),
      notes: p.notes || '',
    });
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'create') {
        await mutate('post', '/insurances', form);
        toast.success('Policy added');
      } else {
        await mutate('patch', `/insurances/${editTarget.id}`, form);
        toast.success('Policy updated');
      }
      refetch(); setModal(null);
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await mutate('delete', `/insurances/${deleteTarget.id}`);
      toast.success('Policy deleted');
      refetch(); setDeleteTarget(null);
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Insurance</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Track all your policies and renewal dates</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <PlusIcon className="w-4 h-4" /> Add Policy
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Total Policies</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{insurances.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Annual Premium</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalAnnualPremium, currency)}</p>
        </div>
        <div className={`card text-center ${upcoming.length > 0 ? 'border border-amber-200 dark:border-amber-800' : ''}`}>
          <p className="text-xs text-gray-500 mb-1">Renewing in 60 days</p>
          <p className={`text-3xl font-bold ${upcoming.length > 0 ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
            {upcoming.length}
          </p>
        </div>
      </div>

      {/* Upcoming renewals banner */}
      {upcoming.length > 0 && (
        <div className="card border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
          <div className="flex items-center gap-2 mb-3">
            <BellAlertIcon className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-amber-800 dark:text-amber-400">Upcoming Renewals</h2>
          </div>
          <div className="space-y-2">
            {upcoming.map(p => {
              const c = getRenewalColor(p.daysUntilRenewal);
              return (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl ${c.bg}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{TYPE_EMOJI[p.type]}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.provider || INSURANCE_TYPE_LABELS[p.type]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.badge}`}>
                      {p.daysUntilRenewal === 0 ? 'Today!' : `${p.daysUntilRenewal}d`}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(p.renewalDate, 'short')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && insurances.length === 0 ? (
        <EmptyState icon={ShieldCheckIcon} title="No policies yet"
          description="Add your health, life, vehicle and home insurance policies to track renewals"
          action={<button onClick={openCreate} className="btn-primary text-sm">Add your first policy</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {insurances.map(p => {
            const isUpcoming = p.daysUntilRenewal >= 0 && p.daysUntilRenewal <= 60;
            const c = isUpcoming ? getRenewalColor(p.daysUntilRenewal) : null;
            return (
              <div key={p.id} className={`card group hover:shadow-md transition-shadow ${isUpcoming ? `border ${p.daysUntilRenewal <= 15 ? 'border-red-200 dark:border-red-800' : 'border-amber-200 dark:border-amber-800'}` : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${TYPE_COLORS[p.type]}`}>
                      {TYPE_EMOJI[p.type]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.provider || INSURANCE_TYPE_LABELS[p.type]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUpcoming && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                        {p.daysUntilRenewal === 0 ? 'Today!' : `${p.daysUntilRenewal}d`}
                      </span>
                    )}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Premium</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(p.premium, currency)} <span className="text-gray-400 font-normal">/ {p.premiumInterval}</span>
                    </p>
                  </div>
                  {p.coverageAmount && (
                    <div>
                      <p className="text-gray-400">Coverage</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(p.coverageAmount, currency)}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-gray-400">
                      <CalendarDaysIcon className="w-3.5 h-3.5" />
                      <span>Renews {formatDate(p.renewalDate, 'short')}</span>
                    </div>
                  </div>
                  {p.policyNumber && (
                    <div className="col-span-2">
                      <p className="text-gray-400">Policy # <span className="text-gray-600 dark:text-gray-300">{p.policyNumber}</span></p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Add Insurance Policy' : 'Edit Policy'}>
        <InsuranceForm form={form} setForm={setForm} onSubmit={handleSubmit} loading={saving} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Policy"
        message={`Remove "${deleteTarget?.name}" from your insurance policies?`} />
    </div>
  );
};

export default InsurancePage;
