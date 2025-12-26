"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
    .select("is_eligible")
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
  const computedEligibility = hasGitHub && totalPortfolio >= 2;

  return {
    isEligible: profile?.is_eligible ?? computedEligibility,
    hasGitHub,
    portfolioCount: totalPortfolio,
  };
}

// Get feed of eligible users
export async function getFeedPeople(limit = 50, offset = 0) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { users: [] };
  }

  // Call RPC to get feed
  const { data, error } = await supabase.rpc("rpc_feed_people", {
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("Error fetching feed:", error);
    return { users: [] };
  }

  return { users: data || [] };
}

// Pass on a user (allowed for everyone)
export async function passUser(targetUserId: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Call RPC
  const { data, error } = await supabase.rpc("rpc_pass_user", {
    p_target_user_id: targetUserId,
  });

  if (error) {
    console.error("Error passing user:", error);
    return { error: "Failed to pass user" };
  }

  const result = data as any;

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/people");
  return { success: true };
}

// Like a user (only allowed for eligible users)
export async function likeUser(targetUserId: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "NOT_AUTHENTICATED" };
  }

  // Call RPC (eligibility check is done server-side in the RPC)
  const { data, error } = await supabase.rpc("rpc_like_user", {
    p_target_user_id: targetUserId,
  });

  if (error) {
    console.error("Error liking user:", error);
    return { error: "UNKNOWN_ERROR" };
  }

  const result = data as any;

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/people");
  revalidatePath("/dashboard/inbox");

  return {
    success: true,
    matched: result.matched || false,
    matchId: result.match_id,
    threadId: result.thread_id,
    createdNewMatch: result.created_new_match || false,
  };
}

// Save a user for later
export async function saveUser(targetUserId: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Insert save interaction
  const { error } = await supabase.from("interactions").insert({
    actor_user_id: user.id,
    target_type: "user",
    target_id: targetUserId,
    action: "save",
  });

  if (error) {
    // Ignore duplicate key errors
    if (!error.message.includes("unique")) {
      console.error("Error saving user:", error);
      return { error: "Failed to save user" };
    }
  }

  revalidatePath("/dashboard/people");
  return { success: true };
}

// Get user's interactions (to know who they've already liked/passed/saved)
export async function getUserInteractions() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { interactions: [] };
  }

  const { data: interactions } = await supabase
    .from("interactions")
    .select("target_id, action")
    .eq("actor_user_id", user.id)
    .eq("target_type", "user");

  return {
    interactions: interactions || [],
  };
}
