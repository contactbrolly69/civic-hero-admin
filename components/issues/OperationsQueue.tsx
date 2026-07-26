'use client';

import { useState, useEffect, useRef } from 'react';
import type { ConsoleIssue, ConsoleSession } from '@/types';
import { getBrowserClient }  from '@/lib/supabase/browser';
import { StatusBadge, SeverityBadge } from '@/components/ui/Badge';

// ── Constants ─────────────────────────────────────────────────────────────

const PER_PAGE = 25;

const STATUS_TABS = [
  { value: 'all',                label: 'All' },
  { value: 'pending',            label: 'Pending' },
  { value: 'approved',           label: 'Approved' },
  { value: 'rejected',           label: 'Rejected' },
  { value: 'on_hold',            label: 'On Hold' },
  { value: 'needs_verification', label: 'Needs Verify' },
];

const CATEGORIES = [
  { value: 'all',             label: 'All Categories' },
  { value: 'pothole',         label: 'Pothole' },
  { value: 'garbage',         label: 'Garbage' },
  { value: 'streetlight',     label: 'Streetlight' },
  { value: 'water_leak',      label: 'Water Leak' },
  { value: 'drainage',        label: 'Drainage' },
  { value: 'footpath',        label: 'Footpath' },
  { value: 'traffic_signal',  label: 'Traffic Signal' },
  { value: 'illegal_dumping', label: 'Illegal Dumping' },
  { value: 'construction',    label: 'Construction' },
  { value: 'animals',         label: 'Animals' },
  { value: 'trees',           label: 'Trees' },
  { value: 'other',           label: 'Other' },
];

const SEVERITIES = [
  { value: 'all',      label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'low',      label: 'Low' },
];

