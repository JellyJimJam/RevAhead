'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TripForm } from '@/components/trip-form';
import { TripTable } from '@/components/trip-table';
import { calculateTotals } from '@/lib/trips';
import { Child, Trip, TripInput } from '@/lib/types';
import { createTrip, deleteTrip, listTrips, updateTrip } from '@/lib/db/trips';
import { listChildren } from '@/lib/db/children';
import { listTripChildren, setTripChildren } from '@/lib/db/tripChildren';
import { bootstrapUserProfile } from '@/lib/db/users';
import { supabase } from '@/lib/supabaseClient';

const currentMonth = new Date().toISOString().slice(0, 7);

export default function HomePage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [childrenError, setChildrenError] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [allMonths, setAllMonths] = useState(false);
  const [childFilterId, setChildFilterId] = useState('all');
  const [sharedOnly, setSharedOnly] = useState(false);

  const loadTripsWithChildren = async (currentUserId: string) => {
    let fetchedTrips: Trip[] = [];

    try {
      fetchedTrips = await listTrips(currentUserId);
      setError('');
    } catch {
      setError('Unable to load trips.');
      setTrips([]);
      return;
    }

    let tripChildrenMap: Record<string, string[]> = {};
    if (fetchedTrips.length) {
      try {
        tripChildrenMap = await listTripChildren(fetchedTrips.map((trip) => trip.id));
      } catch {
        setError('Unable to load trips.');
      }
    }

    const hydratedTrips = fetchedTrips.map((trip) => ({
      ...trip,
      childIds: tripChildrenMap[trip.id] ?? [],
    }));
    setTrips(hydratedTrips);
  };

  const loadChildren = async (currentUserId: string) => {
    setChildrenLoading(true);
    try {
      const fetchedChildren = await listChildren(currentUserId);
      setChildren(fetchedChildren);
      setChildrenError('');
    } catch {
      setChildrenError('Couldn’t load children.');
    } finally {
      setChildrenLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/login');
        return;
      }

      const currentUserId = data.session.user.id;
      setUserId(currentUserId);
      setError('');

      try {
        await bootstrapUserProfile();
      } catch {
        setError('Unable to load trips.');
      }

      await Promise.all([loadTripsWithChildren(currentUserId), loadChildren(currentUserId)]);
      setLoading(false);
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

  useEffect(() => {
    setSelectedChildIds(editingTrip?.childIds ?? []);
  }, [editingTrip]);

  const filteredTrips = useMemo(() => {
    let result = trips;

    if (!allMonths && monthFilter) {
      result = result.filter((trip) => trip.date.startsWith(monthFilter));
    }

    if (childFilterId !== 'all') {
      result = result.filter((trip) => trip.childIds?.includes(childFilterId));
    }

    if (sharedOnly) {
      result = result.filter((trip) => (trip.childIds?.length ?? 0) >= 2);
    }

    return result;
  }, [trips, allMonths, monthFilter, childFilterId, sharedOnly]);

  const totals = useMemo(() => calculateTotals(filteredTrips), [filteredTrips]);

  const handleAddOrUpdate = async (input: TripInput, childIds: string[]) => {
    if (!userId) {
      setError('Failed to save trip.');
      return;
    }
    try {
      if (editingTrip) {
        const saved = await updateTrip(editingTrip.id, input);
        try {
          await setTripChildren(saved.id, childIds);
        } catch {
          setError('Failed to save trip.');
          return;
        }
        await loadTripsWithChildren(userId);
        setEditingTrip(null);
        setSelectedChildIds([]);
        return;
      }

      const created = await createTrip(input, userId);
      try {
        await setTripChildren(created.id, childIds);
      } catch {
        setError('Failed to save trip.');
        await deleteTrip(created.id);
        return;
      }
      await loadTripsWithChildren(userId);
      setSelectedChildIds([]);
    } catch {
      setError('Failed to save trip.');
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
    const headers = ['date', 'reason', 'destinationName', 'destinationAddress', 'oneWayMiles', 'roundTrip', 'totalMiles', 'notes', 'children'];
    const rows = filteredTrips.map((trip) => [
      trip.date,
      trip.reason,
      trip.destinationName,
      trip.destinationAddress ?? '',
      trip.oneWayMiles,
      trip.roundTrip,
      trip.oneWayMiles * (trip.roundTrip ? 2 : 1),
      trip.notes ?? '',
      (trip.childIds ?? [])
        .map((childId) => children.find((child) => child.id === childId)?.nickname ?? childId)
        .join('; '),
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
      <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Mileage dashboard</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">LarLik</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">A consumer-friendly mileage logging app for foster care parents. Track every trip for reimbursement, reporting, and peace of mind.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/children" className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Children</Link>
            <button onClick={handleLogout} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Logout</button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}

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
        <TripForm
          onSubmit={handleAddOrUpdate}
          editingTrip={editingTrip}
          onCancelEdit={() => setEditingTrip(null)}
          children={children}
          selectedChildIds={selectedChildIds}
          onChildIdsChange={setSelectedChildIds}
          childrenLoading={childrenLoading}
          childrenError={childrenError}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Trip Log</h2>
            <p className="text-xs text-slate-500">Filter and review mileage by month, child, or shared trips.</p>
          </div>
          <button onClick={handleExport} disabled={!filteredTrips.length} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">Export CSV</button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">Month
              <input type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} disabled={allMonths} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-100" />
            </label>
            <label className="text-sm font-medium text-slate-700">Child
              <select value={childFilterId} onChange={(event) => setChildFilterId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="all">All children</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>{child.nickname}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-col justify-end gap-2 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={allMonths} onChange={(event) => setAllMonths(event.target.checked)} />
                All months
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={sharedOnly} onChange={(event) => setSharedOnly(event.target.checked)} />
                Shared trips only
              </label>
            </div>
          </div>
        </div>
        <TripTable trips={filteredTrips} onEdit={setEditingTrip} onDelete={handleDelete} />
      </section>
    </main>
  );
}
