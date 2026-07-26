'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  email: string;
}

const REDIRECT_SECS = 5;

export function SuccessScreen({ email }: Props) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(REDIRECT_SECS);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      router.push('/dashboard');
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  const progress = ((REDIRECT_SECS - countdown) / REDIRECT_SECS) * 100;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-console-bg transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="text-center max-w-sm px-4 space-y-6">
        {/* Animated check */}
        <div className="relative mx-auto h-20 w-20">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 rounded-full bg-emerald-500/15" />
          <div className="absolute inset-0 flex items-center justify-center text-4xl">✓</div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">Bootstrap complete</h1>
          <p className="text-sm text-slate-400">
            <span className="text-white font-medium">{email}</span> is now the Civic Hero administrator.
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/50 bg-console-surface px-5 py-4 text-left space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">What just happened</p>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li className="flex gap-2"><span className="text-emerald-400">✓</span>Admin row inserted into the admins table</li>
            <li className="flex gap-2"><span className="text-emerald-400">✓</span>Profile record verified</li>
            <li className="flex gap-2"><span className="text-emerald-400">✓</span>Bootstrap endpoint permanently locked</li>
          </ul>
        </div>

        {/* Progress bar + redirect */}
        <div className="space-y-2">
          <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all ease-linear duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Redirecting to dashboard in {countdown}s…
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Go now
          </button>
        </div>
      </div>
    </div>
  );
}
