import { redirect }          from 'next/navigation';
import { getSession }        from '@/lib/api/auth';
import { getDashboardStats } from '@/lib/api/moderation';
import { Sidebar }           from '@/components/layout/Sidebar';
import { RealtimeProvider }  from '@/components/realtime/RealtimeContext';

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/unauthorized');

  const stats = await getDashboardStats().catch(() => undefined);

  return (
    <div className="min-h-screen bg-console-bg">
      <Sidebar stats={stats} />
      <RealtimeProvider>
        <div className="pl-60">
          {children}
        </div>
      </RealtimeProvider>
    </div>
  );
}
