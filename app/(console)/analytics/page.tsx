import { getSession } from '@/lib/api/auth';
import { getDashboardStats, getTrends, getCategoryBreakdown } from '@/lib/api/moderation';
import { Header } from '@/components/layout/Header';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
  const [session, stats, trends, categories] = await Promise.all([
    getSession(),
    getDashboardStats(),
    getTrends(),
    getCategoryBreakdown(),
  ]);
  if (!session) return null;

  const totalModerated = stats.approvedToday + stats.rejectedToday;
  const approvalRate   = totalModerated > 0 ? Math.round(stats.approvedToday / totalModerated * 100) : 0;
  const maxTrend       = Math.max(...trends.map(t => t.submitted), 1);

  const modOutcomes = [
    { label: 'Approved',          count: stats.approvedToday,     color: 'bg-emerald-500' },
    { label: 'Rejected',          count: stats.rejectedToday,     color: 'bg-red-500'     },
    { label: 'On Hold',           count: stats.onHold,            color: 'bg-amber-500'   },
    { label: 'Needs Verification',count: stats.needsVerification, color: 'bg-blue-500'    },
  ];

  return (
    <div>
      <Header session={session} title="Analytics" />

      <main className="p-6 space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Reports',   value: stats.totalIssues.toLocaleString(),  color: 'text-slate-200' },
            { label: 'Total Users',     value: stats.totalUsers.toLocaleString(),   color: 'text-slate-200' },
            { label: 'Approval Rate',   value: `${approvalRate}%`,                 color: 'text-emerald-400' },
            { label: 'Hidden Reports',  value: stats.hiddenIssues.toLocaleString(), color: 'text-red-400' },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-console-border bg-console-surface p-5">
              <p className={`text-3xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
              <p className="mt-1 text-xs text-slate-500">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Trend chart */}
        <div className="rounded-xl border border-console-border bg-console-surface p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">14-Day Report Trend</h3>
            <div className="flex items-center gap-4">
              {[
                { color: 'bg-slate-500/40',   label: 'Submitted' },
                { color: 'bg-emerald-500',     label: 'Approved'  },
                { color: 'bg-red-500',         label: 'Rejected'  },
                { color: 'bg-amber-500',       label: 'On Hold'   },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`h-2 w-3 rounded-sm ${l.color}`} />
                  <span className="text-xs text-slate-500">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2 h-40">
            {trends.map(point => (
              <div key={point.date} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex flex-col gap-0.5 justify-end" style={{ height: 140 }}>
                  {[
                    { val: point.approved,  color: 'bg-emerald-500' },
                    { val: point.rejected,  color: 'bg-red-500'     },
                    { val: point.onHold,    color: 'bg-amber-500'   },
                  ].map((bar, i) => (
                    <div
                      key={i}
                      className={`w-full rounded-sm ${bar.color} transition-all`}
                      style={{ height: `${(bar.val / maxTrend) * 120}px`, minHeight: bar.val > 0 ? 3 : 0 }}
                      title={`${bar.val}`}
                    />
                  ))}
                  <div
                    className="w-full rounded-sm bg-slate-600/30 transition-all"
                    style={{ height: `${(point.submitted / maxTrend) * 120}px`, minHeight: point.submitted > 0 ? 3 : 0 }}
                    title={`Submitted: ${point.submitted}`}
                  />
                </div>
                <span className="text-[9px] text-slate-600 whitespace-nowrap">{point.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2-column bottom */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Category breakdown */}
          <div className="rounded-xl border border-console-border bg-console-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-300">Reports by Category</h3>
            <div className="space-y-3">
              {categories.map(c => (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-400 capitalize">{c.category.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-300 tabular-nums">{c.count}</span>
                      <span className="text-xs text-slate-600 tabular-nums w-10 text-right">{c.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Moderation outcomes */}
          <div className="rounded-xl border border-console-border bg-console-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-300">Moderation Outcomes</h3>
            <div className="space-y-3">
              {modOutcomes.map(o => {
                const total = modOutcomes.reduce((s, x) => s + x.count, 0) || 1;
                const pct   = Math.round(o.count / total * 100);
                return (
                  <div key={o.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-400">{o.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-300 tabular-nums">{o.count}</span>
                        <span className="text-xs text-slate-600 tabular-nums w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800">
                      <div className={`h-2 rounded-full ${o.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
