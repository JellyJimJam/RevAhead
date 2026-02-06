import { Trip } from './types';

export const totalMilesForTrip = (trip: Pick<Trip, 'oneWayMiles' | 'roundTrip'>) =>
  trip.oneWayMiles * (trip.roundTrip ? 2 : 1);

export const formatReason = (reason: string) =>
  reason.charAt(0).toUpperCase() + reason.slice(1);

export const calculateTotals = (trips: Trip[]) => {
  const totalTrips = trips.length;
  const totalMiles = trips.reduce((sum, trip) => sum + totalMilesForTrip(trip), 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthMiles = trips
    .filter((trip) => trip.date.startsWith(currentMonth))
    .reduce((sum, trip) => sum + totalMilesForTrip(trip), 0);

  return { totalTrips, totalMiles, monthMiles };
};
