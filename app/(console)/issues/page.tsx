import { getSession }      from '@/lib/api/auth';
import { getIssues }       from '@/lib/api/moderation';
import { Header }          from '@/components/layout/Header';
import { OperationsQueue } from '@/components/issues/OperationsQueue';

export const dynamic  = 'force-dynamic';
export const metadata = { title: 'Issues — Civic Hero Console' };

export default async function IssuesPage() {
  const [session, initialData] = await Promise.all([
    getSession(),
    getIssues({ page: 1, perPage: 25 }),
  ]);

  if (!session) return null;

  return (
    <div>
      <Header session={session} title="Issues" />
      <OperationsQueue initialData={initialData} session={session} />
    </div>
  );
}
