import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/keys';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const pending: Parameters<typeof cookieStore.set>[] = [];

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cs) {
          cs.forEach(({ name, value, options }) => pending.push([name, value, options]));
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      pending.forEach(([name, value, options]) => response.cookies.set(name, value, options));
      return response;
    }

    console.error('[auth/callback] exchangeCodeForSession failed:', error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
