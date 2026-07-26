import { NextRequest, NextResponse } from 'next/server';
import { getSession }               from '@/lib/api/auth';
import { createServiceClient }      from '@/lib/supabase/server';

const VALID = new Set([
  'approve', 'reject', 'on_hold', 'needs_verification',
  'hide', 'restore', 'spam', 'duplicate', 'archive',
]);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { action: string; ids: string[] };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { action, ids } = body;
  if (!VALID.has(action) || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const safeIds = ids.slice(0, 500).filter(id =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
  if (safeIds.length === 0) return NextResponse.json({ error: 'No valid IDs' }, { status: 400 });

  const db  = createServiceClient();
  const now = new Date().toISOString();

  let moderationStatus: string | null = null;
  let hidden: boolean | null          = null;

  switch (action) {
    case 'approve':            moderationStatus = 'approved';            hidden = false; break;
    case 'reject':             moderationStatus = 'rejected';            hidden = true;  break;
    case 'on_hold':            moderationStatus = 'on_hold';             hidden = true;  break;
    case 'needs_verification': moderationStatus = 'needs_verification';                  break;
    case 'hide':                                                          hidden = true;  break;
    case 'restore':                                                       hidden = false; break;
    case 'spam':               moderationStatus = 'rejected';            hidden = true;  break;
    case 'duplicate':          moderationStatus = 'rejected';            hidden = true;  break;
    case 'archive':            moderationStatus = 'rejected';            hidden = false; break;
  }

  const update: Record<string, unknown> = {};
  if (moderationStatus !== null) update.moderation_status = moderationStatus;
  if (hidden !== null)           update.hidden = hidden;

  if (Object.keys(update).length > 0) {
    const { error } = await db.from('issues').update(update).in('id', safeIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (moderationStatus !== null) {
    await db.from('issue_moderation').upsert(
      safeIds.map(id => ({
        issue_id:        id,
        status:          moderationStatus,
        confidence:      1.0,
        reason:          `Bulk ${action} by moderator`,
        flags:           {},
        ai_model:        'human',
        moderated_at:    now,
        reviewed_by:     session.userId,
        reviewed_at:     now,
        override_reason: `Bulk ${action}`,
      })),
      { onConflict: 'issue_id' },
    );
  }

  return NextResponse.json({ ok: true, affected: safeIds.length });
}
