import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getSession } from '@/lib/api/auth';
import { getIssueById } from '@/lib/api/moderation';
import { Header } from '@/components/layout/Header';
import { StatusBadge, SeverityBadge } from '@/components/ui/Badge';
import { AiSignalsPanel } from '@/components/moderation/AiSignalsPanel';
import { ActionButtons } from '@/components/moderation/ActionButtons';

export const dynamic = 'force-dynamic';

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, issue] = await Promise.all([getSession(), getIssueById(id)]);

  if (!session) return null;
  if (!issue)   return notFound();

  const flags  = issue.moderation?.flags ?? {};

  return (
    <div>
      <Header session={session} title="Review Report" />

      <main className="p-6">
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/moderation" className="hover:text-slate-300">Moderation</Link>
          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="font-mono text-slate-400">{id.slice(0, 8).toUpperCase()}</span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* Left: Issue detail */}
          <div className="lg:col-span-2 space-y-4">

            {/* Header card */}
            <div className="rounded-xl border border-console-border bg-console-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-white leading-snug">{issue.title}</h2>
                  <p className="mt-1 text-sm text-slate-400">{issue.location}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SeverityBadge severity={issue.severity} />
                  <StatusBadge   status={issue.moderationStatus} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Category</p>
                  <p className="mt-0.5 text-slate-300 capitalize">{issue.category.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Affected</p>
                  <p className="mt-0.5 text-slate-300">{issue.affectedCount.toLocaleString()} people</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Support</p>
                  <p className="mt-0.5 text-slate-300">{issue.supportCount} supporters</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Submitted</p>
                  <p className="mt-0.5 text-slate-300">
                    {new Date(issue.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Reporter</p>
                  <p className="mt-0.5 text-slate-300 font-mono text-xs">{issue.userId?.slice(0, 8) ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Hidden</p>
                  <p className={`mt-0.5 text-xs font-medium ${issue.hidden ? 'text-red-400' : 'text-emerald-400'}`}>
                    {issue.hidden ? 'Yes — hidden from feed' : 'No — visible'}
                  </p>
                </div>
              </div>
              {issue.description && (
                <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Description</p>
                  <p className="text-sm text-slate-300 leading-relaxed">"{issue.description}"</p>
                </div>
              )}
              {issue.moderation?.reason && (
                <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-amber-600 mb-1">AI Decision Reason</p>
                  <p className="text-sm text-amber-300/80">{issue.moderation.reason}</p>
                </div>
              )}
            </div>

            {/* Image viewer */}
            {issue.imageUrl && (
              <div className="rounded-xl border border-console-border bg-console-surface overflow-hidden">
                <div className="border-b border-console-border px-5 py-3">
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">Submitted Evidence</p>
                </div>
                <div className="p-4">
                  <div className="relative overflow-hidden rounded-lg bg-black">
                    <Image
                      src={issue.imageUrl}
                      alt={issue.title}
                      width={800}
                      height={500}
                      className="w-full object-contain max-h-[400px]"
                    />
                  </div>
                  <a
                    href={issue.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
                  >
                    Open full size
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              </div>
            )}

            {/* GPS */}
            {issue.lat != null && issue.lng != null && (
              <div className="rounded-xl border border-console-border bg-console-surface p-5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-3">GPS Location</p>
                <div className="flex items-center gap-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs">Latitude </span>
                      <span className="font-mono text-slate-300">{issue.lat.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Longitude </span>
                      <span className="font-mono text-slate-300">{issue.lng.toFixed(4)}</span>
                    </div>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${issue.lat},${issue.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:border-blue-500 hover:text-blue-400"
                  >
                    Open in Maps
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right: AI signals + Actions */}
          <div className="space-y-4">

            {/* Actions */}
            <div className="rounded-xl border border-console-border bg-console-surface p-5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-4">Moderator Actions</p>
              <ActionButtons issueId={issue.id} currentStatus={issue.moderationStatus} />
            </div>

            {/* AI Signals */}
            <div className="rounded-xl border border-console-border bg-console-surface p-5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-4">AI Analysis</p>
              <AiSignalsPanel flags={flags} aiModel={issue.moderation?.aiModel ?? null} />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
