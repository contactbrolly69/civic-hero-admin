import { Suspense } from 'react';
import { getSession } from '@/lib/api/auth';
import { getDashboardStats, getTrends, getCategoryBreakdown, getIssues } from '@/lib/api/moderation';
import { Header } from '@/components/layout/Header';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { StatusBadge, SeverityBadge } from '@/components/ui/Badge';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const [session, stats, trends, categories, recentIssues] = await Promise.all([
    getSession(),
    getDashboardStats(),
    getTrends(),
    getCategoryBreakdown(),
    getIssues({ status: 'pending', perPage: 8 }),
  ]);

  if (!session) return null;

  const maxTrendVal = Math.max(...trends.map(t => t.submitted), 1);

  return (
    <div>
      <Header session={session} title="Dashboard" />

      <main className="p-6 space-y-6">

        {/* Stats */}
        <StatsGrid stats={stats} />

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Activity trend */}
          <div className="lg:col-span-2 rounded-xl border border-console-border bg-console-surface p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Report Activity — Last 14 Days</h3>
            <div className="flex items-end gap-1 h-28">
              {trends.map(point => (
                <div key={point.date} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col gap-0.5" style={{ height: 100 }}>
                    <div
                      className="w-full rounded-sm bg-emerald-500/60 transition-all"
                      style={{ height: `${(point.approved / maxTrendVal) * 100}%` }}
                      title={`Approved: ${point.approved}`}
                    />
                    <div
                      className="w-full rounded-sm bg-red-500/60 transition-all"
                      style={{ height: `${(point.rejected / maxTrendVal) * 100}%` }}
                      title={`Rejected: ${point.rejected}`}
                    />
                    <div
                      className="w-full rounded-sm bg-slate-500/40 transition-all"
                      style={{ height: `${(point.submitted / maxTrendVal) * 100}%` }}
                      title={`Submitted: ${point.submitted}`}
                    />
                  </div>
                  <span className="text-[9px] text-slate-600 rotate-45 origin-left whitespace-nowrap">
                    {point.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4">
              {[
                { color: 'bg-slate-500/40', label: 'Submitted' },
                { color: 'bg-emerald-500/60', label: 'Approved' },
                { color: 'bg-red-500/60', label: 'Rejected' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-sm ${l.color}`} />
                  <span className="text-xs text-slate-500">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="rounded-xl border border-console-border bg-console-surface p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">By Category</h3>
            <div className="space-y-2.5">
              {categories.slice(0, 8).map(c => (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400 capitalize">{c.category.replace('_', ' ')}</span>
                    <span className="text-xs text-slate-500 tabular-nums">{c.count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-800">
                    <div
                      className="h-1 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending queue */}
        <div className="rounded-xl border border-console-border bg-console-surface">
          <div className="flex items-center justify-between border-b border-console-border px-5 py-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-300">Pending Review</h3>
              {stats.pendingReview > 0 && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/25">
                  {stats.pendingReview} awaiting
                </span>
              )}
            </div>
            <Link href="/moderation" className="text-xs font-medium text-blue-400 hover:text-blue-300">
              View all →
            </Link>
          </div>

          {recentIssues.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <svg className="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-sm text-slate-500">Queue is clear</p>
            </div>
          ) : (
            <div className="divide-y divide-console-border">
              {recentIssues.data.map(issue => (
                <Link
                  key={issue.id}
                  href={`/moderation/${issue.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-white/[0.02]"
                >
                  {/* Thumb */}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                    {issue.imageUrl ? (
                      <Image src={issue.imageUrl} alt={issue.title} width={48} height={48} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">{issue.title}</p>
                    <p className="truncate text-xs text-slate-500">{issue.location}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <SeverityBadge severity={issue.severity} />
                    <StatusBadge   status={issue.moderationStatus} />
                    <span className="text-xs text-slate-600 whitespace-nowrap">
                      {new Date(issue.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
