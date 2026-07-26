'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import Link from 'next/link';
import { getBrowserClient } from '@/lib/supabase/browser';
import { useToast, useSetRealtimeStatus } from '@/components/realtime/RealtimeContext';
import { SeverityBadge } from '@/components/ui/Badge';
import type {
  DashboardStats,
  TrendPoint,
  CategoryBreakdown,
  ConsoleIssue,
  ConsoleUser,
} from '@/types';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface LiveDashboardProps {
  initialStats:      DashboardStats;
  initialTrends:     TrendPoint[];
  initialCategories: CategoryBreakdown[];
  initialPending:    ConsoleIssue[];
  initialUsers:      ConsoleUser[];
  greeting:          string;
  greetingDate:      string;
}

// ── Raw DB row shapes (realtime payload) ─────────────────────────────────────

interface RawIssue {
  id:                string;
  title:             string;
  location:          string;
  severity:          string;
  category:          string;
  moderation_status: string;
  hidden:            boolean;
  created_at:        string;
  user_id:           string | null;
}

interface RawProfile {
  id:        string;
  name:      string | null;
  handle:    string | null;
  ward:      string | null;
  joined_at: string | null;
  is_admin:  boolean | null;
}

interface RawModeration {
  id:          string;
  issue_id:    string;
  status:      string;
  reviewed_by: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rawToIssue(r: RawIssue): ConsoleIssue {
  return {
    id:               r.id,
    title:            r.title,
    description:      '',
    category:         r.category as any,
    severity:         r.severity as any,
    status:           'open',
    location:         r.location ?? '',
    lat:              null,
    lng:              null,
    affectedCount:    0,
    supportCount:     0,
    hidden:           r.hidden,
    moderationStatus: r.moderation_status as any,
    createdAt:        r.created_at,
    updatedAt:        r.created_at,
    userId:           r.user_id,
    imageUrl:         null,
    afterImageUrl:    null,
    moderation:       null,
    user:             null,
  };
}

function rawToUser(r: RawProfile): ConsoleUser {
  return {
    id:           r.id,
    name:         r.name ?? 'Unknown',
    handle:       r.handle ?? '',
    ward:         r.ward ?? '',
    joinedAt:     r.joined_at ?? new Date().toISOString(),
    isAdmin:      r.is_admin ?? false,
    xp:           0,
    level:        'Newcomer',
    reportCount:  0,
    approvedCount:0,
    rejectedCount:0,
    supportGiven: 0,
    email:        null,
  };
}

// ── Animated count hook ───────────────────────────────────────────────────────

function useCountUp(target: number): number {
  const [val, setVal]  = useState(target);
  const prevRef        = useRef(target);
  const rafRef         = useRef<number | null>(null);

  useEffect(() => {
    if (target === prevRef.current) { setVal(target); return; }
    const from     = prevRef.current;
    const diff     = target - from;
    const duration = 500;
    const t0       = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3); // cubic ease-out
      setVal(Math.round(from + diff * e));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    prevRef.current = target;

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return val;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AnimatedNum({
  value, className, style,
}: {
  value: number; className: string; style?: React.CSSProperties;
}) {
  const v = useCountUp(value);
  return <span className={className} style={style}>{v.toLocaleString()}</span>;
}

function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const W = 56, H = 20;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: (1 - v / max) * H,
  }));
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i];
    const mx = ((p0.x + p1.x) / 2).toFixed(1);
    d += ` C${mx},${p0.y.toFixed(1)} ${mx},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
  }
  return (
    <svg width={W} height={H} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function StatCard({
  label, value, sub, colorClass, sparkColor, trend, urgent,
}: {
  label: string; value: number; sub?: string;
  colorClass: string; sparkColor: string;
  trend?: number[]; urgent?: boolean;
}) {
  return (
    <div
      className={[
        'relative rounded-xl p-4 ring-1 transition-all duration-200',
        urgent
          ? 'bg-amber-500/[0.05] ring-amber-500/25 hover:ring-amber-500/40'
          : 'ring-white/[0.06] hover:ring-white/[0.12]',
      ].join(' ')}
      style={urgent ? {} : { background: '#0F1D30' }}
    >
      {urgent && (
        <span className="absolute right-3 top-3 flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
        </span>
      )}
      <p className="text-[11px] font-medium text-white/38 mb-2.5">{label}</p>
      <AnimatedNum value={value} className={`text-[22px] font-bold tabular-nums leading-none ${colorClass}`} />
      {sub && <p className="text-[10px] text-white/22 mt-1">{sub}</p>}
      {trend && trend.length > 1 && (
        <div className="mt-3"><Spark values={trend} color={sparkColor} /></div>
      )}
    </div>
  );
}

function linePath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i];
    const mx = ((p0.x + p1.x) / 2).toFixed(1);
    d += ` C${mx},${p0.y.toFixed(1)} ${mx},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
  }
  return d;
}

