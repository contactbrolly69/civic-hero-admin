import { getSession } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Audit Logs — Civic Hero Console' };

export default async function AuditPage() {
  const session = await getSession();
  if (!session) return null;

  const db = createServiceClient();

  // Rate limit log is our best audit proxy right now
  const rateResult = await db
    .from('rate_limit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  const rateLogs = rateResult.data;

  // Moderation actions as audit events
  const modResult = await db
    .from('issue_moderation')
    .select('id, issue_id, status, ai_model, reviewed_by, reviewed_at, override_reason, issues!issue_id(title)')
    .not('reviewed_by', 'is', null)
    .order('reviewed_at', { ascending: false })
    .limit(50);
  const modActions = modResult.data;

  return (
    <div>
      <Header session={session} title="Audit Logs" />
      <main className="p-6 space-y-6 max-w-[1400px]">

        {/* Admin moderation actions */}
        <div className="rounded-xl border border-slate-800/60 bg-[#111827]">
          <div className="border-b border-slate-800/60 px-5 py-3.5">
            <h3 className="text-sm font-semibold text-slate-200">Moderation Actions</h3>
            <p className="text-xs text-slate-600 mt-0.5">Human review decisions — most recent first</p>
          </div>
          <div className="divide-y divide-slate-800/40">
            {(modActions ?? []).map((a: any) => {
              const statusColors: Record<string, string> = {
                approved:           'text-emerald-400 bg-emerald-500/10',
                rejected:           'text-red-400 bg-red-500/10',
                on_hold:            'text-amber-400 bg-amber-500/10',
                needs_verification: 'text-blue-400 bg-blue-500/10',
              };
              const cls = statusColors[a.status] ?? 'text-slate-400 bg-slate-700/30';
              return (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3">
                  <div className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>
                    {a.status}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">
                      {(a.issues as any)?.title ?? a.issue_id?.slice(0, 8) ?? 'Unknown issue'}
                    </p>
                    {a.override_reason && (
                      <p className="text-xs text-slate-600 truncate">{a.override_reason}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-600 font-mono">{a.reviewed_by?.slice(0, 8) ?? '—'}</p>
                    <p className="text-[10px] text-slate-700">
                      {a.reviewed_at ? new Date(a.reviewed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </p>
                  </div>
                </div>
              );
            })}
            {(!modActions || modActions.length === 0) && (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-600">No human review actions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Rate limit log */}
        {rateLogs && rateLogs.length > 0 && (
          <div className="rounded-xl border border-slate-800/60 bg-[#111827]">
            <div className="border-b border-slate-800/60 px-5 py-3.5">
              <h3 className="text-sm font-semibold text-slate-200">Rate Limit Log</h3>
              <p className="text-xs text-slate-600 mt-0.5">Submission rate limit events</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-800/40">
                    {['User ID', 'Action', 'Count', 'Time'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-600 first:pl-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {rateLogs.map((r: any) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition">
                      <td className="pl-5 pr-4 py-2.5 text-xs font-mono text-slate-500">{r.user_id?.slice(0, 12)}…</td>
                      <td className="px-4 py-2.5 text-xs text-slate-400 capitalize">{r.action ?? r.event ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-300 tabular-nums">{r.count ?? 1}</td>
                      <td className="px-4 py-2.5 text-[10px] text-slate-600">
                        {r.created_at ? new Date(r.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
