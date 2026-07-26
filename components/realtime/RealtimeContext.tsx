'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RealtimeStatus = 'live' | 'reconnecting' | 'offline';

export interface Toast {
  id:       string;
  variant:  'critical' | 'warning' | 'success' | 'info';
  icon?:    string;
  title:    string;
  message?: string;
  duration?: number;
}

interface CtxValue {
  status:       RealtimeStatus;
  setStatus:    (s: RealtimeStatus) => void;
  toasts:       Toast[];
  addToast:     (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const Ctx = createContext<CtxValue>({
  status:       'offline',
  setStatus:    () => {},
  toasts:       [],
  addToast:     () => {},
  dismissToast: () => {},
});

export const useRealtimeStatus    = () => useContext(Ctx).status;
export const useSetRealtimeStatus = () => useContext(Ctx).setStatus;
export const useToast             = () => ({ addToast: useContext(Ctx).addToast, dismissToast: useContext(Ctx).dismissToast });

// ── Provider ──────────────────────────────────────────────────────────────────

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<RealtimeStatus>('offline');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [{ ...toast, id }, ...prev].slice(0, 5));
    const ms = toast.duration ?? 5_000;
    timers.current.set(id, setTimeout(() => dismissToast(id), ms));
  }, [dismissToast]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <Ctx.Provider value={{ status, setStatus, toasts, addToast, dismissToast }}>
      {children}
      <ToastRenderer />
    </Ctx.Provider>
  );
}

// ── Toast renderer ────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<Toast['variant'], { border: string; accent: string }> = {
  critical: { border: 'border-red-500/30',    accent: 'text-red-400'    },
  warning:  { border: 'border-amber-500/30',  accent: 'text-amber-400'  },
  success:  { border: 'border-emerald-500/30',accent: 'text-emerald-400'},
  info:     { border: 'border-white/[0.08]',  accent: 'text-blue-400'   },
};

function ToastRenderer() {
  const { toasts, dismissToast } = useContext(Ctx);
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col-reverse gap-2 items-end pointer-events-none">
      {toasts.map(t => {
        const s = VARIANT_STYLES[t.variant];
        return (
          <div
            key={t.id}
            className={[
              'animate-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border',
              s.border,
              'px-4 py-3 shadow-2xl backdrop-blur-xl max-w-[320px] w-full',
            ].join(' ')}
            style={{ background: 'rgba(15,29,48,0.96)' }}
          >
            {t.icon && (
              <span className="text-base shrink-0 mt-px select-none">{t.icon}</span>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] font-semibold ${s.accent}`}>{t.title}</p>
              {t.message && (
                <p className="text-[11px] text-white/40 truncate mt-0.5">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="ml-1 shrink-0 text-white/20 hover:text-white/55 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
