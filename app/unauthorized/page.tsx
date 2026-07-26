export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-console-bg">
      <div className="text-center space-y-3 max-w-sm px-4">
        <p className="text-4xl">🚫</p>
        <h1 className="text-lg font-semibold text-white">Access Denied</h1>
        <p className="text-sm text-slate-400">
          Your account is not authorised to access the Civic Hero console.
        </p>
        <p className="text-xs text-slate-600">
          You are signed in, but your account is not in the admins table.
          If you are the first admin, use the setup page below.
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <a
            href="/setup"
            className="inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Open Setup &amp; Diagnostics →
          </a>
          <a
            href="/login"
            className="inline-block rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:text-white"
          >
            Sign in with a different account
          </a>
        </div>
      </div>
    </div>
  );
}
