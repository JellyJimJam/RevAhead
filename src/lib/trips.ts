import { Trip, TripInput } from './types';

const STORAGE_KEY = 'revahead-mileage-trips';

export const totalMilesForTrip = (trip: Pick<Trip, 'oneWayMiles' | 'roundTrip'>) =>
  trip.oneWayMiles * (trip.roundTrip ? 2 : 1);

export const formatReason = (reason: string) =>
  reason.charAt(0).toUpperCase() + reason.slice(1);

export const loadTrips = (): Trip[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Trip[];
    return parsed.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch {
    return [];
  }
};

export const persistTrips = (trips: Trip[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
};

export const createTrip = (input: TripInput): Trip => ({
  ...input,
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
});

export const calculateTotals = (trips: Trip[]) => {
  const totalTrips = trips.length;
  const totalMiles = trips.reduce((sum, trip) => sum + totalMilesForTrip(trip), 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthMiles = trips
    .filter((trip) => trip.date.startsWith(currentMonth))
    .reduce((sum, trip) => sum + totalMilesForTrip(trip), 0);

  return { totalTrips, totalMiles, monthMiles };
};
