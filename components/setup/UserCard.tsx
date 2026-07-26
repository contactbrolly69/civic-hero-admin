'use client';

import { useState } from 'react';
import type { UserInfo } from '@/app/api/admin/bootstrap/route';

interface Props {
  user: UserInfo;
}

const PROVIDER_LABELS: Record<string, string> = {
  email:    'Email / Password',
  google:   'Google',
  github:   'GitHub',
  twitter:  'Twitter',
  facebook: 'Facebook',
};

function initials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Unknown';
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function UserCard({ user }: Props) {
  const [copied, setCopied] = useState(false);

  function copyId() {
    navigator.clipboard.writeText(user.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const avatarBg = stringToColor(user.id);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-console-elevated p-4 flex items-start gap-4">
      {/* Avatar */}
      <div
        className="h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-white text-sm font-semibold select-none"
        style={{ background: avatarBg }}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          initials(user.name)
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-white truncate">{user.name}</p>
          <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300 uppercase tracking-wide">
            {PROVIDER_LABELS[user.provider] ?? user.provider}
          </span>
        </div>

        {user.email && (
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        )}

        <div className="flex items-center gap-1.5">
          <p className="text-[10px] text-slate-600 font-mono truncate">{user.id}</p>
          <button
            onClick={copyId}
            title="Copy user ID"
            className="shrink-0 text-[10px] text-slate-500 hover:text-slate-300 transition-colors px-1 py-0.5 rounded border border-slate-700 hover:border-slate-500"
          >
            {copied ? '✓ copied' : 'copy'}
          </button>
        </div>

        {user.lastSignIn && (
          <p className="text-[11px] text-slate-600">
            Last sign-in: {formatDate(user.lastSignIn)}
          </p>
        )}
      </div>
    </div>
  );
}

function stringToColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 45%, 35%)`;
}