function areaPath(pts: Array<{ x: number; y: number }>, floor: number): string {
  if (pts.length < 2) return '';
  const last = pts[pts.length - 1], first = pts[0];
  return `${linePath(pts)} L${last.x.toFixed(1)},${floor} L${first.x.toFixed(1)},${floor} Z`;
}

function toPoints(
  values: number[], max: number, W: number, H: number,
  padX = 12, padTop = 8, padBot = 4,
) {
  const n = values.length, chartH = H - padTop - padBot;
  return values.map((v, i) => ({
    x: padX + (i / (n - 1)) * (W - padX * 2),
    y: padTop + (1 - v / Math.max(max, 1)) * chartH,
  }));
}

function AreaChart({ trends }: { trends: TrendPoint[] }) {
  const W = 600, H = 120;
  const maxVal = Math.max(...trends.map(t => t.submitted), 1);
  const subPts = toPoints(trends.map(t => t.submitted), maxVal, W, H);
  const appPts = toPoints(trends.map(t => t.approved),  maxVal, W, H);
  const floor  = H - 4;
  const gridYs = [0.25, 0.5, 0.75].map(p => (8 + p * (H - 12)).toFixed(1));
  const labels = trends.filter((_, i) => i % 2 === 0);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="ch-sub" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#4B8FE0" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4B8FE0" stopOpacity="0"    />
          </linearGradient>
          <linearGradient id="ch-app" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#10B981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0"    />
          </linearGradient>
        </defs>
        {gridYs.map((y, i) => (
          <line key={i} x1="12" y1={y} x2={W - 12} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        <path d={areaPath(subPts, floor)} fill="url(#ch-sub)" />
        <path d={linePath(subPts)} fill="none" stroke="#4B8FE0" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={areaPath(appPts, floor)} fill="url(#ch-app)" />
        <path d={linePath(appPts)} fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="mt-1 flex justify-between px-3">
        {labels.map(p => (
          <span key={p.date} className="text-[9px] font-mono text-white/20">{p.date.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LiveDashboard({
  initialStats,
  initialTrends,
  initialCategories,
  initialPending,
  initialUsers,
  greeting,
  greetingDate,
}: LiveDashboardProps) {
  const [stats,   setStats]   = useState(initialStats);
  const [pending, setPending] = useState(initialPending);
  const [users,   setUsers]   = useState(initialUsers);
  const [newIds,  setNewIds]  = useState<Set<string>>(new Set());

  const { addToast }       = useToast();
  const setStatus          = useSetRealtimeStatus();

  const clearNewId = useCallback((id: string) => {
    setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(id); return n; }), 2_500);
  }, []);

  // ── Realtime subscription ─────────────────────────────────────────────────

  useEffect(() => {
    const supabase = getBrowserClient();

    const channel = supabase
      .channel('live-ops-dashboard')

      // ── New issue submitted ─────────────────────────────────────────────
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'issues' },
        (payload) => {
          const r = payload.new as RawIssue;

          setStats(prev => ({
            ...prev,
            totalIssues:  prev.totalIssues + 1,
            pendingReview: r.moderation_status === 'pending'
              ? prev.pendingReview + 1
              : prev.pendingReview,
          }));

          if (r.moderation_status === 'pending') {
            const item = rawToIssue(r);
            setPending(prev => [item, ...prev].slice(0, 8));
            setNewIds(prev => new Set([...prev, r.id]));
            clearNewId(r.id);
          }

          addToast({
            variant: r.severity === 'critical' ? 'critical' : 'info',
            icon:    r.severity === 'critical' ? '🚨' : r.severity === 'moderate' ? '⚠️' : '📍',
            title:   `New ${r.severity} report`,
            message: r.title,
          });
        },
      )

      // ── Issue status changed ────────────────────────────────────────────
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'issues' },
        (payload) => {
          const n = payload.new as RawIssue;
          const o = payload.old as Partial<RawIssue>;

          if (o.moderation_status === n.moderation_status) return;

          setStats(prev => {
            const s = { ...prev };
            if (o.moderation_status === 'pending')  s.pendingReview     = Math.max(0, s.pendingReview - 1);
            if (o.moderation_status === 'on_hold')  s.onHold            = Math.max(0, s.onHold - 1);
            if (n.moderation_status === 'approved') s.approvedToday     = s.approvedToday + 1;
            if (n.moderation_status === 'rejected') s.rejectedToday     = s.rejectedToday + 1;
            if (n.moderation_status === 'on_hold')  s.onHold            = s.onHold + 1;
            if (n.hidden)                           s.hiddenIssues      = s.hiddenIssues + 1;
            return s;
          });

          // Remove from pending queue if it was resolved/rejected/etc.
          if (o.moderation_status === 'pending' && n.moderation_status !== 'pending') {
            setPending(prev => prev.filter(p => p.id !== n.id));
          }
        },
      )

      // ── New citizen registered ──────────────────────────────────────────
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const r = payload.new as RawProfile;

          setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
          setUsers(prev => [rawToUser(r), ...prev].slice(0, 5));

          addToast({
            variant: 'success',
            icon:    '👤',
            title:   'New citizen joined',
            message: r.name ?? undefined,
          });
        },
      )

      // ── Moderation decision ─────────────────────────────────────────────
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'issue_moderation' },
        (payload) => {
          const m = payload.new as RawModeration;
          if (!m.reviewed_by) return; // AI-only, no human action

          const labels: Record<string, string> = {
            approved:           'Issue approved by admin',
            rejected:           'Issue rejected',
            on_hold:            'Issue placed on hold',
            needs_verification: 'Verification required',
          };
          addToast({
            variant: m.status === 'approved' ? 'success'
                   : m.status === 'rejected' ? 'warning'
                   : 'info',
            icon:    m.status === 'approved' ? '✓' : m.status === 'rejected' ? '✗' : '⏸',
            title:   labels[m.status] ?? 'Moderation updated',
          });
        },
      )

      .subscribe((status) => {
        if (status === 'SUBSCRIBED')    setStatus('live');
        if (status === 'TIMED_OUT')     setStatus('reconnecting');
        if (status === 'CHANNEL_ERROR') setStatus('reconnecting');
        if (status === 'CLOSED')        setStatus('offline');
      });

    return () => { supabase.removeChannel(channel); };
  }, [addToast, setStatus, clearNewId]);

  // ── Derived values ────────────────────────────────────────────────────────

  const approvalRate =
    stats.approvedToday + stats.rejectedToday > 0
      ? Math.round((stats.approvedToday / (stats.approvedToday + stats.rejectedToday)) * 100)
      : 0;

  const last7 = initialTrends.slice(-7);
  const catColors = ['#4B8FE0','#10B981','#F59E0B','#A78BFA','#EF4444','#22D3EE','#F472B6','#34D399'];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="p-6 space-y-5 max-w-[1600px]">

      {/* ── Context strip ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-semibold text-white/80">{greeting}</p>
          <p className="text-[11px] text-white/28 mt-0.5">{greetingDate}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {stats.pendingReview > 0 ? (
            <Link
              href="/moderation"
              className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/[0.07] px-3 py-1.5 text-[11px] font-medium text-amber-400 transition-colors hover:bg-amber-500/[0.12]"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
              </span>
              <AnimatedNum value={stats.pendingReview} className="" /> pending
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5 text-[11px] font-medium text-emerald-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Queue clear
            </span>
          )}
          {stats.onHold > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.06] px-3 py-1.5 text-[11px] font-medium text-red-400">
              <AnimatedNum value={stats.onHold} className="" /> on hold
            </span>
          )}
        </div>
      </div>

      {/* ── Primary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard
          label="Total Reports"
          value={stats.totalIssues}
          sub="All time"
          colorClass="text-white/85"
          sparkColor="#4B8FE0"
          trend={last7.map(p => p.submitted)}
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingReview}
          sub={stats.pendingReview > 0 ? 'Needs attention' : 'Queue clear'}
          colorClass={stats.pendingReview > 0 ? 'text-amber-400' : 'text-emerald-400'}
          sparkColor="#F59E0B"
          trend={last7.map(p => p.submitted)}
          urgent={stats.pendingReview > 0}
        />
        <StatCard
          label="Approved Today"
          value={stats.approvedToday}
          sub={`${approvalRate}% approval rate`}
          colorClass="text-emerald-400"
          sparkColor="#10B981"
          trend={last7.map(p => p.approved)}
        />
        <StatCard
          label="Total Citizens"
          value={stats.totalUsers}
          sub={`${stats.activeToday} active today`}
          colorClass="text-[#A78BFA]"
          sparkColor="#A78BFA"
        />
        <StatCard
          label="Suppressed"
          value={stats.hiddenIssues}
          sub="Rejected + on hold"
          colorClass="text-red-400"
          sparkColor="#EF4444"
          trend={last7.map(p => p.rejected)}
        />
      </div>

      {/* ── Secondary stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([
          { label: 'On Hold',             value: stats.onHold,            color: 'text-amber-400' },
          { label: 'Needs Verification',  value: stats.needsVerification, color: 'text-blue-400'  },
          { label: 'Rejected Today',      value: stats.rejectedToday,     color: 'text-red-400'   },
          { label: 'Active Today',        value: stats.activeToday,       color: 'text-emerald-400'},
        ] as const).map(s => (
          <div
            key={s.label}
            className="flex items-center justify-between rounded-xl px-4 py-3 ring-1 ring-white/[0.06]"
            style={{ background: '#0F1D30' }}
          >
            <p className="text-[11px] text-white/35">{s.label}</p>
            <AnimatedNum value={s.value} className={`text-[17px] font-bold tabular-nums ${s.color}`} />
          </div>
        ))}
      </div>

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl ring-1 ring-white/[0.06] p-5" style={{ background: '#0F1D30' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-semibold text-white/80">Report Activity</h3>
              <p className="text-[11px] text-white/28 mt-0.5">14-day trend</p>
            </div>
            <div className="flex items-center gap-4">
              {[['#4B8FE0','Submitted'],['#10B981','Approved']].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: c }} />
                  <span className="text-[10px] text-white/30">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <AreaChart trends={initialTrends} />
        </div>

        <div className="rounded-xl ring-1 ring-white/[0.06] p-5" style={{ background: '#0F1D30' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-semibold text-white/80">By Category</h3>
            <Link href="/analytics" className="text-[10px] text-blue-400/80 hover:text-blue-300 transition-colors">View all</Link>
          </div>
          <div className="space-y-3">
            {initialCategories.slice(0, 7).map((c, i) => (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-white/50 capitalize">{c.category.replace(/_/g, ' ')}</span>
                  <span className="text-[11px] text-white/35 tabular-nums font-mono">{c.count}</span>
                </div>
                <div className="h-[3px] rounded-full bg-white/[0.06]">
                  <div className="h-[3px] rounded-full transition-all" style={{ width: `${c.pct}%`, background: catColors[i % catColors.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pending queue + recent users ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Pending queue — live updated */}
        <div className="xl:col-span-2 rounded-xl ring-1 ring-white/[0.06] overflow-hidden" style={{ background: '#0F1D30' }}>
          <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <h3 className="text-[13px] font-semibold text-white/80">Pending Review</h3>
              {stats.pendingReview > 0 && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400 ring-1 ring-amber-500/25">
                  <AnimatedNum value={stats.pendingReview} className="" />
                </span>
              )}
            </div>
            <Link href="/moderation" className="text-[11px] font-medium text-blue-400/80 hover:text-blue-300 transition-colors">Open queue →</Link>
          </div>

          {pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14">
              <svg className="h-7 w-7 text-emerald-500/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-[12px] text-white/28">Queue is clear</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {pending.map(issue => {
                const isNew = newIds.has(issue.id);
                const severityBorder: Record<string, string> = {
                  critical: 'border-l-red-500',
                  moderate: 'border-l-amber-500',
                  low:      'border-l-slate-600',
                };
                return (
                  <Link
                    key={issue.id}
                    href={`/moderation/${issue.id}`}
                    className={[
                      'group flex items-center gap-3 border-l-2 pl-4 pr-5 py-3 transition-all hover:bg-white/[0.025]',
                      severityBorder[issue.severity] ?? 'border-l-slate-700',
                      isNew ? 'animate-row-in bg-white/[0.02]' : '',
                    ].join(' ')}
                  >
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white/[0.04] flex items-center justify-center">
                      {issue.imageUrl ? (
                        <img src={issue.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <svg className="h-4 w-4 text-white/20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-white/75 truncate transition-colors group-hover:text-white/90">
                        {issue.title}
                        {isNew && <span className="ml-2 text-[9px] font-bold text-emerald-400 uppercase tracking-wide">NEW</span>}
                      </p>
                      <p className="text-[11px] text-white/28 truncate mt-0.5">{issue.location}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SeverityBadge severity={issue.severity} />
                      <span className="text-[10px] text-white/22 font-mono">
                        {new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <svg className="h-3 w-3 text-white/15 transition-colors group-hover:text-white/35" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent citizens — live updated */}
        <div className="rounded-xl ring-1 ring-white/[0.06] overflow-hidden" style={{ background: '#0F1D30' }}>
          <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3.5">
            <h3 className="text-[13px] font-semibold text-white/80">Recent Citizens</h3>
            <Link href="/users" className="text-[11px] font-medium text-blue-400/80 hover:text-blue-300 transition-colors">All users →</Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {users.map((user, idx) => {
              const approvalPct = user.reportCount > 0
                ? Math.round((user.approvedCount / user.reportCount) * 100)
                : 0;
              const trustColor = approvalPct >= 70 ? '#10B981' : approvalPct >= 40 ? '#F59E0B' : '#EF4444';
              const hue = Math.abs(user.id.charCodeAt(0) * 137) % 360;
              const isNew = idx === 0 && newIds.has(user.id);
              return (
                <div
                  key={user.id}
                  className={['flex items-center gap-3 px-5 py-3 transition-all', isNew ? 'animate-row-in bg-white/[0.02]' : ''].join(' ')}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold select-none text-white"
                    style={{ background: `hsl(${hue}, 42%, 28%)` }}
                  >
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[12px] font-medium text-white/75 truncate">{user.name}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-[3px] rounded-full bg-white/[0.06]">
                        <div className="h-[3px] rounded-full" style={{ width: `${approvalPct}%`, background: trustColor }} />
                      </div>
                      <span className="text-[9px] font-mono text-white/22 tabular-nums w-6 text-right">{approvalPct}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-white/40 tabular-nums">{user.reportCount}</p>
                    {user.isAdmin && <span className="text-[9px] font-bold text-[#BE5A38]">ADMIN</span>}
                  </div>
                </div>
              );
            })}
            {users.length === 0 && (
              <div className="py-10 text-center"><p className="text-[12px] text-white/25">No citizens yet</p></div>
            )}
          </div>
        </div>
      </div>

      {/* ── 7-day summary ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {([
          { label: 'Submissions (7d)', values: last7.map(p => p.submitted), color: '#4B8FE0', sum: last7.reduce((a, b) => a + b.submitted, 0) },
          { label: 'Approvals (7d)',   values: last7.map(p => p.approved),  color: '#10B981', sum: last7.reduce((a, b) => a + b.approved,  0) },
          { label: 'Rejections (7d)',  values: last7.map(p => p.rejected),  color: '#EF4444', sum: last7.reduce((a, b) => a + b.rejected,  0) },
        ] as const).map(s => (
          <div
            key={s.label}
            className="flex items-center justify-between rounded-xl px-5 py-4 ring-1 ring-white/[0.06]"
            style={{ background: '#0F1D30' }}
          >
            <div>
              <p className="text-[11px] text-white/35">{s.label}</p>
              <AnimatedNum value={s.sum} className="text-[22px] font-bold tabular-nums mt-1" style={{ color: s.color }} />
            </div>
            <Spark values={[...s.values]} color={s.color} />
          </div>
        ))}
      </div>

    </main>
  );
}
