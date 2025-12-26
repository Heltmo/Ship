import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export async function GET() {
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
