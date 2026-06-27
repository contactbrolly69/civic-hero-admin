'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import type { ModerationStatus } from '@/types';

export function ActionButtons({
  issueId,
  currentStatus,
}: {
  issueId:       string;
  currentStatus: ModerationStatus;
}) {
  const router   = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [reason,  setReason]  = useState('');
  const [showReason, setShowReason] = useState<'hold' | 'reject' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function act(action: 'approve' | 'hold' | 'reject' | 'needs_verification') {
    setLoading(action);
    setMessage(null);
    try {
      const res = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, action, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Action failed');
      setMessage({ type: 'success', text: `Report ${action.replace('_', ' ')} successfully.` });
      setShowReason(null);
      setReason('');
      router.refresh();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">

      {/* Current status note */}
      {currentStatus !== 'pending' && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5">
          <p className="text-xs text-slate-500">
            Current status: <span className="text-slate-300 font-medium capitalize">{currentStatus.replace('_', ' ')}</span>
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">Actions below will override the current status.</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="success"
          size="sm"
          loading={loading === 'approve'}
          disabled={loading !== null}
          onClick={() => act('approve')}
          className="w-full justify-center"
        >
          ✓ Approve
        </Button>
        <Button
          variant="ghost"
          size="sm"
          loading={loading === 'needs_verification'}
          disabled={loading !== null}
          onClick={() => act('needs_verification')}
          className="w-full justify-center"
        >
          ? Verify
        </Button>
      </div>

      {/* Hold */}
      {showReason === 'hold' ? (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for holding (shown to reviewer)…"
            rows={2}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-amber-500 focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <Button variant="warning" size="sm" loading={loading === 'hold'} onClick={() => act('hold')} className="flex-1 justify-center">
              Confirm Hold
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowReason(null); setReason(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="warning"
          size="sm"
          disabled={loading !== null}
          onClick={() => setShowReason('hold')}
          className="w-full justify-center"
        >
          ⏸ Put on Hold
        </Button>
      )}

      {/* Reject */}
      {showReason === 'reject' ? (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for rejection (shown to user)…"
            rows={2}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-red-500 focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <Button variant="danger" size="sm" loading={loading === 'reject'} onClick={() => act('reject')} className="flex-1 justify-center">
              Confirm Reject
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowReason(null); setReason(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="danger"
          size="sm"
          disabled={loading !== null}
          onClick={() => setShowReason('reject')}
          className="w-full justify-center"
        >
          ✕ Reject
        </Button>
      )}

      {/* Feedback */}
      {message && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${
          message.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
