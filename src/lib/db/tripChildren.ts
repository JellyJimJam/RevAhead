import { supabase } from '@/lib/supabaseClient';

export type TripChildrenMap = Record<string, string[]>;

type TripChildRow = {
  trip_id: string;
  child_id: string;
};

// trip_children rows are scoped via trips.user_id RLS policies, not a user_id column.
export const listTripChildren = async (tripIds: string[]): Promise<TripChildrenMap> => {
  if (!tripIds.length) {
    return {};
  }

  const { data, error } = await supabase
    .from('trip_children')
    .select('trip_id, child_id')
    .in('trip_id', tripIds);

  if (error) {
    throw error;
  }

  const map: TripChildrenMap = {};
  (data as TripChildRow[]).forEach((row) => {
    if (!map[row.trip_id]) {
      map[row.trip_id] = [];
    }
    map[row.trip_id].push(row.child_id);
  });

  return map;
};

export const setTripChildren = async (tripId: string, childIds: string[]) => {
  const { error: deleteError } = await supabase
    .from('trip_children')
    .delete()
    .eq('trip_id', tripId);

  if (deleteError) {
    throw deleteError;
  }

  if (!childIds.length) {
    return;
  }

  const rows = childIds.map((childId) => ({ trip_id: tripId, child_id: childId }));

  const { error: insertError } = await supabase
    .from('trip_children')
    .insert(rows);

  if (insertError) {
    throw insertError;
  }
};
