import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { authLimiter } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limiting: prevent OAuth spam
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "anonymous";
  const { success } = await authLimiter.limit(ip);

  if (!success) {
    return new NextResponse("Too many requests. Please try again later.", { status: 429 });
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Verify state to prevent CSRF
  const storedState = cookies().get("github_oauth_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(
      new URL("/dashboard/profile?error=Invalid OAuth state", process.env.APP_URL!)
    );
  }

  // Clear the state cookie
  cookies().delete("github_oauth_state");

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID!,
          client_secret: process.env.GITHUB_CLIENT_SECRET!,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Failed to get access token");
    }

    const accessToken = tokenData.access_token;

    // Fetch GitHub user profile
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const githubUser = await userResponse.json();

    // Get current user from Supabase
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=Not authenticated", process.env.APP_URL!)
      );
    }

    // Upsert GitHub identity into user_identities table
    const { error: identityError } = await supabase
      .from("user_identities")
      .upsert(
        {
          user_id: user.id,
          provider: "github",
          provider_user_id: githubUser.id.toString(),
          username: githubUser.login,
          profile_url: githubUser.html_url,
          avatar_url: githubUser.avatar_url,
          connected_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,provider",
        }
      );

    if (identityError) {
      console.error("Error saving GitHub identity:", identityError);
      return NextResponse.redirect(
        new URL("/dashboard/profile?error=Failed to save GitHub connection", process.env.APP_URL!)
      );
    }

    // Auto-populate user profile from GitHub data
    // Always sync from GitHub - this is what "Sync Profile" does
    const profileUpdates: any = {
      avatar_url: githubUser.avatar_url, // Always update avatar
      github_url: githubUser.html_url, // Always update GitHub URL
    };

    // Always update name if GitHub has one
    if (githubUser.name) {
      profileUpdates.full_name = githubUser.name;
    }

    // Always update bio if GitHub has one
    if (githubUser.bio) {
      profileUpdates.bio = githubUser.bio;
    }

    // Always update location if GitHub has one
    if (githubUser.location) {
      profileUpdates.location = githubUser.location;
    }

    // Update profile with GitHub data
    const { error: profileError } = await supabase
      .from("users_profile")
      .update(profileUpdates)
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating profile with GitHub data:", profileError);
      // Don't fail the whole flow, just log it
    }

    // Store access token in short-lived httpOnly cookie for repo fetching
    cookies().set("github_temp_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes - enough time to select repos
      path: "/",
    });

    // Redirect to repo picker page
    return NextResponse.redirect(
      new URL("/dashboard/profile/connect-github", process.env.APP_URL!)
    );
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/profile?error=${encodeURIComponent(
          error instanceof Error ? error.message : "GitHub connection failed"
        )}`,
        process.env.APP_URL!
      )
    );
  }
}
