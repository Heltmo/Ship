"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { messageLimiter } from "@/lib/security/rate-limit";

// Get viewer's profile and eligibility status
export async function getViewerEligibility() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("is_eligible, timezone, availability_hours_per_week, work_best_mode, iteration_style, stack_focus")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  // Check if user has GitHub connected
  const { data: githubIdentity } = await supabase
    .from("user_identities")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", "github")
    .single();

  // Get portfolio count
  const { count: portfolioCount } = await supabase
    .from("portfolio_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const hasGitHub = !!githubIdentity;
  const totalPortfolio = portfolioCount || 0;

  // Check if builder profile is complete
  const builderProfileComplete = !!(
    profile.timezone &&
    profile.availability_hours_per_week &&
    profile.availability_hours_per_week > 0 &&
    profile.work_best_mode &&
    (profile.work_best_mode as any[]).length > 0 &&
    profile.iteration_style &&
    profile.stack_focus &&
    (profile.stack_focus as any[]).length > 0
  );

  return {
    isEligible: profile?.is_eligible ?? false,
    hasGitHub,
    portfolioCount: totalPortfolio,
    builderProfileComplete,
  };
}

// Get feed of eligible users
export async function getFeedPeople(limit = 50, offset = 0) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { users: [], viewerId: null };
  }

  // Call RPC to get feed
  const { data, error } = await supabase.rpc("rpc_feed_people", {
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("Error fetching feed:", error);
    return { users: [], viewerId: user.id };
  }

  const otherIds = (data || []).map((row: any) => row.id).filter(Boolean);
  let allowMessageMap = new Map<string, boolean>();

  if (otherIds.length > 0) {
    const { data: allowRows } = await supabase
      .from("users_profile")
      .select("id, allow_messages")
      .in("id", otherIds);

    allowMessageMap = new Map(
      (allowRows || []).map((row) => [row.id, row.allow_messages ?? true])
    );
  }

  const normalizedUsers = (data || []).map((row: any) => ({
    ...row,
    allow_messages: allowMessageMap.get(row.id) ?? row.allow_messages ?? true,
  }));

  const { data: selfProfile } = await supabase
    .from("users_profile")
    .select(
      "id, full_name, headline, bio, location, github_url, linkedin_url, timezone, availability_hours_per_week, work_best_mode, iteration_style, stack_focus, want_to_build_next, allow_messages"
    )
    .eq("id", user.id)
    .single();

  const { count: selfPortfolioCount } = await supabase
    .from("portfolio_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const selfUser = selfProfile
    ? {
        ...selfProfile,
        portfolio_count: selfPortfolioCount || 0,
      }
    : null;

  return {
    users: selfUser ? [selfUser, ...normalizedUsers] : normalizedUsers,
    viewerId: user.id,
  };
}

// Start a direct thread with a user (no like required)
export async function startThreadWithUser(targetUserId: string, firstMessage: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "NOT_AUTHENTICATED" };
  }

  // Rate limiting: prevent thread spam
  const { success } = await messageLimiter.limit(user.id);
  if (!success) {
    return { error: "TOO_MANY_REQUESTS" };
  }

  const { data, error } = await supabase.rpc("rpc_start_thread", {
    p_target_user_id: targetUserId,
    p_first_message: firstMessage,
  });

  if (error) {
    console.error("Error starting thread:", error);
    if (error.message?.includes("TARGET_MESSAGES_DISABLED")) {
      return { error: "TARGET_MESSAGES_DISABLED" };
    }
    return { error: "FAILED_TO_START_THREAD" };
  }

  revalidatePath("/dashboard/inbox");

  return { threadId: data as string };
}
