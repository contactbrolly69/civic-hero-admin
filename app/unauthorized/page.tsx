export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-console-bg">
      <div className="text-center space-y-3">
        <p className="text-4xl">🚫</p>
        <h1 className="text-lg font-semibold text-white">Access Denied</h1>
        <p className="text-sm text-slate-400">
          Your account is not authorised to access the Civic Hero console.
        </p>
        <a
          href="/login"
          className="inline-block mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white"
        >
          Sign in with a different account
        </a>
      </div>
    </div>
  );
}
