'use client';

import { useState, useEffect } from 'react';
import { useRealtimeStatus }   from '@/components/realtime/RealtimeContext';
import type { ConsoleSession } from '@/types';

// ── Connection badge ──────────────────────────────────────────────────────────

function ConnectionBadge() {
  const status = useRealtimeStatus();

  if (status === 'live') {
    return (
      <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-55" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[10px] font-mono tracking-wide text-emerald-400">LIVE</span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-spin-slow absolute inline-flex h-full w-full rounded-full border border-amber-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
        </span>
        <span className="text-[10px] font-mono tracking-wide text-amber-400">RECONNECTING</span>
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.06] px-2.5 py-1">
      <span className="relative inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
      <span className="text-[10px] font-mono tracking-wide text-red-400">OFFLINE</span>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

export function Header({ session, title }: { session: ConsoleSession; title: string }) {
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('en-IN', {
        hour:   '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    setClock(fmt());
    const id = setInterval(() => setClock(fmt()), 30_000);
    return () => clearInterval(id);
  }, []);

  const initials =
    session.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const hue = Math.abs(session.userId.charCodeAt(0) * 137) % 360;

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-white/[0.06] px-6 backdrop-blur-xl"
      style={{ background: 'rgba(12,21,38,0.92)' }}
    >
      {/* Page title */}
      <h1 className="flex-1 min-w-0 truncate text-[13px] font-semibold text-white/85">
        {title}
      </h1>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5 shrink-0">

        {/* Search hint */}
        <button
          type="button"
          className="hidden md:flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/28 transition-all hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-white/50"
          aria-label="Search"
        >
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span>Search</span>
          <kbd className="ml-1 font-mono text-[9px] text-white/18">⌘K</kbd>
        </button>

        {/* Live / reconnecting / offline badge */}
        <div className="ml-1">
          <ConnectionBadge />
        </div>

        {/* Notification bell */}
        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-white/28 transition-colors hover:bg-white/[0.05] hover:text-white/55"
          aria-label="Notifications"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </button>

        <div className="mx-1 h-4 w-px bg-white/[0.08]" />

        {/* Clock */}
        {clock && (
          <span className="hidden xl:block text-[11px] font-mono tabular-nums text-white/22 mr-1">
            {clock}
          </span>
        )}

        {/* Admin avatar + name */}
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white select-none"
            style={{ background: `hsl(${hue}, 38%, 28%)` }}
          >
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-medium leading-tight text-white/75">{session.name}</p>
            <p className="text-[10px] leading-tight text-white/25 capitalize">
              {session.role.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
