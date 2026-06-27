import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/api/auth';
import { approveIssue, holdIssue, rejectIssue, needsVerificationIssue } from '@/lib/api/moderation';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { issueId, action, reason } = await req.json() as {
      issueId: string;
      action:  'approve' | 'hold' | 'reject' | 'needs_verification';
      reason?: string;
    };

    if (!issueId || !action) {
      return NextResponse.json({ error: 'issueId and action are required' }, { status: 400 });
    }

    switch (action) {
      case 'approve':
        await approveIssue(issueId, session.userId);
        break;
      case 'hold':
        await holdIssue(issueId, reason ?? 'Put on hold by moderator', session.userId);
        break;
      case 'reject':
        await rejectIssue(issueId, reason ?? 'Rejected by moderator', session.userId);
        break;
      case 'needs_verification':
        await needsVerificationIssue(issueId, session.userId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, action, issueId });
  } catch (e: any) {
    console.error('[moderate] error:', e?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
