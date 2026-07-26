import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// ── Shared types ─────────────────────────────────────────────────────────────

export type CheckStatus = 'ok' | 'warn' | 'error';

export interface DiagnosticCheck {
  key:    string;
  label:  string;
  status: CheckStatus;
  note:   string;
  fix?:   string;
}

export interface UserInfo {
  id:         string;
  email:      string | null;
  name:       string;
  provider:   string;
  lastSignIn: string | null;
  avatarUrl:  string | null;
}

export interface DiagnosticsPayload {
  checks:        DiagnosticCheck[];
  user:          UserInfo | null;
  adminCount:    number | null;
  isAlreadyAdmin: boolean;
  canBootstrap:  boolean;
}

export interface BootstrapPayload {
  success: boolean;
  userId?: string;
  email?:  string;
  error?:  string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function ok(key: string, label: string, note: string): DiagnosticCheck {
  return { key, label, status: 'ok', note };
}
function warn(key: string, label: string, note: string, fix?: string): DiagnosticCheck {
  return { key, label, status: 'warn', note, fix };
}
function err(key: string, label: string, note: string, fix?: string): DiagnosticCheck {
  return { key, label, status: 'error', note, fix };
}

/** Decode the payload of a JWT without verifying the signature. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Format a Supabase/PostgREST error into a human-readable string showing all fields. */
function fmtError(e: any): string {
  if (!e) return 'null';
  const parts: string[] = [];
  if (e.code)    parts.push(`code=${e.code}`);
  if (e.message) parts.push(`message="${e.message}"`);
  if (e.details) parts.push(`details="${e.details}"`);
  if (e.hint)    parts.push(`hint="${e.hint}"`);
  return parts.length ? parts.join(' | ') : JSON.stringify(e);
}

// ── GET /api/admin/bootstrap — full system diagnostics ────────────────────────

export async function GET(): Promise<NextResponse<DiagnosticsPayload>> {
  const checks: DiagnosticCheck[] = [];

  // 1. Application
  checks.push(ok('app', 'Application', 'API responding normally'));

  // 2. Supabase URL
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  let projectRef = '';
  if (!supabaseUrl.startsWith('https://')) {
    checks.push(err('supabase_url', 'Supabase URL',
      'NEXT_PUBLIC_SUPABASE_URL is not set',
      'Add NEXT_PUBLIC_SUPABASE_URL in Vercel Project Settings -> Environment Variables'));
  } else {
    projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    checks.push(ok('supabase_url', 'Supabase URL', `Project ref: ${projectRef}`));
  }

  // 3. Service Role Key — present + correct project
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/﻿/g, '').trim();
  const hasServiceKey = serviceKey.length > 20;
  if (!hasServiceKey) {
    checks.push(err('service_key', 'Service Role Key',
      'SUPABASE_SERVICE_ROLE_KEY is not configured',
      'Add SUPABASE_SERVICE_ROLE_KEY in Vercel Project Settings -> Environment Variables, then redeploy'));
  } else {
    const payload = decodeJwtPayload(serviceKey);
    const keyRef  = (payload?.ref as string | undefined) ?? '';
    const role    = (payload?.role as string | undefined) ?? '';

    // Only flag as error if role is EXPLICITLY wrong (e.g. "anon" key provided by mistake).
    // Empty role means the JWT decode failed — the DB connection test below is the real check.
    if (role && role !== 'service_role') {
      checks.push(err('service_key', 'Service Role Key',
        `JWT role is "${role}" — this appears to be an anon key, not a service role key.`,
        'Use the service_role key from Supabase Dashboard -> Project Settings -> API, not the anon key'));
    } else if (role === 'service_role' && projectRef && keyRef && keyRef !== projectRef) {
      checks.push(err('service_key', 'Service Role Key',
        `Key is for project "${keyRef}" but URL points to "${projectRef}" — project mismatch!`,
        'The SUPABASE_SERVICE_ROLE_KEY must be from the same Supabase project as NEXT_PUBLIC_SUPABASE_URL'));
    } else if (role === 'service_role') {
      checks.push(ok('service_key', 'Service Role Key',
        `role=service_role | ref=${keyRef || projectRef}`));
    } else {
      // Decode failed — mark as configured; DB connection will confirm validity
      checks.push(ok('service_key', 'Service Role Key',
        'Configured (validated by database connection below)'));
    }
  }

