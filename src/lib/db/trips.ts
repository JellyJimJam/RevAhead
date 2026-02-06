import { supabase } from '@/lib/supabaseClient';
import { DbTrip, Trip, TripInput, TripReason } from '@/lib/types';

const METADATA_PREFIX = '[REV_META]';

type TripMetadata = {
  reason: TripReason;
  destinationAddress?: string;
  oneWayMiles: number;
  roundTrip: boolean;
  userNotes?: string;
};

const fallbackMetadata = (trip: DbTrip): TripMetadata => ({
  reason: 'other',
  destinationAddress: undefined,
  oneWayMiles: Number(trip.miles) || 0,
  roundTrip: false,
  userNotes: trip.notes ?? undefined,
});

const parseMetadata = (notes: string | null, trip: DbTrip): TripMetadata => {
  if (!notes?.startsWith(METADATA_PREFIX)) {
    return fallbackMetadata(trip);
  }

  try {
    return JSON.parse(notes.slice(METADATA_PREFIX.length)) as TripMetadata;
  } catch {
    return fallbackMetadata(trip);
  }
};

const serializeMetadata = (input: TripInput) =>
  `${METADATA_PREFIX}${JSON.stringify({
    reason: input.reason,
    destinationAddress: input.destinationAddress,
    oneWayMiles: input.oneWayMiles,
    roundTrip: input.roundTrip,
    userNotes: input.notes,
  } satisfies TripMetadata)}`;

const mapDbTripToTrip = (trip: DbTrip): Trip => {
  const meta = parseMetadata(trip.notes, trip);

  return {
    id: trip.id,
    date: trip.date,
    reason: meta.reason,
    destinationName: trip.end_text ?? '',
    destinationAddress: meta.destinationAddress,
    oneWayMiles: meta.oneWayMiles,
    roundTrip: meta.roundTrip,
    notes: meta.userNotes,
    createdAt: trip.created_at,
  };
};

export const listTrips = async (): Promise<Trip[]> => {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbTrip[]).map(mapDbTripToTrip);
};

export const createTrip = async (input: TripInput): Promise<Trip> => {
  const totalMiles = input.oneWayMiles * (input.roundTrip ? 2 : 1);

  const { data, error } = await supabase
    .from('trips')
    .insert({
      date: input.date,
      start_text: null,
      end_text: input.destinationName,
      miles: totalMiles,
      notes: serializeMetadata(input),
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapDbTripToTrip(data as DbTrip);
};

export const updateTrip = async (tripId: string, input: TripInput): Promise<Trip> => {
  const totalMiles = input.oneWayMiles * (input.roundTrip ? 2 : 1);

  const { data, error } = await supabase
    .from('trips')
    .update({
      date: input.date,
      end_text: input.destinationName,
      miles: totalMiles,
      notes: serializeMetadata(input),
    })
    .eq('id', tripId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapDbTripToTrip(data as DbTrip);
};

export const deleteTrip = async (tripId: string): Promise<void> => {
  const { error } = await supabase.from('trips').delete().eq('id', tripId);

  if (error) {
    throw error;
  }
};
