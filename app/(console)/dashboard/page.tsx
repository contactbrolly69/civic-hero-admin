import { getSession }                                                  from '@/lib/api/auth';
import { getDashboardStats, getTrends, getCategoryBreakdown, getIssues } from '@/lib/api/moderation';
import { getUsers }                                                      from '@/lib/api/users';
import { Header }                                                        from '@/components/layout/Header';
import { LiveDashboard }                                                 from '@/components/dashboard/LiveDashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard — Civic Hero Console' };

export default async function DashboardPage() {
  const [session, stats, trends, categories, pendingQueue, recentUsers] = await Promise.all([
    getSession(),
    getDashboardStats(),
    getTrends(),
    getCategoryBreakdown(),
    getIssues({ status: 'pending', perPage: 8 }),
    getUsers('', 1, 5),
  ]);

  if (!session) return null;

  const hour = new Date().getHours();
  const greeting =
    `${hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'}, ${session.name.split(' ')[0]}`;
  const greetingDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div>
      <Header session={session} title="Dashboard" />
      <LiveDashboard
        initialStats={stats}
        initialTrends={trends}
        initialCategories={categories}
        initialPending={pendingQueue.data}
        initialUsers={recentUsers.data}
        greeting={greeting}
        greetingDate={greetingDate}
      />
    </div>
  );
}
