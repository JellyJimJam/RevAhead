'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TripForm } from '@/components/trip-form';
import { TripTable } from '@/components/trip-table';
import { calculateTotals } from '@/lib/trips';
import { Trip, TripInput } from '@/lib/types';
import { createTrip, deleteTrip, listTrips, updateTrip } from '@/lib/db/trips';
import { bootstrapUserProfile } from '@/lib/db/users';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/login');
        return;
      }

      try {
        await bootstrapUserProfile();
        const fetchedTrips = await listTrips();
        setTrips(fetchedTrips);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load trips.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const totals = useMemo(() => calculateTotals(trips), [trips]);

  const handleAddOrUpdate = async (input: TripInput) => {
    try {
      if (editingTrip) {
        const saved = await updateTrip(editingTrip.id, input);
        setTrips((curr) => curr.map((trip) => (trip.id === saved.id ? saved : trip)));
        setEditingTrip(null);
        return;
      }

      const created = await createTrip(input);
      setTrips((curr) => [created, ...curr]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trip.');
    }
  };

  const handleDelete = async (tripId: string) => {
    try {
      await deleteTrip(tripId);
      setTrips((curr) => curr.filter((trip) => trip.id !== tripId));
      if (editingTrip?.id === tripId) {
        setEditingTrip(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trip.');
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

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'larlik-mileage-trips.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return <main className="mx-auto w-full max-w-5xl px-4 py-6">Loading...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">LarLik</h1>
            <p className="mt-2 text-sm text-slate-600">A consumer-friendly mileage logging app for foster care parents. Track every trip for reimbursement, reporting, and peace of mind.</p>
          </div>
          <button onClick={handleLogout} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Logout</button>
        </div>
      </header>

      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500">Total Trips</p>
          <p className="mt-1 text-2xl font-semibold">{totals.totalTrips}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-500">Total Miles</p>
          <p className="mt-1 text-2xl font-semibold">{totals.totalMiles.toFixed(1)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
