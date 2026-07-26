import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

/** GET — returns current admin count and auth status (for the setup page UI) */
export async function GET() {
  const anon = await createClient();
  const { data: { user } } = await anon.auth.getUser();

  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/﻿/g, '').trim();
  const hasServiceKey = serviceKey.length > 20;

  if (!hasServiceKey) {
    return NextResponse.json({
      authenticated: !!user,
      email: user?.email ?? null,
      userId: user?.id ?? null,
      adminCount: null,
      serviceKeyConfigured: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on this deployment',
    });
  }

  const db = await createServiceClient();
  const { count, error } = await db.from('admins').select('*', { count: 'exact', head: true });

  return NextResponse.json({
    authenticated: !!user,
    email: user?.email ?? null,
    userId: user?.id ?? null,
    adminCount: error ? null : (count ?? 0),
    serviceKeyConfigured: true,
    error: error?.message ?? null,
  });
}

/** POST — inserts the authenticated user into the admins table IF the table is empty */
export async function POST() {
  const anon = await createClient();
  const { data: { user } } = await anon.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated. Sign in first.' }, { status: 401 });
  }

  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/﻿/g, '').trim();
  if (serviceKey.length < 20) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured. Add it in the Vercel project settings.' }, { status: 500 });
  }

  const db = await createServiceClient();

  // Safety check: only bootstrap when table is completely empty
  const { count, error: countError } = await db.from('admins').select('*', { count: 'exact', head: true });
  if (countError) {
    console.error('[bootstrap] admins count error:', countError.message);
    return NextResponse.json({ error: `Database error: ${countError.message}` }, { status: 500 });
  }
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Bootstrap disabled — admins already exist. Contact an existing admin.' }, { status: 403 });
  }

  // Check the user exists in profiles (required by FK)
  const { data: profile } = await db.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (!profile) {
    // If they signed up via this admin console and don't have a profile row, insert a minimal one
    const { error: profileError } = await db.from('profiles').insert({
      id:        user.id,
      name:      user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Admin',
      handle:    null,
      ward:      null,
      joined_at: new Date().toISOString(),
    });
    if (profileError) {
      console.error('[bootstrap] profile insert error:', profileError.message);
      return NextResponse.json({ error: `Profile creation failed: ${profileError.message}` }, { status: 500 });
    }
  }

  const { error: insertError } = await db.from('admins').insert({ user_id: user.id });
  if (insertError) {
    console.error('[bootstrap] admins insert error:', insertError.message);
    return NextResponse.json({ error: `Failed to create admin: ${insertError.message}` }, { status: 500 });
  }

  console.log('[bootstrap] First admin created:', user.id, user.email);
  return NextResponse.json({ success: true, userId: user.id, email: user.email });
}
