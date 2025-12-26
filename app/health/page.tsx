import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const supabase = createServerSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const { data: userData } = await supabase.auth.getUser();

  const payload = {
    hasSession: Boolean(sessionData.session),
    session: sessionData.session
      ? {
          userId: sessionData.session.user.id,
          email: sessionData.session.user.email,
          expiresAt: sessionData.session.expires_at
        }
      : null,
    user: userData.user
      ? {
          id: userData.user.id,
          email: userData.user.email
        }
      : null
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-100">Health check</h1>
      <p className="mt-2 text-sm text-slate-400">
        Supabase auth session information for the current request.
      </p>
      <pre className="mt-4 overflow-auto rounded-lg border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </main>
  );
}
