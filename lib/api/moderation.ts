import { createServiceClient } from '@/lib/supabase/server';
import type {
  ConsoleIssue, ConsoleModerationRecord, DashboardStats,
  IssueFilters, PaginatedResult, ModerationStatus, TrendPoint, CategoryBreakdown,
} from '@/types';

// ── Row → type mappers ────────────────────────────────────────────────────

function rowToIssue(row: Record<string, any>): ConsoleIssue {
  const media     = (row.issue_media ?? []) as Array<{ url: string; type: string }>;
  const modRow    = row.issue_moderation?.[0] ?? null;
  const profileRow = row.profiles ?? null;

  return {
    id:               row.id,
    title:            row.title,
    description:      row.description ?? '',
    category:         row.category,
    severity:         row.severity,
    status:           row.status,
    location:         row.location,
    lat:              row.lat ?? null,
    lng:              row.lng ?? null,
    affectedCount:    row.affected_count ?? 0,
    supportCount:     row.support_count  ?? 0,
    hidden:           row.hidden ?? false,
    moderationStatus: row.moderation_status ?? 'pending',
    createdAt:        row.created_at,
    updatedAt:        row.updated_at ?? row.created_at,
    userId:           row.user_id ?? null,
    imageUrl:         media.find(m => m.type === 'before')?.url ?? null,
    afterImageUrl:    media.find(m => m.type === 'after')?.url  ?? null,
    moderation:       modRow ? rowToModeration(modRow) : null,
    user:             profileRow ? {
      id:       profileRow.id,
      name:     profileRow.name ?? 'Unknown',
      handle:   profileRow.handle ?? '',
      ward:     profileRow.ward   ?? '',
      joinedAt: profileRow.joined_at ?? '',
      isAdmin:  false,
    } : null,
  };
}

function rowToModeration(row: Record<string, any>): ConsoleModerationRecord {
  return {
    id:             row.id,
    issueId:        row.issue_id,
    status:         row.status,
    confidence:     row.confidence ?? 0,
    reason:         row.reason ?? null,
    flags:          row.flags ?? {},
    aiModel:        row.ai_model ?? 'unknown',
    moderatedAt:    row.moderated_at,
    reviewedBy:     row.reviewed_by    ?? null,
    reviewedAt:     row.reviewed_at    ?? null,
    overrideReason: row.override_reason ?? null,
  };
}

const ISSUE_SELECT = `
  id, title, description, category, severity, status, location, lat, lng,
  affected_count, support_count, hidden, moderation_status, created_at, updated_at, user_id,
  issue_media ( url, type ),
  issue_moderation ( id, status, confidence, reason, flags, ai_model, moderated_at, reviewed_by, reviewed_at, override_reason ),
  profiles ( id, name, handle, ward, joined_at )
`;

// ── Dashboard stats ───────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await createServiceClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [total, pending, hold, approvedToday, rejectedToday, needsVerif, totalUsers, hidden] =
    await Promise.all([
      db.from('issues').select('id', { count: 'exact', head: true }),
      db.from('issues').select('id', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
      db.from('issues').select('id', { count: 'exact', head: true }).eq('moderation_status', 'on_hold'),
      db.from('issue_moderation').select('id', { count: 'exact', head: true })
        .eq('status', 'approved').gte('moderated_at', todayIso),
      db.from('issue_moderation').select('id', { count: 'exact', head: true })
        .eq('status', 'rejected').gte('moderated_at', todayIso),
      db.from('issues').select('id', { count: 'exact', head: true }).eq('moderation_status', 'needs_verification'),
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('issues').select('id', { count: 'exact', head: true }).eq('hidden', true),
    ]);

  // Active users today (submitted or supported)
  const sinceTs = todayIso;
  const { data: activeData } = await db.rpc('get_active_citizens_count', { since_ts: sinceTs });

  return {
    totalIssues:       total.count        ?? 0,
    pendingReview:     pending.count       ?? 0,
    onHold:            hold.count          ?? 0,
    approvedToday:     approvedToday.count ?? 0,
    rejectedToday:     rejectedToday.count ?? 0,
    needsVerification: needsVerif.count    ?? 0,
    totalUsers:        totalUsers.count    ?? 0,
    activeToday:       Number(activeData ?? 0),
    hiddenIssues:      hidden.count        ?? 0,
  };
}

// ── Trend data (last 14 days) ─────────────────────────────────────────────

