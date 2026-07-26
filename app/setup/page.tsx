'use client';

import { useState, useEffect, useCallback } from 'react';
import { DiagnosticRow }     from '@/components/setup/DiagnosticRow';
import { UserCard }          from '@/components/setup/UserCard';
import { ConfirmationDialog } from '@/components/setup/ConfirmationDialog';
import { SuccessScreen }     from '@/components/setup/SuccessScreen';
import type { DiagnosticsPayload, DiagnosticCheck } from '@/app/api/admin/bootstrap/route';

// ── State machine ────────────────────────────────────────────────────────────

type Phase =
  | 'loading'       // initial fetch in flight
  | 'ready'         // diagnostics shown, can maybe bootstrap
  | 'confirming'    // modal open
  | 'bootstrapping' // POST in flight
  | 'success'       // done — SuccessScreen takes over
  | 'error';        // bootstrap POST failed

// ── Logo ─────────────────────────────────────────────────────────────────────

function PatchLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="13.2" fill="#1F1F1F" />
      <path d="M 0 0 L 26.4 0 A 26.4 26.4 0 0 1 0 26.4 Z" fill="#BE5A38" clipPath="url(#clip0)" />
      <clipPath id="clip0"><rect width="48" height="48" rx="13.2" /></clipPath>
    </svg>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function allOk(checks: DiagnosticCheck[]): boolean {
  return checks.every(c => c.status === 'ok');
}

