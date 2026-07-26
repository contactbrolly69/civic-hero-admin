'use client';

import { useEffect, useRef } from 'react';

interface Props {
  email:    string;
  onConfirm: () => void;
  onCancel:  () => void;
}

export function ConfirmationDialog({ email, onConfirm, onCancel }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cancelRef  = useRef<HTMLButtonElement>(null);

  // Trap focus + Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    cancelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onCancel();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm mx-4 rounded-2xl border border-slate-700 bg-console-surface shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 text-lg">⚡</span>
            <h2 id="confirm-title" className="text-base font-semibold text-white">
              Bootstrap administrator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            This is a one-time, irreversible operation. The setup page will be permanently
            disabled after this succeeds — it cannot be re-run.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <div className="rounded-lg bg-slate-800/60 border border-slate-700 px-4 py-3">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1">Account to be promoted</p>
            <p className="text-sm text-white font-medium break-all">{email}</p>
          </div>

          <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-4 py-3">
            <p className="text-xs text-amber-300/80 leading-relaxed">
              This account will have full administrative access to the Civic Hero console.
              Ensure this is your account before proceeding.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
          >
            Confirm & Bootstrap
          </button>
        </div>
      </div>
    </div>
  );
}
