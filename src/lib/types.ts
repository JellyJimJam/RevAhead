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
  childIds?: string[];
};

export type TripInput = Omit<Trip, 'id' | 'createdAt'>;

export type DbTrip = {
  id: string;
  user_id: string;
  date: string;
  start_place_id: string | null;
  end_place_id: string | null;
  start_text: string | null;
  end_text: string | null;
  miles: number;
  notes: string | null;
  created_at: string;
};

export type UserRole = 'parent' | 'employee';

export type Child = {
  id: string;
  user_id: string;
  nickname: string;
  created_at: string;
};
