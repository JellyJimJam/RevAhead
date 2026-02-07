'use client';

import { formatReason, totalMilesForTrip } from '@/lib/trips';
import { Trip } from '@/lib/types';

type Props = {
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onDelete: (tripId: string) => void;
};

export function TripTable({ trips, onEdit, onDelete }: Props) {
  if (!trips.length) {
    return <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">No trips yet. Add your first trip above.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Miles</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{trip.date}</td>
                <td className="px-4 py-3">{formatReason(trip.reason)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{trip.destinationName}</p>
                  {trip.destinationAddress && <p className="text-xs text-slate-500">{trip.destinationAddress}</p>}
                </td>
                <td className="px-4 py-3">{totalMilesForTrip(trip).toFixed(1)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => onEdit(trip)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700">Edit</button>
                    <button onClick={() => onDelete(trip.id)} className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
