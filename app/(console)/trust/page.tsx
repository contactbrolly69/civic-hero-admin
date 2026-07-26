import { getSession } from '@/lib/api/auth';
import { getUsers } from '@/lib/api/users';
import { Header } from '@/components/layout/Header';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Trust Engine — Civic Hero Console' };

function TrustBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-console-elevated">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white/30 tabular-nums w-6 text-right">{pct}</span>
    </div>
  );
}

export default async function TrustPage() {
  const session = await getSession();
  if (!session) return null;

  const users = await getUsers('', 1, 30);

  const topContributors = [...users.data]
    .sort((a, b) => b.approvedCount - a.approvedCount)
    .slice(0, 15);

  return (
    <div>
      <Header session={session} title="Trust Engine" />
      <main className="p-6 space-y-6 max-w-[1400px]">

        {/* Overview cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Total Users',             value: users.total,                                color: 'text-white/85' },
            { label: 'High Trust (70+)',         value: topContributors.filter(u => (u.approvedCount / Math.max(u.reportCount, 1)) >= 0.7).length, color: 'text-emerald-400' },
            { label: 'Avg Approval Rate',        value: `${Math.round(topContributors.reduce((s, u) => s + (u.approvedCount / Math.max(u.reportCount, 1)), 0) / Math.max(topContributors.length, 1) * 100)}%`, color: 'text-blue-400' },
            { label: 'Contributors w/ Reports',  value: users.data.filter(u => u.reportCount > 0).length, color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-console-border bg-console-surface p-4">
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Trust leaderboard */}
        <div className="rounded-xl border border-console-border bg-console-surface">
          <div className="border-b border-console-border px-5 py-3.5">
            <h3 className="text-sm font-semibold text-white/85">Contributor Trust Leaderboard</h3>
            <p className="text-xs text-white/30 mt-0.5">Ranked by approved reports. Approval rate = approved / total reports.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-console-border/60">
                  {['#', 'User', 'Ward', 'Reports', 'Approved', 'Rejected', 'Approval Rate', 'XP', 'Level'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-white/25 first:pl-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-console-border/40">
                {topContributors.map((user, i) => {
                  const approvalRate = user.reportCount > 0
                    ? Math.round((user.approvedCount / user.reportCount) * 100)
                    : 0;
                  return (
                    <tr key={user.id} className="hover:bg-white/[0.025] transition-colors">
                      <td className="pl-5 pr-4 py-3 text-xs text-white/25 tabular-nums">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold select-none"
                            style={{ background: `hsl(${Math.abs(user.id.charCodeAt(0) * 137) % 360}, 40%, 28%)`, color: '#e2e8f0' }}
                          >
                            {user.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white/80">{user.name}</p>
                            <p className="text-[10px] text-white/28">{user.handle || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/40">{user.ward || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-white/70 tabular-nums">{user.reportCount}</td>
                      <td className="px-4 py-3 text-sm text-emerald-400 tabular-nums">{user.approvedCount}</td>
                      <td className="px-4 py-3 text-sm text-red-400 tabular-nums">{user.rejectedCount}</td>
                      <td className="px-4 py-3 w-40">
                        <TrustBar score={approvalRate} />
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-400 tabular-nums font-medium">{user.xp}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${
                          user.level === 'Community Champion' ? 'text-emerald-400' :
                          user.level === 'Local Hero'         ? 'text-blue-400' :
                          user.level === 'Active Citizen'     ? 'text-amber-400' : 'text-white/28'
                        }`}>{user.level}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.04] p-5">
          <p className="text-sm font-semibold text-blue-300/80 mb-1">Trust Engine — How It Works</p>
          <p className="text-xs text-blue-400/55 leading-relaxed max-w-2xl">
            Trust scores are computed from: approval rate of past reports, spam probability, duplicate submission rate,
            community verifications received, and XP accumulated. High-trust reporters have their reports surfaced
            first in the moderation queue. Manual review can be triggered for any user.
          </p>
        </div>
      </main>
    </div>
  );
}
