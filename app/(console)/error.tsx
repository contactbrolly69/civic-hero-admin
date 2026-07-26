'use client';

import { useEffect } from 'react';

export default function ConsoleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[console] page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-300">Page error</p>
              <p className="text-xs text-red-400/70 font-mono mt-0.5">{error.digest ?? 'no digest'}</p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-900/60 border border-red-500/10 p-3">
            <p className="text-xs text-red-300/80 font-mono break-all leading-relaxed">
              {error.message || 'An unexpected server error occurred'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(`${error.message}\n${error.stack ?? ''}`); }}
              className="rounded-lg border border-red-500/25 px-3 py-2 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
