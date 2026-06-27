import type { ConsoleSession } from '@/types';

export function Header({ session, title }: { session: ConsoleSession; title: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-console-border bg-console-surface/80 px-6 backdrop-blur">
      <h1 className="text-sm font-semibold text-slate-200">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-500">
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white uppercase">
            {session.name.slice(0, 1)}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-slate-300">{session.name}</p>
            <p className="text-[10px] text-slate-500">{session.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
