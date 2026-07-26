'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DashboardStats } from '@/types';

// ── Icon renderer ─────────────────────────────────────────────────────────────

function Ico({ d }: { d: string }) {
  return (
    <svg
      className="w-[15px] h-[15px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

// ── Icon path constants ───────────────────────────────────────────────────────

const IC = {
  dashboard:
    'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  issues:
    'M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z',
  moderation:
    'M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z',
  users:
    'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
  analytics:
    'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
  trust:
    'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z',
  notify:
    'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
  authorities:
    'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z',
  audit:
    'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
  settings:
    'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  signout:
    'M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href:  string;
  icon:  keyof typeof IC;
  badge?: 'pending' | 'hold';
  dot?:   boolean;
}

// ── Nav groups ────────────────────────────────────────────────────────────────

const NAV_OPS: NavItem[] = [
  { label: 'Dashboard',  href: '/dashboard',  icon: 'dashboard' },
  { label: 'Issues',     href: '/issues',      icon: 'issues',     badge: 'pending' },
  { label: 'Moderation', href: '/moderation',  icon: 'moderation', badge: 'hold' },
  { label: 'Users',      href: '/users',       icon: 'users' },
  { label: 'Analytics',  href: '/analytics',   icon: 'analytics' },
];

const NAV_COMMUNITY: NavItem[] = [
  { label: 'Trust Engine',  href: '/trust',          icon: 'trust' },
  { label: 'Notifications', href: '/notifications',  icon: 'notify', dot: true },
  { label: 'Authorities',   href: '/authorities',    icon: 'authorities' },
];

const NAV_SYSTEM: NavItem[] = [
  { label: 'Audit Logs', href: '/audit',    icon: 'audit' },
  { label: 'Settings',   href: '/settings', icon: 'settings' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({ stats }: { stats?: DashboardStats }) {
  const pathname = usePathname();

  const getBadge = (badge?: 'pending' | 'hold') => {
    if (!stats) return undefined;
    if (badge === 'pending') return stats.pendingReview;
    if (badge === 'hold')    return stats.onHold;
    return undefined;
  };

  const dbRef =
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
      .replace('https://', '')
      .split('.')[0] || 'live';

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-white/[0.05]" style={{ background: '#070E1C' }}>

      {/* Brand header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.05] px-4">
        <svg width="30" height="30" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect width="48" height="48" rx="10" fill="#0D1826" />
          <clipPath id="patch-clip"><rect width="48" height="48" rx="10" /></clipPath>
          <path d="M 0 0 L 27 0 A 27 27 0 0 1 0 27 Z" fill="#BE5A38" clipPath="url(#patch-clip)" />
        </svg>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tracking-tight text-white">Civic Hero</p>
          <p className="text-[9px] font-mono uppercase tracking-[0.12em] text-white/25">Operations Console</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        <NavSection label="Operations" items={NAV_OPS}       pathname={pathname} getBadge={getBadge} />
        <NavSection label="Community"  items={NAV_COMMUNITY} pathname={pathname} getBadge={getBadge} />
        <NavSection label="System"     items={NAV_SYSTEM}    pathname={pathname} getBadge={getBadge} />
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/[0.05] px-2 py-2 space-y-px">
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[12px] font-medium text-white/25 transition-colors hover:bg-white/[0.04] hover:text-white/55"
          >
            <Ico d={IC.signout} />
            Sign out
          </button>
        </form>
        <div className="flex items-center gap-2 px-3 py-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[9px] font-mono tracking-wide text-white/18 truncate">{dbRef}</span>
        </div>
      </div>
    </aside>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavSection({
  label, items, pathname, getBadge,
}: {
  label:    string;
  items:    NavItem[];
  pathname: string;
  getBadge: (b?: 'pending' | 'hold') => number | undefined;
}) {
  return (
    <div>
      <p className="mb-1.5 px-3 text-[9px] font-mono uppercase tracking-[0.12em] text-white/[0.18]">
        {label}
      </p>
      <ul className="space-y-px">
        {items.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const count  = getBadge(item.badge);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={[
                  'group flex items-center gap-2.5 rounded-[6px] text-[13px] font-medium transition-all duration-150',
                  'pl-[10px] pr-3 py-[7px]',
                  active
                    ? 'border-l-2 border-[#BE5A38] bg-[#BE5A38]/[0.08] text-[#EAD5C8]'
                    : 'border-l-2 border-transparent text-white/32 hover:bg-white/[0.04] hover:text-white/75',
                ].join(' ')}
              >
                <span
                  className={
                    active
                      ? 'text-[#BE5A38]/80 shrink-0'
                      : 'shrink-0 text-white/22 transition-colors group-hover:text-white/50'
                  }
                >
                  <Ico d={IC[item.icon]} />
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {count !== undefined && count > 0 && (
                  <span className="rounded-full bg-[#BE5A38]/75 px-1.5 py-px text-[9px] font-bold text-white tabular-nums leading-none">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
                {item.dot && !count && (
                  <span className="h-1 w-1 shrink-0 rounded-full bg-blue-400/60" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
