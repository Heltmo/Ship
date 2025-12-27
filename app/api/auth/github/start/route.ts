import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { authLimiter } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limiting: prevent OAuth spam
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "anonymous";
  const { success } = await authLimiter.limit(ip);

  if (!success) {
    return new NextResponse("Too many requests. Please try again later.", { status: 429 });
  }
  // Generate a random state for CSRF protection
  const state = randomBytes(32).toString("hex");

  // Store state in httpOnly cookie
  cookies().set("github_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  // Build GitHub OAuth URL
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  githubAuthUrl.searchParams.set(
    "redirect_uri",
    `${process.env.APP_URL}/api/auth/github/callback`
  );
  githubAuthUrl.searchParams.set("scope", "read:user user:email"); // Only public repos, no write access
  githubAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(githubAuthUrl.toString());
}
