import { supabase } from '@/lib/supabaseClient';
import { Child } from '@/lib/types';

export const listChildren = async (userId?: string): Promise<Child[]> => {
  const query = supabase.from('children').select('*').order('created_at', { ascending: true });
  const { data, error } = userId ? await query.eq('user_id', userId) : await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Child[];
};

export const createChild = async (nickname: string): Promise<Child> => {
  const { data, error } = await supabase
    .from('children')
    .insert({ nickname })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Child;
};

export const updateChild = async (childId: string, nickname: string): Promise<Child> => {
  const { data, error } = await supabase
    .from('children')
    .update({ nickname })
    .eq('id', childId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Child;
};

export const deleteChild = async (childId: string): Promise<void> => {
  const { error } = await supabase
    .from('children')
    .delete()
    .eq('id', childId);

  if (error) {
    throw error;
  }
};
