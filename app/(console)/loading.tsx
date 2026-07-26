export default function ConsoleLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-slate-800" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-800" />
        ))}
      </div>
      <div className="h-56 rounded-xl bg-slate-800" />
      <div className="h-72 rounded-xl bg-slate-800" />
    </div>
  );
}
