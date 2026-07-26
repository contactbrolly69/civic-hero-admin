'use client';

import { useEffect, useState } from 'react';
import type { DiagnosticCheck } from '@/app/api/admin/bootstrap/route';

interface Props {
  check:       DiagnosticCheck;
  resolved:    boolean;
  delayMs:     number;
}

export function DiagnosticRow({ check, resolved, delayMs }: Props) {
  const [visible,  setVisible]  = useState(false);
  const [spinning, setSpinning] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t1);
  }, [delayMs]);

  useEffect(() => {
    if (resolved && visible) {
      const t = setTimeout(() => setSpinning(false), 400);
      return () => clearTimeout(t);
    }
  }, [resolved, visible]);

  if (!visible) return <div className="h-7" />;

  const icon = spinning ? (
    <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-slate-600 border-t-slate-300 animate-spin" />
  ) : check.status === 'ok' ? (
    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500/20 text-[9px] text-emerald-400">✓</span>
  ) : check.status === 'warn' ? (
    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500/20 text-[9px] text-amber-400">!</span>
  ) : (
    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500/20 text-[9px] text-red-400">✗</span>
  );

  const labelColor =
    !resolved || spinning ? 'text-slate-400'
    : check.status === 'ok'   ? 'text-slate-200'
    : check.status === 'warn' ? 'text-amber-300'
    : 'text-red-300';

  const noteColor =
    !resolved || spinning ? 'text-slate-600'
    : check.status === 'ok'   ? 'text-slate-500'
    : check.status === 'warn' ? 'text-amber-500'
    : 'text-red-500';

  return (
    <div
      className="transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="flex items-center gap-2.5 py-1">
        <span className="shrink-0">{icon}</span>
        <span className={`text-xs font-medium w-40 shrink-0 ${labelColor}`}>{check.label}</span>
        <span className={`text-xs font-mono truncate ${noteColor}`}>{check.note}</span>
      </div>
      {!spinning && check.status !== 'ok' && check.fix && (
        <div className="ml-6 mt-0.5 mb-1 pl-4 border-l border-slate-700">
          <p className="text-[11px] text-slate-500 leading-relaxed">{check.fix}</p>
        </div>
      )}
    </div>
  );
}
