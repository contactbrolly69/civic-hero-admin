import Link from 'next/link';
import Image from 'next/image';
import { getSession } from '@/lib/api/auth';
import { getIssues } from '@/lib/api/moderation';
import { Header } from '@/components/layout/Header';
import { StatusBadge, SeverityBadge } from '@/components/ui/Badge';
import type { ModerationStatus, IssueCategory, IssueSeverity } from '@/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Moderation' };

const STATUS_TABS: { key: ModerationStatus | 'all'; label: string }[] = [
  { key: 'all',              label: 'All'          },
  { key: 'pending',          label: 'Pending'      },
  { key: 'on_hold',          label: 'On Hold'      },
  { key: 'needs_verification', label: 'Review'     },
  { key: 'approved',         label: 'Approved'     },
  { key: 'rejected',         label: 'Rejected'     },
];

interface SearchParams { status?: string; page?: string; search?: string; severity?: string; }

export default async function ModerationPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params   = await searchParams;
  const session  = await getSession();
  if (!session) return null;

  const status   = (params.status   ?? 'pending') as ModerationStatus | 'all';
  const page     = parseInt(params.page ?? '1');
  const search   = params.search ?? '';
  const severity = params.severity as IssueSeverity | undefined;

  const result = await getIssues({ status, page, search, severity: severity ?? 'all', perPage: 25 });

  return (
    <div>
      <Header session={session} title="Moderation Queue" />

      <main className="p-6 space-y-4">

        {/* Status tabs */}
        <div className="flex gap-1 rounded-xl border border-console-border bg-console-surface p-1 w-fit">
          {STATUS_TABS.map(tab => (
            <Link
              key={tab.key}
              href={`/moderation?status=${tab.key}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                status === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Search + filters */}
        <form className="flex gap-3">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by title or location…"
            className="flex-1 rounded-lg border border-console-border bg-console-surface px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input type="hidden" name="status" value={status} />
          <select
            name="severity"
            defaultValue={severity ?? 'all'}
            className="rounded-lg border border-console-border bg-console-surface px-3 py-2 text-sm text-slate-400 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All severity</option>
            <option value="critical">Critical</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Filter
          </button>
        </form>

        {/* Count */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {result.total.toLocaleString()} {result.total === 1 ? 'report' : 'reports'}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-console-border bg-console-surface">
          {result.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <svg className="h-10 w-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-sm text-slate-400">Nothing to review in this queue</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-console-border">
                  {['Report', 'Category', 'Severity', 'Status', 'AI Flags', 'Submitted', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-console-border">
                {result.data.map(issue => {
                  const flags  = issue.moderation?.flags ?? {};
                  const gFlags = flags.gemini?.flags ?? [];
                  const hasExplicit = flags.image?.has_explicit;
                  const hasHate     = flags.text?.has_hate_speech;
                  const highSpam    = (flags.gemini?.spamProbability ?? 0) > 60;

                  return (
                    <tr key={issue.id} className="group transition hover:bg-white/[0.02]">
                      {/* Report */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                            {issue.imageUrl ? (
                              <Image src={issue.imageUrl} alt="" width={40} height={40} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-200 max-w-[240px]">{issue.title}</p>
                            <p className="truncate text-xs text-slate-500 max-w-[240px]">{issue.location}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-xs text-slate-400 capitalize whitespace-nowrap">
                        {issue.category.replace('_', ' ')}
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-3">
                        <SeverityBadge severity={issue.severity} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={issue.moderationStatus} />
                      </td>

                      {/* AI Flags */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {hasExplicit && <span className="text-[10px] text-red-400 font-medium">🔞 Explicit</span>}
                          {hasHate     && <span className="text-[10px] text-red-400 font-medium">⚠ Hate</span>}
                          {highSpam    && <span className="text-[10px] text-amber-400 font-medium">🚫 Spam</span>}
                          {gFlags.map(f => (
                            <span key={f} className="text-[10px] text-slate-500">{f.replace(/_/g, ' ')}</span>
                          ))}
                          {!hasExplicit && !hasHate && !highSpam && gFlags.length === 0 && (
                            <span className="text-[10px] text-slate-600">—</span>
                          )}
                        </div>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(issue.createdAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/moderation/${issue.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-400 transition hover:border-blue-500 hover:text-blue-400"
                        >
                          Review
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {result.total > 25 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {page} of {Math.ceil(result.total / 25)}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/moderation?status=${status}&page=${page - 1}&search=${search}`}
                  className="rounded-lg border border-console-border px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  ← Previous
                </Link>
              )}
              {result.hasMore && (
                <Link
                  href={`/moderation?status=${status}&page=${page + 1}&search=${search}`}
                  className="rounded-lg border border-console-border px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
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