function hasErrors(checks: DiagnosticCheck[]): boolean {
  return checks.some(c => c.status === 'error');
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const [phase,       setPhase]       = useState<Phase>('loading');
  const [data,        setData]        = useState<DiagnosticsPayload | null>(null);
  const [revealed,    setRevealed]    = useState(0);   // how many rows to show
  const [errorMsg,    setErrorMsg]    = useState('');
  const [successEmail, setSuccessEmail] = useState('');

  // ── Fetch diagnostics ───────────────────────────────────────────────────────

  const fetchDiagnostics = useCallback(async () => {
    setPhase('loading');
    setData(null);
    setRevealed(0);
    try {
      const res  = await fetch('/api/admin/bootstrap');
      const body = (await res.json()) as DiagnosticsPayload;
      setData(body);
      // Stagger reveal
      body.checks.forEach((_, i) => {
        setTimeout(() => setRevealed(r => Math.max(r, i + 1)), i * 120 + 200);
      });
      setTimeout(() => setPhase('ready'), body.checks.length * 120 + 600);
    } catch {
      setPhase('error');
      setErrorMsg('Failed to contact the diagnostics API. Check the browser console.');
    }
  }, []);

  useEffect(() => { fetchDiagnostics(); }, [fetchDiagnostics]);

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  async function runBootstrap() {
    setPhase('bootstrapping');
    try {
      const res  = await fetch('/api/admin/bootstrap', { method: 'POST' });
      const body = await res.json();
      if (res.status === 409) {
        setPhase('error');
        setErrorMsg('Bootstrap already completed — an administrator exists. Reload the page.');
        return;
      }
      if (!res.ok || !body.success) {
        setPhase('error');
        setErrorMsg(body.error ?? 'Unknown error from bootstrap endpoint');
        return;
      }
      setSuccessEmail(body.email ?? data?.user?.email ?? 'unknown');
      setPhase('success');
    } catch (e: any) {
      setPhase('error');
      setErrorMsg(e?.message ?? 'Network error');
    }
  }

  // ── Render: success takeover ─────────────────────────────────────────────

  if (phase === 'success') {
    return <SuccessScreen email={successEmail} />;
  }

  // ── Render: main ─────────────────────────────────────────────────────────

  const totalChecks = data?.checks.length ?? 0;
  const diagDone    = revealed >= totalChecks && totalChecks > 0;

  const canBootstrap  = data?.canBootstrap  ?? false;
  const alreadyAdmin  = data?.isAlreadyAdmin ?? false;
  const adminCount    = data?.adminCount    ?? null;

  const overallStatus: 'ok' | 'warn' | 'error' | 'loading' =
    phase === 'loading'        ? 'loading'
    : !data                    ? 'error'
    : hasErrors(data.checks)   ? 'error'
    : !allOk(data.checks)      ? 'warn'
    : 'ok';

  return (
    <div className="flex min-h-screen flex-col items-center bg-console-bg px-4 py-12">
      {phase === 'confirming' && data?.user && (
        <ConfirmationDialog
          email={data.user.email ?? 'Unknown'}
          onConfirm={runBootstrap}
          onCancel={() => setPhase('ready')}
        />
      )}

      <div className="w-full max-w-xl space-y-6">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 text-center">
          <PatchLogo />
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Civic Hero Admin Setup
            </h1>
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">
              one-time bootstrap wizard
            </p>
          </div>
        </div>

        {/* ── System status card ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-console-border bg-console-surface overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <StatusDot status={overallStatus} />
              <span className="text-sm font-semibold text-slate-200">System diagnostics</span>
            </div>
            {phase !== 'loading' && (
              <button
                onClick={fetchDiagnostics}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded border border-slate-700 hover:border-slate-500"
              >
                ↻ Refresh
              </button>
            )}
          </div>

          <div className="px-5 py-4 space-y-0.5 min-h-[160px]">
            {phase === 'loading' && !data && (
              <div className="flex items-center gap-2 py-6 justify-center">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-slate-700 border-t-slate-400 animate-spin" />
                <span className="text-xs text-slate-500">Running diagnostics…</span>
              </div>
            )}

            {data?.checks.map((check, i) => (
              <DiagnosticRow
                key={check.key}
                check={check}
                resolved={revealed > i}
                delayMs={i * 120}
              />
            ))}
          </div>
        </div>

        {/* ── Current user card ────────────────────────────────────────────── */}
        {data?.user && (
          <div className="rounded-2xl border border-console-border bg-console-surface overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed-in account</span>
            </div>
            <div className="p-5">
              <UserCard user={data.user} />
            </div>
          </div>
        )}

        {/* ── Bootstrap status card ────────────────────────────────────────── */}
        {diagDone && data && (
          <div className="rounded-2xl border border-console-border bg-console-surface overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bootstrap</span>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                alreadyAdmin  ? 'bg-emerald-500/15 text-emerald-400' :
                canBootstrap  ? 'bg-amber-500/15 text-amber-400'     :
                                'bg-red-500/15 text-red-400'
              }`}>
                {alreadyAdmin ? 'ACTIVE' : canBootstrap ? 'REQUIRED' : 'UNAVAILABLE'}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Already admin */}
              {alreadyAdmin && (
                <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 p-4">
                  <p className="text-sm text-emerald-300 font-medium mb-1">You are already an administrator</p>
                  <p className="text-xs text-emerald-400/70">
                    {adminCount !== null ? `${adminCount} admin account${adminCount !== 1 ? 's' : ''} configured.` : ''}
                    {' '}Bootstrap is disabled — the admin table is not empty.
                  </p>
                  <a
                    href="/dashboard"
                    className="mt-3 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
                  >
                    Open dashboard →
                  </a>
                </div>
              )}

              {/* Admins exist but current user isn't one */}
              {!alreadyAdmin && (adminCount ?? 0) > 0 && (
                <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-4">
                  <p className="text-sm text-slate-300 font-medium mb-1">Bootstrap already completed</p>
                  <p className="text-xs text-slate-500">
                    {adminCount} administrator{adminCount !== 1 ? 's' : ''} already exist.
                    Contact an existing admin to grant you access via the Users tab.
                  </p>
                </div>
              )}

              {/* Ready to bootstrap */}
              {canBootstrap && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-slate-800/40 border border-slate-700 p-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      All systems go. The admins table is empty. Promoting{' '}
                      <span className="font-medium text-white">{data.user?.email}</span>{' '}
                      to administrator will permanently enable console access and lock this wizard.
                    </p>
                  </div>
                  <button
                    onClick={() => setPhase('confirming')}
                    disabled={phase === 'bootstrapping'}
                    className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                  >
                    {phase === 'bootstrapping'
                      ? 'Creating administrator…'
                      : 'Make me an administrator →'}
                  </button>
                </div>
              )}

              {/* No session */}
              {!data.user && (
                <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 p-4">
                  <p className="text-sm text-amber-300 font-medium mb-1">Sign in first</p>
                  <p className="text-xs text-amber-400/70 mb-3">
                    You need an active session to bootstrap. Sign in with the account you want to make administrator.
                  </p>
                  <a
                    href="/login"
                    className="inline-block rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                  >
                    Go to login →
                  </a>
                </div>
              )}

              {/* Error state from bootstrap */}
              {phase === 'error' && errorMsg && (
                <div className="rounded-lg bg-red-500/8 border border-red-500/20 p-4">
                  <p className="text-xs font-semibold text-red-300 mb-1">Bootstrap failed</p>
                  <p className="text-xs text-red-400/80 break-all leading-relaxed">{errorMsg}</p>
                  <button
                    onClick={fetchDiagnostics}
                    className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Re-run diagnostics
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-slate-700 pb-4">
          This page is only accessible when no admins exist. It becomes permanently inert after the first administrator is created.
        </p>
      </div>
    </div>
  );
}

// ── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'ok' | 'warn' | 'error' | 'loading' }) {
  if (status === 'loading') {
    return <span className="inline-block h-2 w-2 rounded-full bg-slate-600 animate-pulse" />;
  }
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${
      status === 'ok'   ? 'bg-emerald-400' :
      status === 'warn' ? 'bg-amber-400'   :
                          'bg-red-400'
    }`} />
  );
}
