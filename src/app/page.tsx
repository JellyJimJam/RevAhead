'use client';

import { useEffect, useMemo, useState } from 'react';
import { TripForm } from '@/components/trip-form';
import { TripTable } from '@/components/trip-table';
import { calculateTotals, createTrip, loadTrips, persistTrips } from '@/lib/trips';
import { Trip, TripInput } from '@/lib/types';

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  useEffect(() => {
    setTrips(loadTrips());
  }, []);

  useEffect(() => {
    persistTrips(trips);
  }, [trips]);

  const totals = useMemo(() => calculateTotals(trips), [trips]);

  const handleAddOrUpdate = (input: TripInput) => {
    if (editingTrip) {
      setTrips((curr) =>
        curr.map((trip) =>
          trip.id === editingTrip.id ? { ...trip, ...input } : trip,
        ),
      );
      setEditingTrip(null);
      return;
    }

    setTrips((curr) => [createTrip(input), ...curr]);
  };

  const handleDelete = (tripId: string) => {
    setTrips((curr) => curr.filter((trip) => trip.id !== tripId));
    if (editingTrip?.id === tripId) {
      setEditingTrip(null);
    }
  };

  const handleExport = () => {
    const headers = ['date', 'reason', 'destinationName', 'destinationAddress', 'oneWayMiles', 'roundTrip', 'totalMiles', 'notes'];
    const rows = trips.map((trip) => [
      trip.date,
      trip.reason,
      trip.destinationName,
      trip.destinationAddress ?? '',
      trip.oneWayMiles,
      trip.roundTrip,
      trip.oneWayMiles * (trip.roundTrip ? 2 : 1),
      trip.notes ?? '',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'revahead-mileage-trips.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">RevAhead Mileage</h1>
        <p className="mt-2 text-sm text-slate-600">A consumer-friendly mileage logging app for foster care parents. Track every trip for reimbursement, reporting, and peace of mind.</p>
      </header>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs uppercase text-slate-500">Total Trips</p>
          <p className="mt-1 text-2xl font-semibold">{totals.totalTrips}</p>
        </article>
        <article className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs uppercase text-slate-500">Total Miles</p>
          <p className="mt-1 text-2xl font-semibold">{totals.totalMiles.toFixed(1)}</p>
        </article>
        <article className="rounded-xl bg-white p-4 shadow-sm border border-slate-200">
          <p className="text-xs uppercase text-slate-500">This Month</p>
          <p className="mt-1 text-2xl font-semibold">{totals.monthMiles.toFixed(1)} mi</p>
        </article>
      </section>

      <section className="mb-6">
        <TripForm onSubmit={handleAddOrUpdate} editingTrip={editingTrip} onCancelEdit={() => setEditingTrip(null)} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trip Log</h2>
          <button onClick={handleExport} disabled={!trips.length} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">Export CSV</button>
        </div>
        <TripTable trips={trips} onEdit={setEditingTrip} onDelete={handleDelete} />
      </section>
    </main>
  );
}
