export const TRIP_REASONS = ['visit', 'school', 'meeting', 'medical', 'other'] as const;

export type TripReason = (typeof TRIP_REASONS)[number];

export type Trip = {
  id: string;
  date: string;
  reason: TripReason;
  destinationName: string;
  destinationAddress?: string;
  oneWayMiles: number;
  roundTrip: boolean;
  notes?: string;
  createdAt: string;
};

export type TripInput = Omit<Trip, 'id' | 'createdAt'>;
