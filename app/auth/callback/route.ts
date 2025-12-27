import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  console.log("🔐 Auth callback started");
  console.log("Code present:", !!code);
  console.log("Redirect to:", next);

  if (code) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value;
          },
          set(name, value, options) {
            console.log("🍪 Setting cookie:", name);
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          },
          remove(name, options) {
            console.log("🗑️  Removing cookie:", name);
            request.cookies.set({ name, value: "", ...options });
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("❌ Auth callback error:", error);
        return NextResponse.redirect(new URL("/login?error=auth-failed", requestUrl.origin));
      }

      console.log("✅ Session created for user:", data?.user?.email);
      console.log("✅ Redirecting with cookies set");

      // Create redirect response and copy cookies set during exchange
      const redirectResponse = NextResponse.redirect(new URL(next, requestUrl.origin));
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });

      return redirectResponse;
    } catch (e) {
      console.error("❌ Unexpected error in callback:", e);
      return NextResponse.redirect(new URL("/login?error=auth-failed", requestUrl.origin));
    }
  }

  console.log("⚠️  No code provided, redirecting anyway");
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
