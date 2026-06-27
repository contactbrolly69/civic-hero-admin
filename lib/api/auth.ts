import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/api/users';
import type { ConsoleSession } from '@/types';

export async function getSession(): Promise<ConsoleSession | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const isAdmin = await checkIsAdmin(user.id);
  if (!isAdmin) return null;

  return {
    userId:  user.id,
    email:   user.email ?? '',
    name:    user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Admin',
    role:    'super_admin',
    isAdmin: true,
  };
}

export async function requireSession(): Promise<ConsoleSession> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}