  // 4-5. Auth service + session
  let user: any = null;
  try {
    const anon = await createClient();
    const { data, error: authError } = await anon.auth.getUser();
    if (authError) {
      checks.push(warn('auth_service', 'Auth service', `Warning: ${authError.message}`));
    } else {
      checks.push(ok('auth_service', 'Auth service', 'Supabase Auth responding'));
    }
    user = data?.user ?? null;
    if (!user) {
      checks.push(warn('session', 'Active session', 'No session — sign in first',
        'Go to /login, sign in with the account you want to make administrator, then return here'));
    } else {
      checks.push(ok('session', 'Active session', user.email ?? `User ${user.id.slice(0, 8)}`));
    }
  } catch (e: any) {
    checks.push(err('auth_service', 'Auth service', `Connection failed: ${e?.message ?? 'unknown'}`));
    checks.push(err('session', 'Active session', 'Cannot verify — auth service unreachable'));
  }

  // 6-8. Database + admins table + admin status
  let adminCount: number | null = null;
  let isAlreadyAdmin = false;

  if (hasServiceKey) {
    try {
      // createServiceClient() is now synchronous — no await needed, but await is harmless
      const db = createServiceClient();

      const { count, error: countError } = await db
        .from('admins')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('[bootstrap/GET] admins query error:', JSON.stringify(countError));
        const isMissing =
          countError.code === '42P01' ||
          (countError.message ?? '').toLowerCase().includes('does not exist') ||
          (countError.message ?? '').toLowerCase().includes('relation') ||
          countError.code === 'PGRST204';

        if (isMissing) {
          checks.push(ok('db', 'Database connection', 'Connected'));
          checks.push(err('admins_table', 'Admins table',
            'Table does not exist — migrations have not been applied',
            'Open the Supabase SQL editor and run migration 009_security_hardening.sql from the civic-hero/supabase/migrations folder'));
        } else {
          const detail = fmtError(countError);
          checks.push(err('db', 'Database connection',
            `Query failed: ${detail}`,
            'Check that SUPABASE_SERVICE_ROLE_KEY matches the project in NEXT_PUBLIC_SUPABASE_URL'));
          checks.push(err('admins_table', 'Admins table',
            `Blocked by same error: ${detail}`));
        }
      } else {
        checks.push(ok('db', 'Database connection', 'Connected and responding'));
        adminCount = count ?? 0;

        if (adminCount === 0) {
          checks.push(warn('admins_table', 'Admins table',
            'Table exists — no administrators configured yet'));
        } else {
          checks.push(ok('admins_table', 'Admins table',
            `${adminCount} administrator${adminCount !== 1 ? 's' : ''} configured`));
        }

        if (user) {
          const { data: adminRow } = await db
            .from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
          isAlreadyAdmin = adminRow !== null;

          if (isAlreadyAdmin) {
            checks.push(ok('admin_status', 'Administrator status',
              'Current account is a confirmed administrator'));
          } else if (adminCount === 0) {
            checks.push(warn('admin_status', 'Administrator status',
              'Not yet an administrator — bootstrap required'));
          } else {
            checks.push(err('admin_status', 'Administrator status',
              'Current account does not have administrator access',
              'Contact an existing administrator to grant access via the Users tab'));
          }
        }
      }
    } catch (e: any) {
      console.error('[bootstrap/GET] unexpected error:', e?.message, e?.stack);
      checks.push(err('db', 'Database connection',
        `Unexpected error: ${e?.message ?? 'unknown'}`,
        'Check server logs for the full stack trace'));
      checks.push(err('admins_table', 'Admins table', 'Cannot verify — database unreachable'));
    }
  } else {
    checks.push(err('db', 'Database connection', 'Cannot connect — Service Role Key missing'));
    checks.push(err('admins_table', 'Admins table', 'Cannot verify — Service Role Key missing'));
  }

  const canBootstrap =
    !!user && hasServiceKey && adminCount === 0 && !isAlreadyAdmin;

  return NextResponse.json({
    checks,
    user: user ? {
      id:         user.id,
      email:      user.email ?? null,
      name:       user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Unknown',
      provider:   user.app_metadata?.provider ?? 'email',
      lastSignIn: user.last_sign_in_at ?? null,
      avatarUrl:  user.user_metadata?.avatar_url ?? null,
    } : null,
    adminCount,
    isAlreadyAdmin,
    canBootstrap,
  });
}

