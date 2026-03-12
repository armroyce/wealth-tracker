import React, { useState } from 'react';
import { useApi, useMutation } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatCurrency, formatDate, PHYSICAL_ASSET_TYPE_LABELS } from '../utils/format';
import { BuildingOffice2Icon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ASSET_TYPES = Object.keys(PHYSICAL_ASSET_TYPE_LABELS);

const TYPE_COLORS = {
  HOUSE:       'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
  LAND:        'bg-green-100 dark:bg-green-900/30 text-green-600',
  GOLD:        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700',
  SILVER:      'bg-gray-100 dark:bg-gray-800 text-gray-500',
  CAR:         'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  BIKE:        'bg-sky-100 dark:bg-sky-900/30 text-sky-600',
  JEWELLERY:   'bg-pink-100 dark:bg-pink-900/30 text-pink-600',
  ELECTRONICS: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
  ART:         'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  OTHER:       'bg-gray-100 dark:bg-gray-800 text-gray-500',
};

const TYPE_EMOJI = {
  HOUSE: '🏠', LAND: '🌿', GOLD: '🥇', SILVER: '🪙', CAR: '🚗',
  BIKE: '🏍️', JEWELLERY: '💍', ELECTRONICS: '💻', ART: '🖼️', OTHER: '📦',
};

const defaultForm = { name: '', type: 'GOLD', currentValue: '', purchaseValue: '', purchaseDate: '', notes: '' };

const AssetForm = ({ form, setForm, onSubmit, loading, onClose }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="label">Asset Name</label>
      <input className="input" placeholder="e.g. My House, Gold 10g" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
    </div>
    <div>
      <label className="label">Type</label>
      <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
        {ASSET_TYPES.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {PHYSICAL_ASSET_TYPE_LABELS[t]}</option>)}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Current Value (₹)</label>
        <input type="number" step="1" className="input" placeholder="0" value={form.currentValue}
          onChange={e => setForm(f => ({ ...f, currentValue: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Purchase Value (₹) <span className="text-gray-400 text-xs">optional</span></label>
        <input type="number" step="1" className="input" placeholder="0" value={form.purchaseValue}
          onChange={e => setForm(f => ({ ...f, purchaseValue: e.target.value }))} />
      </div>
    </div>
    <div>
      <label className="label">Purchase Date <span className="text-gray-400 text-xs">optional</span></label>
      <input type="date" className="input" value={form.purchaseDate}
        onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
    </div>
    <div>
      <label className="label">Notes <span className="text-gray-400 text-xs">optional</span></label>
      <textarea className="input" rows={2} placeholder="e.g. location, description..." value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
    </div>
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
      <button type="submit" disabled={loading} className="btn-primary flex-1">
        {loading ? 'Saving...' : 'Save Asset'}
      </button>
    </div>
  </form>
);

const PhysicalAssetsPage = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const { data, loading, refetch } = useApi('/physical-assets');
  const { mutate, loading: saving } = useMutation();
  const [modal, setModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const assets = data?.assets || [];
  const totalCurrentValue = data?.totalCurrentValue || 0;
  const totalPurchaseValue = data?.totalPurchaseValue || 0;
  const gainLoss = totalCurrentValue - totalPurchaseValue;

  const openCreate = () => { setForm(defaultForm); setModal('create'); };
  const openEdit = (a) => {
    setEditTarget(a);
    setForm({
      name: a.name, type: a.type,
      currentValue: a.currentValue,
      purchaseValue: a.purchaseValue || '',
      purchaseDate: a.purchaseDate ? a.purchaseDate.slice(0, 10) : '',
      notes: a.notes || '',
    });
    setModal('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'create') {
        await mutate('post', '/physical-assets', form);
        toast.success('Asset added');
      } else {
        await mutate('patch', `/physical-assets/${editTarget.id}`, form);
        toast.success('Asset updated');
      }
      refetch(); setModal(null);
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await mutate('delete', `/physical-assets/${deleteTarget.id}`);
      toast.success('Asset deleted');
      refetch(); setDeleteTarget(null);
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Physical Assets</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">House, land, gold, vehicles and more</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <PlusIcon className="w-4 h-4" /> Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Current Value" value={totalCurrentValue} color="green" currency={currency} loading={loading} />
        <StatCard title="Total Purchase Value" value={totalPurchaseValue} color="blue" currency={currency} loading={loading} />
        <StatCard title="Gain / Loss" value={gainLoss} color={gainLoss >= 0 ? 'green' : 'red'} currency={currency} loading={loading} />
      </div>

      {!loading && assets.length === 0 ? (
        <EmptyState icon={BuildingOffice2Icon} title="No assets yet"
          description="Track your house, land, gold, vehicles and other physical assets"
          action={<button onClick={openCreate} className="btn-primary text-sm">Add your first asset</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map(a => {
            const gl = a.purchaseValue ? a.currentValue - a.purchaseValue : null;
            return (
              <div key={a.id} className="card group hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${TYPE_COLORS[a.type]}`}>
                      {TYPE_EMOJI[a.type]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.name}</p>
                      <p className="text-xs text-gray-400">{PHYSICAL_ASSET_TYPE_LABELS[a.type]}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatCurrency(a.currentValue, currency)}
                </p>
                {a.purchaseValue && (
                  <p className="text-xs text-gray-400">
                    Bought: {formatCurrency(a.purchaseValue, currency)}
                    {gl !== null && (
                      <span className={`ml-2 font-medium ${gl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {gl >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(gl), currency)}
                      </span>
                    )}
                  </p>
                )}
                {a.purchaseDate && (
                  <p className="text-xs text-gray-400 mt-1">Since {formatDate(a.purchaseDate, 'short')}</p>
                )}
                {a.notes && <p className="text-xs text-gray-400 mt-1 truncate">{a.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Add Physical Asset' : 'Edit Asset'}>
        <AssetForm form={form} setForm={setForm} onSubmit={handleSubmit} loading={saving} onClose={() => setModal(null)} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Asset"
        message={`Remove "${deleteTarget?.name}" from your assets?`} />
    </div>
  );
};

export default PhysicalAssetsPage;
