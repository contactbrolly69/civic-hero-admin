import { getSession } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Notifications — Civic Hero Console' };

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) return null;

  const db = createServiceClient();
  const { data: notifications, count } = await db
    .from('notifications')
    .select('id, user_id, type, title, body, read, created_at, profiles!user_id(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <Header session={session} title="Notification Center" />
      <main className="p-6 space-y-4 max-w-[1200px]">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Notifications', value: count ?? 0,  color: 'text-slate-200' },
            { label: 'Unread',              value: (notifications ?? []).filter((n: any) => !n.read).length, color: 'text-amber-400' },
            { label: 'Types',               value: new Set((notifications ?? []).map((n: any) => n.type)).size, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-slate-800/60 bg-[#111827] p-4">
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Notification list */}
        <div className="rounded-xl border border-slate-800/60 bg-[#111827] overflow-hidden">
          <div className="border-b border-slate-800/60 px-5 py-3.5">
            <h3 className="text-sm font-semibold text-slate-200">Recent Notifications</h3>
          </div>
          <div className="divide-y divide-slate-800/40">
            {(notifications ?? []).map((n: any) => (
              <div key={n.id} className={`flex items-start gap-4 px-5 py-3.5 ${!n.read ? 'bg-blue-500/3' : ''}`}>
                <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? 'bg-blue-400' : 'bg-slate-800'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-slate-600 uppercase">{n.type}</span>
                    <span className="text-[10px] text-slate-700">
                      → {(n.profiles as any)?.name ?? n.user_id?.slice(0, 8) ?? '?'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium">{n.title}</p>
                  {n.body && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.body}</p>}
                </div>
                <span className="shrink-0 text-[10px] text-slate-700 whitespace-nowrap">
                  {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {(!notifications || notifications.length === 0) && (
              <div className="py-16 text-center">
                <p className="text-sm text-slate-600">No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
