"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  builderOnboardingSchema,
  type BuilderOnboardingInput,
} from "@/lib/validations/builder-profile";
import { revalidatePath, unstable_noStore } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Save builder onboarding data
 * Updates all 7 builder profile fields and recomputes eligibility
 */
export async function saveBuilderOnboarding(data: BuilderOnboardingInput) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Validate input
  const validationResult = builderOnboardingSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      error: "Validation failed",
      details: validationResult.error.flatten().fieldErrors,
    };
  }

  const validated = validationResult.data;

  // Update profile with builder fields
  const { error } = await supabase
    .from("users_profile")
    .update({
      timezone: validated.timezone,
      availability_hours_per_week: validated.availability_hours_per_week,
      work_best_mode: validated.work_best_mode,
      iteration_style: validated.iteration_style,
      want_to_build_next: validated.want_to_build_next,
      stack_focus: validated.stack_focus,
      primary_tools: validated.primary_tools || [],
      allow_messages: validated.allow_messages ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error saving builder profile:", error);
    return { error: "Failed to save builder profile" };
  }

  // Recompute eligibility (will be done automatically by trigger, but we call it explicitly to ensure it runs)
  const { error: eligibilityError } = await supabase.rpc(
    "recompute_user_eligibility",
    { p_user_id: user.id }
  );

  if (eligibilityError) {
    console.error("Error recomputing eligibility:", eligibilityError);
    // Don't fail the whole operation if eligibility recomputation fails
    // The trigger will handle it
  }

  // Revalidate affected paths
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/profile/builder-onboarding");
  revalidatePath("/find");
  revalidatePath("/matches");
  revalidatePath("/dashboard/people");

  // Redirect to people feed - this happens server-side after all updates are complete
  redirect("/matches");
}

/**
 * Get builder onboarding status
 * Returns current values of all builder profile fields
 */
export async function getBuilderOnboardingStatus() {
  unstable_noStore(); // Force dynamic - never cache this function
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select(
      "timezone, availability_hours_per_week, work_best_mode, iteration_style, stack_focus, primary_tools, want_to_build_next, allow_messages"
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return {
    timezone: profile.timezone || "",
    availability_hours_per_week: profile.availability_hours_per_week || 10,
    work_best_mode: (profile.work_best_mode as string[]) || [],
    iteration_style: (profile.iteration_style as "vibe_coder" | "regular_coder") || undefined,
    stack_focus: (profile.stack_focus as string[]) || [],
    primary_tools: (profile.primary_tools as string[]) || [],
    want_to_build_next: profile.want_to_build_next || "",
    allow_messages: profile.allow_messages ?? true,
  };
}

/**
 * Check if builder profile is complete
 * Returns true if all required fields are filled
 */
export async function checkBuilderProfileComplete() {
  unstable_noStore(); // Force dynamic - never cache this function
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select(
      "timezone, availability_hours_per_week, work_best_mode, iteration_style, stack_focus"
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    return false;
  }

  // Check all required fields
  const isComplete = !!(
    profile.timezone &&
    profile.availability_hours_per_week &&
    profile.availability_hours_per_week > 0 &&
    profile.work_best_mode &&
    (profile.work_best_mode as any[]).length > 0 &&
    profile.iteration_style &&
    profile.stack_focus &&
    (profile.stack_focus as any[]).length > 0
  );

  return isComplete;
}
