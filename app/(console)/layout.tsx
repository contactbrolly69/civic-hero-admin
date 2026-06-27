import { redirect } from 'next/navigation';
import { getSession } from '@/lib/api/auth';
import { getDashboardStats } from '@/lib/api/moderation';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const stats = await getDashboardStats().catch(() => undefined);

  return (
    <div className="min-h-screen bg-console-bg">
      <Sidebar stats={stats} />
      <div className="pl-64">
        {children}
      </div>
    </div>
  );
}
