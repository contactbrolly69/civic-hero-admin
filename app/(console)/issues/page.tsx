import { getSession } from '@/lib/api/auth';
import { getIssues } from '@/lib/api/moderation';
import { Header } from '@/components/layout/Header';
import { StatusBadge, SeverityBadge } from '@/components/ui/Badge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Issues — Civic Hero Console' };

const STATUS_OPTS = [
  { value: 'all',                 label: 'All' },
  { value: 'pending',             label: 'Pending' },
  { value: 'approved',            label: 'Approved' },
  { value: 'needs_verification',  label: 'Needs Verification' },
  { value: 'on_hold',             label: 'On Hold' },
  { value: 'rejected',            label: 'Rejected' },
];
const SEVERITY_OPTS = [
  { value: 'all',      label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'low',      label: 'Low' },
];
const CATEGORY_OPTS = [
  { value: 'all',              label: 'All Categories' },
  { value: 'pothole',          label: 'Pothole' },
  { value: 'garbage',          label: 'Garbage' },
  { value: 'streetlight',      label: 'Streetlight' },
  { value: 'water_leak',       label: 'Water Leak' },
  { value: 'drainage',         label: 'Drainage' },
  { value: 'footpath',         label: 'Footpath' },
  { value: 'traffic_signal',   label: 'Traffic Signal' },
  { value: 'illegal_dumping',  label: 'Illegal Dumping' },
];

interface SP { status?: string; severity?: string; category?: string; search?: string; page?: string; }

export default async function IssuesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const params   = await searchParams;
  const session  = await getSession();
  if (!session) return null;

  const status   = (params.status   as any) ?? 'all';
  const severity = (params.severity as any) ?? 'all';
  const category = (params.category as any) ?? 'all';
  const search   = params.search ?? '';
  const page     = parseInt(params.page ?? '1');
  const perPage  = 25;

  const result = await getIssues({
    status:   status === 'all' ? undefined : status,
    severity: severity === 'all' ? undefined : severity,
    category: category === 'all' ? undefined : category,
    search:   search || undefined,
    page,
    perPage,
  });

  const totalPages = Math.ceil(result.total / perPage);

  function buildUrl(overrides: Partial<SP>) {
    const p: Record<string, string> = {};
    if (status   !== 'all') p.status   = status;
    if (severity !== 'all') p.severity = severity;
    if (category !== 'all') p.category = category;
    if (search)             p.search   = search;
    Object.assign(p, overrides);
    const qs = new URLSearchParams(p).toString();
    return `/issues${qs ? `?${qs}` : ''}`;
  }

  return (
    <div>
      <Header session={session} title="Issues" />

      <main className="p-6 space-y-4 max-w-[1600px]">

        {/* Toolbar */}
        <form className="flex flex-wrap items-center gap-2">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search title or location…"
            className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select name="status" defaultValue={status}
            className="rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none">
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select name="severity" defaultValue={severity}
            className="rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none">
            {SEVERITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select name="category" defaultValue={category}
            className="rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none">
            {CATEGORY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
            Filter
          </button>
          {(status !== 'all' || severity !== 'all' || category !== 'all' || search) && (
            <Link href="/issues" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Clear
            </Link>
          )}
        </form>

        {/* Summary strip */}
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-500">
            <span className="text-slate-200 font-medium tabular-nums">{result.total.toLocaleString()}</span> issues
            {(status !== 'all' || search) && <span className="text-slate-600"> (filtered)</span>}
          </p>
          <div className="flex-1 h-px bg-slate-800" />
          <p className="text-xs text-slate-600">Page {page} of {totalPages || 1}</p>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-[#111827]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {['Issue', 'Category', 'Severity', 'Status', 'Supporters', 'Reporter', 'Submitted', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-600 first:pl-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {result.data.map(issue => (
                  <tr key={issue.id} className="hover:bg-white/[0.02] transition group">
                    <td className="pl-5 pr-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-800 flex items-center justify-center">
                          {issue.imageUrl
                            ? <img src={issue.imageUrl} alt="" className="h-full w-full object-cover" />
                            : <svg className="h-4 w-4 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate max-w-[240px] group-hover:text-white">{issue.title}</p>
                          <p className="text-xs text-slate-600 truncate max-w-[240px]">{issue.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400 capitalize">{issue.category.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={issue.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={issue.moderationStatus} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 tabular-nums">{issue.supportCount}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500 truncate max-w-[100px] block">{issue.user?.name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {new Date(issue.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/moderation/${issue.id}`}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition"
                      >
                        Review <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.data.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-slate-600">No issues match your filters</p>
              <Link href="/issues" className="mt-2 inline-block text-xs text-blue-400 hover:text-blue-300">
                Clear filters
              </Link>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, result.total)} of {result.total.toLocaleString()}</p>
            <div className="flex gap-1.5">
              {page > 1 && (
                <Link href={buildUrl({ page: String(page - 1) })}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition">
                  ← Prev
                </Link>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <Link key={p} href={buildUrl({ page: String(p) })}
                    className={`rounded-lg px-3 py-1.5 text-xs transition ${p === page ? 'bg-blue-600 text-white' : 'border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}>
                    {p}
                  </Link>
                );
              })}
              {result.hasMore && (
                <Link href={buildUrl({ page: String(page + 1) })}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-600 transition">
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
