import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './keys';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}

/**
 * Service-role client - server side ONLY, never shipped to the browser.
 *
 * Uses @supabase/supabase-js createClient directly (NOT @supabase/ssr).
 * Root cause of the previous bug: createServerClient from @supabase/ssr reads
 * the user session from cookies and overwrites the Authorization header with
 * the user's JWT. PostgREST sees role="authenticated" instead of
 * role="service_role", so RLS is applied and the admins table (which only
 * allows admins to read it) returns an error. This client sends the service
 * role key as both apikey and Authorization Bearer, so PostgREST
 * unconditionally bypasses RLS for all queries.
 */
export function createServiceClient() {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/﻿/g, '').trim();
  return createSupabaseClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken:   false,
      persistSession:     false,
      detectSessionInUrl: false,
    },
  });
}
