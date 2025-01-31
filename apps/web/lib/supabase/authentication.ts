import { SupabaseClient } from '@supabase/supabase-js';
import { UnauthorizedError  } from '@/lib/errors';

export async function assertAuthenticated(supabase: SupabaseClient) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw new UnauthorizedError('Authentication failed');
  if (!user) throw new UnauthorizedError('Authentication failed');
  return user;
}