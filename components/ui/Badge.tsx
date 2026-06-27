import { clsx } from 'clsx';
import type { ModerationStatus, IssueSeverity } from '@/types';

const STATUS_STYLES: Record<ModerationStatus, string> = {
  approved:           'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25',
  pending:            'bg-amber-500/15  text-amber-400  ring-amber-500/25',
  on_hold:            'bg-red-500/15    text-red-400    ring-red-500/25',
  needs_verification: 'bg-blue-500/15   text-blue-400   ring-blue-500/25',
  rejected:           'bg-slate-500/15  text-slate-400  ring-slate-500/25',
};

const STATUS_LABELS: Record<ModerationStatus, string> = {
  approved:           'Approved',
  pending:            'Pending',
  on_hold:            'On Hold',
  needs_verification: 'Needs Review',
  rejected:           'Rejected',
};

const SEVERITY_STYLES: Record<IssueSeverity, string> = {
  critical: 'bg-red-500/15    text-red-400    ring-red-500/25',
  moderate: 'bg-amber-500/15  text-amber-400  ring-amber-500/25',
  low:      'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
      className,
    )}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ModerationStatus }) {
  return (
    <Badge className={STATUS_STYLES[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  return (
    <Badge className={SEVERITY_STYLES[severity]}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
}

export function CountBadge({ count, color = 'red' }: { count: number; color?: 'red' | 'blue' | 'amber' }) {
  const styles = {
    red:   'bg-red-500 text-white',
    blue:  'bg-blue-500 text-white',
    amber: 'bg-amber-500 text-white',
  };
  if (count === 0) return null;
  return (
    <span className={clsx('ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums', styles[color])}>
      {count > 99 ? '99+' : count}
    </span>
  );
}
