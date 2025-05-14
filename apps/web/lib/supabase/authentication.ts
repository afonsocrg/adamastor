import { SupabaseClient } from '@supabase/supabase-js';
import { UnauthorizedError  } from '@/lib/errors';

type UserWithProfile = {
  id: string;
  email?: string;
  role: 'admin' | 'user';
};

export async function getUserProfile(supabase: SupabaseClient): Promise<UserWithProfile | null> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  // Fetch the user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return null;

  return {
    id: user.id,
    email: user.email,
    role: profile.role
  };
}

export async function assertAuthenticated(supabase: SupabaseClient): Promise<UserWithProfile> {
  const profile = await getUserProfile(supabase);

  if (!profile) throw new UnauthorizedError('Authentication failed');

  return profile;
}