'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Child, TRIP_REASONS, Trip, TripInput } from '@/lib/types';
import { totalMilesForTrip } from '@/lib/trips';

type Props = {
  onSubmit: (trip: TripInput, childIds: string[]) => void;
  editingTrip?: Trip | null;
  onCancelEdit?: () => void;
  children: Child[];
  selectedChildIds: string[];
  onChildIdsChange: (childIds: string[]) => void;
};

const initialForm: TripInput = {
  date: new Date().toISOString().slice(0, 10),
  reason: 'visit',
  destinationName: '',
  destinationAddress: '',
  oneWayMiles: 0,
  roundTrip: true,
  notes: '',
};

export function TripForm({
  onSubmit,
  editingTrip,
  onCancelEdit,
  children,
  selectedChildIds,
  onChildIdsChange,
}: Props) {
  const [form, setForm] = useState<TripInput>(editingTrip ?? initialForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTrip) {
      setForm(editingTrip);
      return;
    }

    setForm(initialForm);
    setError('');
  }, [editingTrip]);

  const computedMiles = form.oneWayMiles > 0 ? totalMilesForTrip(form) : 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.date || !form.reason || !form.destinationName.trim() || form.oneWayMiles <= 0) {
      setError('Please complete required fields and enter miles greater than 0.');
      return;
    }
    setError('');
    onSubmit({
      ...form,
      destinationName: form.destinationName.trim(),
      destinationAddress: form.destinationAddress?.trim(),
      notes: form.notes?.trim(),
    }, selectedChildIds);

    if (!editingTrip) {
      setForm(initialForm);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{editingTrip ? 'Edit Trip' : 'Add a Trip'}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Date*
          <input type="date" value={form.date} onChange={(e) => setForm((curr) => ({ ...curr, date: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="text-sm font-medium text-slate-700">Reason*
          <select value={form.reason} onChange={(e) => setForm((curr) => ({ ...curr, reason: e.target.value as Trip['reason'] }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            {TRIP_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">Destination name*
        <input value={form.destinationName} onChange={(e) => setForm((curr) => ({ ...curr, destinationName: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="County office, school, clinic..." required />
      </label>

      <label className="block text-sm font-medium text-slate-700">Destination address (optional)
        <input value={form.destinationAddress} onChange={(e) => setForm((curr) => ({ ...curr, destinationAddress: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="123 Main St" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">One-way miles*
          <input type="number" min={0.1} step={0.1} value={form.oneWayMiles || ''} onChange={(e) => setForm((curr) => ({ ...curr, oneWayMiles: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" required />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 pt-7">
          <input type="checkbox" checked={form.roundTrip} onChange={(e) => setForm((curr) => ({ ...curr, roundTrip: e.target.checked }))} />
          Round trip
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">Notes (optional)
        <textarea value={form.notes} onChange={(e) => setForm((curr) => ({ ...curr, notes: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows={3} />
      </label>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Children (optional)</p>
        {children.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {children.map((child) => {
              const checked = selectedChildIds.includes(child.id);
              return (
                <label key={child.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...selectedChildIds, child.id]
                        : selectedChildIds.filter((id) => id !== child.id);
                      onChildIdsChange(next);
                    }}
                  />
                  {child.nickname}
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No children yet. Add nicknames on the Children page.</p>
        )}
      </div>

      <p className="text-sm text-brand-700">Calculated total miles: <span className="font-semibold">{computedMiles.toFixed(1)}</span></p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          {editingTrip ? 'Save Changes' : 'Save Trip'}
        </button>
        {editingTrip && (
          <button type="button" onClick={onCancelEdit} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
