import { createServiceClient } from '@/lib/supabase/server';
import type { ConsoleUser, PaginatedResult } from '@/types';

export async function getUsers(
  search = '',
  page   = 1,
  perPage = 30,
): Promise<PaginatedResult<ConsoleUser>> {
  const db   = await createServiceClient();
  const from = (page - 1) * perPage;

  let query = db.from('profiles')
    .select('id, name, handle, ward, joined_at, xp, level', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,handle.ilike.%${search}%,ward.ilike.%${search}%`);
  }

  const { data: profiles, count } = await query
    .order('joined_at', { ascending: false })
    .range(from, from + perPage - 1);

  if (!profiles) return { data: [], total: 0, page, perPage, hasMore: false };

  // Get admin IDs
  const { data: adminRows } = await db.from('admins').select('user_id');
  const adminIds = new Set((adminRows ?? []).map((a: any) => a.user_id as string));

  // Get report counts in parallel
  const reportCountResults = await Promise.all(
    profiles.map((p: any) =>
      db.from('issues').select('id, moderation_status', { count: 'exact' })
        .eq('user_id', p.id)
        .then(({ data: issues, count: reportCount }) => ({
          id:           p.id,
          reportCount:  reportCount ?? 0,
          approvedCount: (issues ?? []).filter((i: any) => i.moderation_status === 'approved').length,
          rejectedCount: (issues ?? []).filter((i: any) => i.moderation_status === 'rejected').length,
        })),
    ),
  );

  const statsMap = Object.fromEntries(reportCountResults.map(r => [r.id, r]));

  const users: ConsoleUser[] = profiles.map((p: any) => ({
    id:            p.id,
    name:          p.name     ?? 'Unknown',
    handle:        p.handle   ?? '',
    ward:          p.ward     ?? '',
    joinedAt:      p.joined_at ?? '',
    isAdmin:       adminIds.has(p.id),
    xp:            p.xp       ?? 0,
    level:         p.level    ?? 'Civic Rookie',
    reportCount:   statsMap[p.id]?.reportCount   ?? 0,
    approvedCount: statsMap[p.id]?.approvedCount ?? 0,
    rejectedCount: statsMap[p.id]?.rejectedCount ?? 0,
    supportGiven:  0,
    email:         null,
  }));

  return {
    data:    users,
    total:   count ?? 0,
    page,
    perPage,
    hasMore: (count ?? 0) > from + perPage,
  };
}

export async function getUserById(id: string): Promise<ConsoleUser | null> {
  const db = await createServiceClient();

  const [profileRes, issuesRes, supportRes, adminRes] = await Promise.all([
    db.from('profiles').select('*').eq('id', id).single(),
    db.from('issues').select('id, moderation_status').eq('user_id', id),
    db.from('issue_support').select('id', { count: 'exact', head: true }).eq('user_id', id),
    db.from('admins').select('user_id').eq('user_id', id).maybeSingle(),
  ]);

  if (!profileRes.data) return null;
  const p      = profileRes.data as any;
  const issues = issuesRes.data ?? [];

  return {
    id:            p.id,
    name:          p.name     ?? 'Unknown',
    handle:        p.handle   ?? '',
    ward:          p.ward     ?? '',
    joinedAt:      p.joined_at ?? '',
    isAdmin:       adminRes.data !== null,
    xp:            p.xp       ?? 0,
    level:         p.level    ?? 'Civic Rookie',
    reportCount:   issues.length,
    approvedCount: issues.filter((i: any) => i.moderation_status === 'approved').length,
    rejectedCount: issues.filter((i: any) => i.moderation_status === 'rejected').length,
    supportGiven:  supportRes.count ?? 0,
    email:         null,
  };
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const db = await createServiceClient();
  const { data } = await db.from('admins').select('user_id').eq('user_id', userId).maybeSingle();
  return data !== null;
}