export async function getTrends(): Promise<TrendPoint[]> {
  const db   = await createServiceClient();
  const days = 14;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: issues } = await db
    .from('issues')
    .select('created_at, moderation_status')
    .gte('created_at', since)
    .order('created_at');

  const { data: modRecords } = await db
    .from('issue_moderation')
    .select('moderated_at, status')
    .gte('moderated_at', since);

  const points: Record<string, TrendPoint> = {};
  for (let i = 0; i < days; i++) {
    const d  = new Date(Date.now() - (days - 1 - i) * 86400000);
    const key = d.toISOString().slice(0, 10);
    points[key] = { date: key, submitted: 0, approved: 0, rejected: 0, onHold: 0 };
  }

  for (const row of issues ?? []) {
    const key = (row.created_at as string).slice(0, 10);
    if (points[key]) points[key].submitted++;
  }
  for (const row of modRecords ?? []) {
    const key = (row.moderated_at as string).slice(0, 10);
    if (!points[key]) continue;
    if (row.status === 'approved')  points[key].approved++;
    if (row.status === 'rejected')  points[key].rejected++;
    if (row.status === 'on_hold')   points[key].onHold++;
  }

  return Object.values(points);
}

// ── Category breakdown ────────────────────────────────────────────────────

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  const db = await createServiceClient();
  const { data } = await db.from('issues').select('category');
  if (!data) return [];

  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.category as string] = (counts[row.category as string] ?? 0) + 1;
  }
  const total = data.length || 1;
  return Object.entries(counts)
    .map(([category, count]) => ({ category: category as any, count, pct: Math.round(count / total * 100) }))
    .sort((a, b) => b.count - a.count);
}

// ── Moderation queue ──────────────────────────────────────────────────────

export async function getIssues(filters: IssueFilters = {}): Promise<PaginatedResult<ConsoleIssue>> {
  const db = await createServiceClient();
  const page    = filters.page    ?? 1;
  const perPage = filters.perPage ?? 20;
  const from    = (page - 1) * perPage;

  let query = db.from('issues').select(ISSUE_SELECT, { count: 'exact' });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('moderation_status', filters.status);
  }
  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }
  if (filters.severity && filters.severity !== 'all') {
    query = query.eq('severity', filters.severity);
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
  }
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
  if (filters.dateTo)   query = query.lte('created_at', filters.dateTo);
  if (filters.hasImage) query = query.not('issue_media', 'is', null);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1);

  if (error) throw error;

  return {
    data:    (data ?? []).map(rowToIssue),
    total:   count ?? 0,
    page,
    perPage,
    hasMore: (count ?? 0) > from + perPage,
  };
}

export async function getIssueById(id: string): Promise<ConsoleIssue | null> {
  const db = await createServiceClient();
  const { data, error } = await db
    .from('issues')
    .select(ISSUE_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return rowToIssue(data as Record<string, any>);
}

// ── Moderation actions ────────────────────────────────────────────────────

async function upsertModerationRecord(
  issueId:   string,
  status:    ModerationStatus,
  reason:    string,
  reviewedBy: string,
): Promise<void> {
  const db = await createServiceClient();
  const now = new Date().toISOString();

  await Promise.all([
    db.from('issues').update({
      moderation_status: status,
      hidden: status === 'on_hold' || status === 'rejected',
    }).eq('id', issueId),

    db.from('issue_moderation').upsert({
      issue_id:        issueId,
      status,
      confidence:      1.0,
      reason,
      flags:           {},
      ai_model:        'human',
      moderated_at:    now,
      reviewed_by:     reviewedBy,
      reviewed_at:     now,
      override_reason: reason,
    }, { onConflict: 'issue_id' }),
  ]);
}

export async function approveIssue(issueId: string, reviewerId: string): Promise<void> {
  await upsertModerationRecord(issueId, 'approved', 'Approved by moderator', reviewerId);
}

export async function holdIssue(issueId: string, reason: string, reviewerId: string): Promise<void> {
  await upsertModerationRecord(issueId, 'on_hold', reason, reviewerId);
}

export async function rejectIssue(issueId: string, reason: string, reviewerId: string): Promise<void> {
  await upsertModerationRecord(issueId, 'rejected', reason, reviewerId);
}

export async function needsVerificationIssue(issueId: string, reviewerId: string): Promise<void> {
  await upsertModerationRecord(issueId, 'needs_verification', 'Flagged for community verification', reviewerId);
}
