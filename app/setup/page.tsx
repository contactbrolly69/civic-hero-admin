'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Status {
  authenticated:        boolean;
  email:                string | null;
  userId:               string | null;
  adminCount:           number | null;
  serviceKeyConfigured: boolean;
  error:                string | null;
}

export default function SetupPage() {
  const router = useRouter();
  const [status,  setStatus]  = useState<Status | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetch('/api/admin/bootstrap')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  async function handleBootstrap() {
    setWorking(true);
    setMessage('');
    try {
      const res  = await fetch('/api/admin/bootstrap', { method: 'POST' });
      const body = await res.json();
      if (res.ok) {
        setMsgType('success');
        setMessage(`Admin account created for ${body.email}. Redirecting…`);
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setMsgType('error');
        setMessage(body.error ?? 'Unknown error');
      }
    } catch (e: any) {
      setMsgType('error');
      setMessage(e?.message ?? 'Request failed');
    } finally {
      setWorking(false);
    }
  }

  const canBootstrap = status?.authenticated && status?.serviceKeyConfigured && status?.adminCount === 0;
  const alreadyAdmin = (status?.adminCount ?? 0) > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-console-bg px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <svg width="40" height="40" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="13.2" fill="#1F1F1F" />
            <path d="M 0 0 L 26.4 0 A 26.4 26.4 0 0 1 0 26.4 Z" fill="#BE5A38" clipPath="url(#b)" />
            <clipPath id="b"><rect width="48" height="48" rx="13.2" /></clipPath>
          </svg>
          <h1 className="text-lg font-semibold text-white">Admin Setup</h1>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">One-time bootstrap</p>
        </div>

        <div className="rounded-2xl border border-console-border bg-console-surface p-6 space-y-4">

          {/* Diagnostics */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Diagnostics</p>
            {status === null ? (
              <p className="text-xs text-slate-500">Loading…</p>
            ) : (
              <div className="space-y-1.5 text-xs font-mono">
                <Row label="Auth session"    ok={status.authenticated} value={status.email ?? 'not signed in'} />
                <Row label="Service role key" ok={status.serviceKeyConfigured} value={status.serviceKeyConfigured ? 'configured' : 'MISSING'} />
                <Row label="Admin count"     ok={status.adminCount !== null} value={status.adminCount !== null ? String(status.adminCount) : 'query failed'} />
                {status.userId && <Row label="Your user ID" ok value={status.userId} mono />}
                {status.error  && <Row label="DB error"     ok={false} value={status.error} />}
              </div>
            )}
          </div>

          {/* Action */}
          {status && (
            <div className="pt-2 border-t border-slate-800 space-y-3">
              {!status.authenticated && (
                <p className="text-xs text-amber-400">
                  You are not signed in. <a href="/login" className="underline">Sign in first</a>, then return to this page.
                </p>
              )}
              {status.authenticated && !status.serviceKeyConfigured && (
                <p className="text-xs text-red-400">
                  <strong>SUPABASE_SERVICE_ROLE_KEY</strong> is not set in the Vercel project environment variables. Add it in
                  Vercel → Project Settings → Environment Variables, then redeploy.
                </p>
              )}
              {alreadyAdmin && (
                <p className="text-xs text-slate-400">
                  Admins already exist ({status.adminCount}). Bootstrap is disabled.{' '}
                  <a href="/dashboard" className="text-blue-400 underline">Try the dashboard →</a>
                </p>
              )}
              {canBootstrap && (
                <>
                  <p className="text-xs text-green-400">
                    Ready to bootstrap. The admins table is empty. Click below to add <strong>{status.email}</strong> as the first admin.
                  </p>
                  <button
                    onClick={handleBootstrap}
                    disabled={working}
                    className="w-full rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    {working ? 'Creating admin…' : 'Make me an admin'}
                  </button>
                </>
              )}

              {message && (
                <div className={`rounded-lg border px-3 py-2.5 text-xs ${
                  msgType === 'success'
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}>
                  {message}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600">
          This page is only useful when no admins exist. It becomes inert once the first admin is created.
        </p>
      </div>
    </div>
  );
}

function Row({ label, ok, value, mono }: { label: string; ok: boolean; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className={ok ? 'text-green-400' : 'text-red-400'}>{ok ? '✓' : '✗'}</span>
      <span className="text-slate-500 shrink-0 w-36">{label}</span>
      <span className={`text-slate-300 break-all ${mono ? 'font-mono text-[10px]' : ''}`}>{value}</span>
    </div>
  );
}
