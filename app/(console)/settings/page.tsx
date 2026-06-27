import { getSession } from '@/lib/api/auth';
import { Header } from '@/components/layout/Header';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const session  = await getSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <Header session={session} title="Settings" />

      <main className="p-6 space-y-6 max-w-2xl">

        {/* Account */}
        <div className="rounded-xl border border-console-border bg-console-surface p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Account</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-console-border">
              <span className="text-sm text-slate-400">Email</span>
              <span className="text-sm text-slate-200 font-mono">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-console-border">
              <span className="text-sm text-slate-400">User ID</span>
              <span className="text-xs text-slate-500 font-mono">{user?.id}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-console-border">
              <span className="text-sm text-slate-400">Role</span>
              <span className="rounded bg-blue-500/15 px-2 py-0.5 text-xs font-bold text-blue-400 ring-1 ring-blue-500/25">
                {session.role.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-400">Last sign-in</span>
              <span className="text-sm text-slate-300">
                {user?.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString('en-IN')
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Backend */}
        <div className="rounded-xl border border-console-border bg-console-surface p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-300">Backend Connection</h3>
          <div className="space-y-3">
            {[
              { label: 'Supabase Project', value: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].replace('https://', '') ?? '—' },
              { label: 'Console Version', value: process.env.NEXT_PUBLIC_CONSOLE_VERSION ?? '1.0.0' },
              { label: 'Environment', value: process.env.NODE_ENV ?? 'development' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-console-border last:border-0">
                <span className="text-sm text-slate-400">{item.label}</span>
                <span className="text-sm font-mono text-slate-300">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
          >
            Sign out
          </button>
        </form>

      </main>
    </div>
  );
}