const BULK_ACTIONS = [
  { action: 'approve',           label: 'Approve',        cls: 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-400 hover:bg-emerald-500/[0.14]' },
  { action: 'reject',            label: 'Reject',         cls: 'border-red-500/25    bg-red-500/[0.08]    text-red-400    hover:bg-red-500/[0.14]' },
  { action: 'on_hold',           label: 'Hold',           cls: 'border-amber-500/25  bg-amber-500/[0.08]  text-amber-400  hover:bg-amber-500/[0.14]' },
  { action: 'needs_verification',label: 'Needs Verify',   cls: 'border-blue-500/25   bg-blue-500/[0.08]   text-blue-400   hover:bg-blue-500/[0.14]' },
  { action: 'hide',              label: 'Hide',           cls: 'border-console-border text-white/40 hover:text-white/65 hover:border-white/15' },
  { action: 'restore',           label: 'Restore',        cls: 'border-console-border text-white/40 hover:text-white/65 hover:border-white/15' },
  { action: 'spam',              label: 'Mark Spam',      cls: 'border-orange-500/25 bg-orange-500/[0.08] text-orange-400 hover:bg-orange-500/[0.14]' },
  { action: 'duplicate',         label: 'Duplicate',      cls: 'border-console-border text-white/40 hover:text-white/65 hover:border-white/15' },
  { action: 'archive',           label: 'Archive',        cls: 'border-console-border text-white/40 hover:text-white/65 hover:border-white/15' },
];

// ── Types ─────────────────────────────────────────────────────────────────

interface Filters {
  search:   string;
  status:   string;
  category: string;
  severity: string;
  dateFrom: string;
  dateTo:   string;
  page:     number;
}

interface FetchResult { data: ConsoleIssue[]; total: number; hasMore: boolean; }

interface Props {
  initialData: FetchResult;
  session:     ConsoleSession;
}

// ── Debounce hook ─────────────────────────────────────────────────────────

function useDebounce<T>(value: T, ms: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return dv;
}

// ── Image thumbnail cell ──────────────────────────────────────────────────

function ThumbCell({ issue, onOpen }: { issue: ConsoleIssue; onOpen: () => void }) {
  const imgs = [issue.imageUrl, issue.afterImageUrl].filter(Boolean) as string[];
  if (!imgs.length) {
    return (
      <div className="h-8 w-8 shrink-0 rounded-md bg-console-elevated flex items-center justify-center text-white/12">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onOpen(); }}
      className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md group/thumb"
    >
      <img src={imgs[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
      {imgs.length > 1 && (
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/65 px-0.5 text-[8px] font-bold text-white leading-tight">
          +{imgs.length - 1}
        </span>
      )}
    </button>
  );
}

// ── Bulk action toolbar ───────────────────────────────────────────────────

function BulkToolbar({
  count, total, selectAll, onAction, onClear, onSelectAll, pending,
}: {
  count:       number;
  total:       number;
  selectAll:   boolean;
  onAction:    (a: string) => void;
  onClear:     () => void;
  onSelectAll: () => void;
  pending:     boolean;
}) {
  return (
    <div className="sticky top-[104px] z-20 flex flex-wrap items-center gap-2 border-b border-console-border/80 bg-console-elevated/95 px-6 py-2.5 backdrop-blur-md">
      <button
        onClick={onClear}
        className="flex items-center gap-1.5 rounded-md border border-console-border px-2.5 py-1 text-xs text-white/50 transition-colors hover:border-white/15 hover:text-white/80"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
        {selectAll ? `All ${total.toLocaleString()} selected` : `${count} selected`}
      </button>

      <div className="h-4 w-px bg-console-border" />

      <div className="flex flex-wrap items-center gap-1">
        {BULK_ACTIONS.map(({ action, label, cls }) => (
          <button
            key={action}
            type="button"
            onClick={() => onAction(action)}
            disabled={pending}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${cls}`}
          >
            {label}
          </button>
        ))}
      </div>

      {!selectAll && count === PER_PAGE && (
        <button
          onClick={onSelectAll}
          className="ml-auto text-xs text-blue-400 underline-offset-2 transition-colors hover:text-blue-300 hover:underline"
        >
          Select all {total.toLocaleString()} matching reports
        </button>
      )}
    </div>
  );
}

// ── Preview drawer ────────────────────────────────────────────────────────

function PreviewDrawer({
  issue, onClose, onAction,
}: {
  issue:    ConsoleIssue;
  onClose:  () => void;
  onAction: (id: string, a: string) => Promise<void>;
}) {
  const imgs     = [issue.imageUrl, issue.afterImageUrl].filter(Boolean) as string[];
  const [idx, setIdx]   = useState(0);
  const [busy, setBusy] = useState(false);

  const act = async (action: string) => {
    setBusy(true);
    await onAction(issue.id, action);
    setBusy(false);
    onClose();
  };

  const aiConf = issue.moderation?.confidence ?? 0;

  return (
    <>
      {/* Backdrop (mobile) */}
      <div
        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[480px] flex-col border-l border-console-border bg-console-sidebar shadow-2xl animate-fade-in">

        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-console-border px-5 py-3.5">
          <button
            onClick={onClose}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/65"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white/85">{issue.title}</p>
            <p className="font-mono text-[10px] text-white/25">{issue.id.slice(0, 8)}…</p>
          </div>
          <StatusBadge status={issue.moderationStatus} />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Image viewer */}
          {imgs.length > 0 && (
            <div className="border-b border-console-border/40">
              <div className="relative aspect-video w-full overflow-hidden bg-console-elevated">
                <img key={imgs[idx]} src={imgs[idx]} alt="" className="h-full w-full object-cover" />
                {imgs.length > 1 && (
                  <>
                    {idx > 0 && (
                      <button
                        onClick={() => setIdx(i => i - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white/80 transition-colors hover:bg-black/75"
                      >
                        ‹
                      </button>
                    )}
                    {idx < imgs.length - 1 && (
                      <button
                        onClick={() => setIdx(i => i + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white/80 transition-colors hover:bg-black/75"
                      >
                        ›
                      </button>
                    )}
                    <div className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80 font-mono">
                      {idx + 1} / {imgs.length}
                    </div>
                  </>
                )}
              </div>
              {imgs.length > 1 && (
                <div className="flex gap-1.5 px-4 py-2">
                  {imgs.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      className={`h-9 w-9 overflow-hidden rounded border transition-colors ${i === idx ? 'border-blue-500' : 'border-console-border hover:border-white/20'}`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-5 p-5">

            {/* Meta */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={issue.severity} />
                <span className="text-xs capitalize text-white/40">{issue.category.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-xs leading-relaxed text-white/50">{issue.description || 'No description provided.'}</p>
              <p className="flex items-center gap-1.5 text-xs text-white/35">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {issue.location}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Supporters', value: issue.supportCount },
                { label: 'Affected',   value: issue.affectedCount },
                { label: 'AI Conf.',   value: `${Math.round(aiConf * 100)}%` },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-console-border/60 bg-console-elevated px-3 py-2 text-center">
                  <p className="text-sm font-bold tabular-nums text-white/80">{s.value}</p>
                  <p className="mt-0.5 text-[10px] text-white/28">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Reporter */}
            {issue.user && (
              <div className="rounded-lg border border-console-border/60 bg-console-elevated px-4 py-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/22">Reporter</p>
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: `hsl(${Math.abs((issue.userId?.charCodeAt(0) ?? 0) * 137) % 360}, 40%, 28%)` }}
                  >
                    {issue.user.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{issue.user.name}</p>
                    <p className="text-[10px] text-white/28">@{issue.user.handle || '—'} · {issue.user.ward || 'Unknown ward'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {issue.moderation && (
              <div className="space-y-2 rounded-lg border border-console-border/60 bg-console-elevated px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/22">AI Analysis</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/38">Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-20 overflow-hidden rounded-full bg-console-bg">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${aiConf * 100}%` }} />
                    </div>
                    <span className="w-8 text-right tabular-nums text-white/55">{Math.round(aiConf * 100)}%</span>
                  </div>
                </div>
                {issue.moderation.reason && (
                  <p className="text-[11px] leading-relaxed text-white/38">{issue.moderation.reason}</p>
                )}
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/22">Timeline</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-white/38">Submitted</span>
                  <span className="tabular-nums text-white/55">
                    {new Date(issue.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {issue.moderation?.reviewedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/38">Reviewed</span>
                    <span className="tabular-nums text-white/55">
                      {new Date(issue.moderation.reviewedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Quick actions */}
        <div className="shrink-0 border-t border-console-border px-5 py-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => act('approve')}
              disabled={busy || issue.moderationStatus === 'approved'}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/[0.15] disabled:opacity-30"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Approve
            </button>
            <button
              onClick={() => act('reject')}
              disabled={busy || issue.moderationStatus === 'rejected'}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.08] py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/[0.15] disabled:opacity-30"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
            <button
              onClick={() => act('on_hold')}
              disabled={busy || issue.moderationStatus === 'on_hold'}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-console-border py-2 text-sm font-medium text-amber-400/80 transition-colors hover:border-amber-500/20 hover:bg-amber-500/[0.06] disabled:opacity-30"
            >
              Hold
            </button>
            <button
              onClick={() => act('needs_verification')}
              disabled={busy || issue.moderationStatus === 'needs_verification'}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-console-border py-2 text-sm font-medium text-white/38 transition-colors hover:border-white/15 hover:text-white/60 disabled:opacity-30"
            >
              Needs Verify
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main: OperationsQueue ─────────────────────────────────────────────────

export function OperationsQueue({ initialData, session: _session }: Props) {
  const [filters, setFiltersState] = useState<Filters>({
    search: '', status: 'all', category: 'all', severity: 'all',
    dateFrom: '', dateTo: '', page: 1,
  });
  const [issues,    setIssues]  = useState<ConsoleIssue[]>(initialData.data);
  const [total,     setTotal]   = useState(initialData.total);
  const [loading,   setLoading] = useState(false);
  const [selected,  setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [preview,   setPreview]  = useState<ConsoleIssue | null>(null);
  const [bulkBusy,  setBulkBusy] = useState(false);
  const [focusRow,  setFocusRow] = useState(-1);

  const searchRef      = useRef<HTMLInputElement>(null);
  const masterCbRef    = useRef<HTMLInputElement>(null);
  const filtersRef     = useRef(filters);
  const isFirstRender  = useRef(true);

  // Keep ref in sync
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  // Indeterminate on master checkbox
  const isPageSel   = issues.length > 0 && issues.every(i => selected.has(i.id));
  const isIndeterm  = selected.size > 0 && !isPageSel;
  useEffect(() => {
    if (masterCbRef.current) masterCbRef.current.indeterminate = isIndeterm;
  }, [isIndeterm]);

  const debouncedSearch = useDebounce(filters.search, 300);

  // ── Fetch ───────────────────────────────────────────────────────────────

  const fetchWith = (f: Filters, overrideSearch?: string) => {
    const p = new URLSearchParams();
    const q = overrideSearch !== undefined ? overrideSearch : f.search;
    if (q.trim())           p.set('search',   q.trim());
    if (f.status   !== 'all') p.set('status',   f.status);
    if (f.category !== 'all') p.set('category', f.category);
    if (f.severity !== 'all') p.set('severity', f.severity);
    if (f.dateFrom)           p.set('dateFrom', f.dateFrom);
    if (f.dateTo)             p.set('dateTo',   f.dateTo);
    p.set('page',    String(f.page));
    p.set('perPage', String(PER_PAGE));

    let cancelled = false;
    setLoading(true);

    fetch(`/api/admin/issues?${p.toString()}`)
      .then(r => r.json())
      .then((data: FetchResult) => {
        if (cancelled) return;
        setIssues(data.data);
        setTotal(data.total);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  };

  // Trigger fetch when debounced search or non-search filters change
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    return fetchWith(filtersRef.current, debouncedSearch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.status, filters.category, filters.severity, filters.dateFrom, filters.dateTo, filters.page]);

  // ── Realtime (non-destructive) ──────────────────────────────────────────

  useEffect(() => {
    const db = getBrowserClient();
    const ch = db.channel('ops-queue')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'issues' }, () => {
        const f = filtersRef.current;
        if (f.page === 1 && !f.search) fetchWith(f, '');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'issues' }, ({ new: n }) => {
        setIssues(prev =>
          prev.map(i =>
            i.id === n.id
              ? { ...i, moderationStatus: n.moderation_status, hidden: n.hidden }
              : i
          )
        );
        // Also update preview if open
        setPreview(p => {
          if (!p || p.id !== n.id) return p;
          return { ...p, moderationStatus: n.moderation_status as ConsoleIssue['moderationStatus'], hidden: Boolean(n.hidden) };
        });
      })
      .subscribe();

    return () => { db.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === 'Escape') {
        if (preview)          setPreview(null);
        else if (selected.size > 0) { setSelected(new Set()); setSelectAll(false); }
        return;
      }
      if (!typing) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault();
          setSelected(new Set(issues.map(i => i.id)));
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusRow(r => Math.min(r + 1, issues.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusRow(r => Math.max(r - 1, 0));
          return;
        }
        if (e.key === ' ' && focusRow >= 0) {
          e.preventDefault();
          const id = issues[focusRow]?.id;
          if (id) toggleRow(id);
          return;
        }
        if (e.key === 'Enter' && focusRow >= 0) {
          const issue = issues[focusRow];
          if (issue) setPreview(issue);
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [issues, selected, focusRow, preview]);

  // ── Selection helpers ───────────────────────────────────────────────────

  const toggleRow = (id: string) => {
    setSelectAll(false);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    setSelectAll(false);
    if (isPageSel) {
      setSelected(prev => { const n = new Set(prev); issues.forEach(i => n.delete(i.id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); issues.forEach(i => n.add(i.id)); return n; });
    }
  };

  const clearSelection = () => { setSelected(new Set()); setSelectAll(false); };

  // ── Bulk action ─────────────────────────────────────────────────────────

  const executeBulk = async (action: string) => {
    setBulkBusy(true);
    try {
      const ids = [...selected];
      await fetch('/api/admin/issues/bulk', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action, ids }),
      });
      clearSelection();
      fetchWith(filtersRef.current, debouncedSearch);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleSingleAction = async (issueId: string, action: string) => {
    await fetch('/api/admin/issues/bulk', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, ids: [issueId] }),
    });
    fetchWith(filtersRef.current, debouncedSearch);
  };

  // ── Filter helpers ──────────────────────────────────────────────────────

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? (value as number) : 1,
    }));
  };

  const clearFilters = () => {
    setFiltersState({ search: '', status: 'all', category: 'all', severity: 'all', dateFrom: '', dateTo: '', page: 1 });
  };

  const hasActive = filters.status !== 'all' || filters.category !== 'all' || filters.severity !== 'all' || !!filters.search;
  const totalPages = Math.ceil(total / PER_PAGE);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className={`relative transition-all duration-200 ${preview ? 'lg:pr-[480px]' : ''}`}>

      {/* ── Sticky toolbar ── */}
      <div className="sticky top-14 z-10 border-b border-console-border bg-console-bg/96 backdrop-blur-md">

        {/* Row 1: search + dropdowns + count */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-2.5">
          <div className="relative flex-1" style={{ minWidth: 200, maxWidth: 360 }}>
            <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/22" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              ref={searchRef}
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Search issues, reporter, location… (⌘K)"
              className="w-full rounded-lg border border-console-border bg-console-elevated py-1.5 pl-9 pr-8 text-sm text-white/80 placeholder-white/18 transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/25"
            />
            {filters.search && (
              <button
                onClick={() => setFilter('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/22 transition-colors hover:text-white/55"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <select
            value={filters.category}
            onChange={e => setFilter('category', e.target.value)}
            className="rounded-lg border border-console-border bg-console-elevated px-3 py-1.5 text-sm text-white/60 focus:border-blue-500/50 focus:outline-none"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <select
            value={filters.severity}
            onChange={e => setFilter('severity', e.target.value)}
            className="rounded-lg border border-console-border bg-console-elevated px-3 py-1.5 text-sm text-white/60 focus:border-blue-500/50 focus:outline-none"
          >
            {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {hasActive && (
            <button
              onClick={clearFilters}
              className="rounded-lg border border-console-border px-3 py-1.5 text-xs text-white/38 transition-colors hover:border-white/15 hover:text-white/65"
            >
              Clear
            </button>
          )}

          <div className="flex-1" />

          <p className={`text-xs tabular-nums transition-opacity ${loading ? 'text-white/25' : 'text-white/28'}`}>
            {loading ? 'Loading…' : `${total.toLocaleString()} reports`}
          </p>
        </div>

        {/* Row 2: status tabs */}
        <div className="flex items-center gap-0 px-5">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setFilter('status', t.value)}
              className={`border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                filters.status === t.value
                  ? 'border-blue-500 text-white/90'
                  : 'border-transparent text-white/32 hover:text-white/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk toolbar (floats below sticky header) ── */}
      {selected.size > 0 && (
        <BulkToolbar
          count={selected.size}
          total={total}
          selectAll={selectAll}
          onAction={executeBulk}
          onClear={clearSelection}
          onSelectAll={() => setSelectAll(true)}
          pending={bulkBusy}
        />
      )}

      {/* ── Table ── */}
      <div className={`overflow-x-auto transition-opacity ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-console-border">
            <tr>
              {/* Master checkbox */}
              <th className="w-10 pl-5 pr-2 py-3">
                <input
                  ref={masterCbRef}
                  type="checkbox"
                  checked={isPageSel}
                  onChange={togglePage}
                  className="h-3.5 w-3.5 cursor-pointer rounded accent-blue-500"
                />
              </th>
              {['Issue', 'Category', 'Severity', 'Status', '↑', 'Reporter', 'Ward', 'Date', ''].map(h => (
                <th
                  key={h}
                  className="px-3 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-white/18"
                >
                  {h === '↑' ? 'Supporters' : h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-console-border/25">
            {issues.map((issue, idx) => {
              const isSel    = selected.has(issue.id);
              const isFocus  = focusRow === idx;
              const isActive = preview?.id === issue.id;

              return (
                <tr
                  key={issue.id}
                  tabIndex={0}
                  onFocus={() => setFocusRow(idx)}
                  onClick={() => setPreview(issue)}
                  className={`group cursor-pointer outline-none transition-colors ${
                    isActive ? 'bg-blue-500/[0.10]' :
                    isSel    ? 'bg-blue-500/[0.06]'  :
                    isFocus  ? 'bg-white/[0.025]'    :
                               'hover:bg-white/[0.022]'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="w-10 pl-5 pr-2 py-2.5" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggleRow(issue.id)}
                      className="h-3.5 w-3.5 cursor-pointer rounded accent-blue-500"
                    />
                  </td>

                  {/* Issue title + thumbnail */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div onClick={e => e.stopPropagation()}>
                        <ThumbCell issue={issue} onOpen={() => setPreview(issue)} />
                      </div>
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate text-sm font-medium text-white/78 transition-colors group-hover:text-white/95">
                          {issue.title}
                        </p>
                        <p className="max-w-[220px] truncate text-[10px] text-white/28">{issue.location}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs capitalize text-white/38">{issue.category.replace(/_/g, ' ')}</span>
                  </td>

                  {/* Severity */}
                  <td className="px-3 py-2.5">
                    <SeverityBadge severity={issue.severity} />
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5">
                    <StatusBadge status={issue.moderationStatus} />
                  </td>

                  {/* Supporters */}
                  <td className="px-3 py-2.5 text-sm tabular-nums text-white/45">{issue.supportCount}</td>

                  {/* Reporter */}
                  <td className="px-3 py-2.5">
                    <span className="block max-w-[100px] truncate text-xs text-white/38">{issue.user?.name ?? '—'}</span>
                  </td>

                  {/* Ward */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs text-white/28">{issue.user?.ward || '—'}</span>
                  </td>

                  {/* Date */}
                  <td className="px-3 py-2.5 text-[11px] tabular-nums text-white/22 whitespace-nowrap">
                    {new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>

                  {/* Arrow */}
                  <td className="px-3 py-2.5">
                    <svg className="h-3.5 w-3.5 text-white/12 transition-colors group-hover:text-white/30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state */}
        {issues.length === 0 && !loading && (
          <div className="flex flex-col items-center py-20">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-console-border bg-console-elevated">
              <svg className="h-5 w-5 text-white/18" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
              </svg>
            </div>
            <p className="text-sm text-white/25">No reports match your filters</p>
            {hasActive && (
              <button onClick={clearFilters} className="mt-2 text-xs text-blue-400 transition-colors hover:text-blue-300">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-console-border px-6 py-4">
          <p className="text-xs tabular-nums text-white/22">
            {((filters.page - 1) * PER_PAGE + 1).toLocaleString()}–{Math.min(filters.page * PER_PAGE, total).toLocaleString()} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('page', filters.page - 1)}
              disabled={filters.page <= 1}
              className="rounded-md border border-console-border px-2.5 py-1.5 text-xs text-white/38 transition-colors hover:border-white/15 hover:text-white/65 disabled:opacity-25"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(filters.page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => setFilter('page', p)}
                  className={`rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    p === filters.page
                      ? 'border border-blue-500/40 bg-blue-600/70 text-white'
                      : 'border border-console-border text-white/38 hover:border-white/15 hover:text-white/65'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setFilter('page', filters.page + 1)}
              disabled={filters.page >= totalPages}
              className="rounded-md border border-console-border px-2.5 py-1.5 text-xs text-white/38 transition-colors hover:border-white/15 hover:text-white/65 disabled:opacity-25"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Preview drawer ── */}
      {preview && (
        <PreviewDrawer
          issue={preview}
          onClose={() => setPreview(null)}
          onAction={handleSingleAction}
        />
      )}
    </div>
  );
}
