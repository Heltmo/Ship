import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isValidRedirect } from "@/lib/security/validate-redirect";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") || "/dashboard";

  // Validate redirect to prevent open redirect vulnerability
  const next = isValidRedirect(nextParam) ? nextParam : "/dashboard";

  logger.debug("🔐 Auth callback started");
  logger.debug("Code present:", !!code);
  logger.debug("Redirect to:", next);

  if (code) {
    // Create redirect response URL first
    const completingUrl = new URL("/auth/completing", requestUrl.origin);
    completingUrl.searchParams.set("next", next);
    const redirectResponse = NextResponse.redirect(completingUrl);

    // Create Supabase client that sets cookies directly on redirect response
    const supabase = createServerClient(
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            logger.debug("🍪 Setting cookie:", name);
            redirectResponse.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            logger.debug("🗑️  Removing cookie:", name);
            redirectResponse.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        logger.error("❌ Auth callback error:", error);
        return NextResponse.redirect(new URL("/login?error=auth-failed", requestUrl.origin));
      }

      logger.debug("✅ Session created for user:", data?.user?.email);
      logger.debug("✅ Cookies set on redirect response");

      return redirectResponse;
    } catch (e) {
      logger.error("❌ Unexpected error in callback:", e);
      return NextResponse.redirect(new URL("/login?error=auth-failed", requestUrl.origin));
    }
  }

  logger.debug("⚠️  No code provided, redirecting to login");
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
