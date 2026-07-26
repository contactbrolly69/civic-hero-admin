import { getSession } from '@/lib/api/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/Header';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Authorities — Civic Hero Console' };

export default async function AuthoritiesPage() {
  const session = await getSession();
  if (!session) return null;

  const db = createServiceClient();

  // Try to load authority data; gracefully handle if table doesn't exist
  const authResult = await db
    .from('authority_directory')
    .select('*')
    .order('name')
    .limit(100);
  const authorities = authResult.data;

  return (
    <div>
      <Header session={session} title="Authority Management" />
      <main className="p-6 space-y-6 max-w-[1400px]">

        {authorities && authorities.length > 0 ? (
          <div className="rounded-xl border border-slate-800/60 bg-[#111827] overflow-hidden">
            <div className="border-b border-slate-800/60 px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Registered Authorities</h3>
              <span className="text-xs text-slate-600">{authorities.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-800/40">
                    {['Name', 'Department', 'Ward', 'Type', 'Contact'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-600 first:pl-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {authorities.map((a: any) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition">
                      <td className="pl-5 pr-4 py-3 text-sm font-medium text-slate-200">{a.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{a.department ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{a.ward ?? a.area ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 capitalize">{a.type ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{a.email ?? a.phone ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800/60 bg-[#111827] p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 mx-auto mb-4">
              <svg className="h-7 w-7 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">No authorities configured</p>
            <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
              Authority data comes from the authority_directory table. Add authorities via Supabase to see them here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
