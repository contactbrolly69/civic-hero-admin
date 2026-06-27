import { getSession } from '@/lib/api/auth';
import { getUsers } from '@/lib/api/users';
import { Header } from '@/components/layout/Header';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Users' };

interface SearchParams { search?: string; page?: string; }

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params  = await searchParams;
  const session = await getSession();
  if (!session) return null;

  const search = params.search ?? '';
  const page   = parseInt(params.page ?? '1');
  const result = await getUsers(search, page, 30);

  return (
    <div>
      <Header session={session} title="User Management" />

      <main className="p-6 space-y-4">

        {/* Summary */}
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-console-border bg-console-surface px-5 py-3.5">
            <p className="text-2xl font-bold text-white tabular-nums">{result.total}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total registered users</p>
          </div>
        </div>

        {/* Search */}
        <form className="flex gap-3">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name, handle or ward…"
            className="flex-1 rounded-lg border border-console-border bg-console-surface px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
            Search
          </button>
        </form>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-console-border bg-console-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-console-border">
                {['User', 'Ward', 'Level', 'Reports', 'Approved', 'Rejected', 'Joined', 'Role'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-console-border">
              {result.data.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 uppercase">
                        {user.name.slice(0, 1)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{user.ward || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${
                      user.level === 'Community Champion' ? 'text-emerald-400' :
                      user.level === 'Local Hero' ? 'text-blue-400' :
                      user.level === 'Active Citizen' ? 'text-amber-400' :
                      'text-slate-500'
                    }`}>
                      {user.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-300 tabular-nums">{user.reportCount}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400 tabular-nums">{user.approvedCount}</td>
                  <td className="px-4 py-3 text-sm text-red-400 tabular-nums">{user.rejectedCount}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {user.isAdmin ? (
                      <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-400 ring-1 ring-blue-500/25">
                        ADMIN
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">User</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.data.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-500">No users found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {result.total > 30 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Page {page} of {Math.ceil(result.total / 30)}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/users?page=${page - 1}&search=${search}`}
                  className="rounded-lg border border-console-border px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">
                  ← Previous
                </Link>
              )}
              {result.hasMore && (
                <Link href={`/users?page=${page + 1}&search=${search}`}
                  className="rounded-lg border border-console-border px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200">
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
