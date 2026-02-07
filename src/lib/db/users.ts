import { supabase } from '@/lib/supabaseClient';

export const bootstrapUserProfile = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  const user = authData.user;
  if (!user?.email) {
    return;
  }

  const { error } = await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email,
      role: 'parent',
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw error;
  }
};
