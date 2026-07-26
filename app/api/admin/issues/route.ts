import { NextRequest, NextResponse } from 'next/server';
import { getSession }              from '@/lib/api/auth';
import { getIssues }               from '@/lib/api/moderation';
import type { ModerationStatus, IssueCategory, IssueSeverity } from '@/types';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;

  const status   = sp.get('status')   as ModerationStatus | null;
  const category = sp.get('category') as IssueCategory    | null;
  const severity = sp.get('severity') as IssueSeverity    | null;

  try {
    const result = await getIssues({
      status:   status   ?? undefined,
      category: category ?? undefined,
      severity: severity ?? undefined,
      search:   sp.get('search')   || undefined,
      dateFrom: sp.get('dateFrom') || undefined,
      dateTo:   sp.get('dateTo')   || undefined,
      page:     Math.max(1, parseInt(sp.get('page')    || '1')),
      perPage:  Math.min(50, parseInt(sp.get('perPage') || '25')),
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/admin/issues]', err);
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}