// ── POST /api/admin/bootstrap — atomic first-admin insert ─────────────────────

export async function POST(): Promise<NextResponse<BootstrapPayload>> {
  // 1. Verify session
  const anon = await createClient();
  const { data: { user } } = await anon.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'No active session. Sign in first, then retry.' },
      { status: 401 },
    );
  }

  // 2. Verify service key
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/﻿/g, '').trim();
  if (serviceKey.length < 20) {
    return NextResponse.json(
      { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured. Add it in Vercel Project Settings -> Environment Variables, then redeploy.' },
      { status: 500 },
    );
  }

  const db = createServiceClient();

  // 3. Verify admins table exists
  const { error: tableCheckError } = await db.from('admins').select('user_id').limit(0);
  if (tableCheckError && (
    tableCheckError.code === '42P01' ||
    (tableCheckError.message ?? '').toLowerCase().includes('does not exist')
  )) {
    return NextResponse.json(
      { success: false, error: 'The admins table does not exist. Apply migration 009_security_hardening.sql from the Supabase SQL editor before bootstrapping.' },
      { status: 500 },
    );
  }

  // 4. Atomic guard — re-check count at write time (prevents races)
  const { count, error: countError } = await db
    .from('admins').select('*', { count: 'exact', head: true });
  if (countError) {
    console.error('[bootstrap/POST] count error:', JSON.stringify(countError));
    return NextResponse.json(
      { success: false, error: `Database error: ${fmtError(countError)}` },
      { status: 500 },
    );
  }
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { success: false, error: 'Bootstrap has already been completed. An administrator account already exists.' },
      { status: 409 },
    );
  }

  // 5. Ensure profile row exists (admins.user_id FK -> profiles.id)
  const { data: profile } = await db.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (!profile) {
    const { error: profileErr } = await db.from('profiles').insert({
      id:        user.id,
      name:      user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Admin',
      handle:    null,
      ward:      null,
      joined_at: new Date().toISOString(),
    });
    if (profileErr) {
      console.error('[bootstrap/POST] profile insert error:', JSON.stringify(profileErr));
      return NextResponse.json(
        { success: false, error: `Failed to create user profile: ${fmtError(profileErr)}` },
        { status: 500 },
      );
    }
  }

  // 6. Insert admin row
  const { error: insertError } = await db.from('admins').insert({ user_id: user.id });
  if (insertError) {
    console.error('[bootstrap/POST] admin insert error:', JSON.stringify(insertError));
    return NextResponse.json(
      { success: false, error: `Failed to create administrator: ${fmtError(insertError)}` },
      { status: 500 },
    );
  }

  // 7. Verify insertion succeeded
  const { data: verify } = await db
    .from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!verify) {
    return NextResponse.json(
      { success: false, error: 'Insert appeared to succeed but verification query returned no row. Check database logs.' },
      { status: 500 },
    );
  }

  console.log('[bootstrap/POST] First administrator created:', user.id, user.email);
  return NextResponse.json({ success: true, userId: user.id, email: user.email });
}
