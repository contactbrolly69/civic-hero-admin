import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? 'https://joxliieaxokhptnwuckd.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpveGxpaWVheG9raHB0bnd1Y2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NjUwNzIsImV4cCI6MjA5NTM0MTA3Mn0.0QnkBPjg04Oen8Q71Bh6Uinnb-yR60NYYHYRGb9eZyY';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // API auth routes — never intercept, let them handle themselves
  if (path.startsWith('/api/auth/')) {
    return supabaseResponse;
  }

  // Auth routes — redirect to dashboard if already logged in
  if (path.startsWith('/login')) {
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url));
    return supabaseResponse;
  }

  // Protected routes — redirect to login if not authenticated
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
