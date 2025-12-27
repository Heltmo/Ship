import { z } from "zod";

// ============================================================================
// CONSTANTS - Valid options for builder profile fields
// ============================================================================

export const WORK_MODES = [
  "solo_deep_work",
  "pair_programming",
  "async_communication",
  "real_time_collaboration",
] as const;

export const STACK_OPTIONS = [
  "web",
  "mobile",
  "ai",
  "game",
  "backend",
  "tooling",
] as const;

export const TOOL_OPTIONS = [
  "cursor",
  "vscode",
  "replit",
  "claude",
  "chatgpt",
  "windsurf",
  "vim",
  "other",
] as const;

export const ITERATION_STYLES = ["vibe_coder", "regular_coder"] as const;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Builder onboarding form validation schema
 * Validates all 7 required fields for builder profile completion
 */
export const builderOnboardingSchema = z.object({
  // Timezone (required)
  timezone: z.string().min(1, "Timezone is required"),

  // Availability hours per week (required, 1-168)
  availability_hours_per_week: z.coerce
    .number()
    .min(1, "Must be at least 1 hour per week")
    .max(168, "Cannot exceed 168 hours per week"),

  // Work preferences - multi-select, at least 1 required
  work_best_mode: z
    .array(z.enum(WORK_MODES))
    .min(1, "Select at least one work preference"),

  // Iteration style - vibe_coder or regular_coder (required)
  iteration_style: z.enum(ITERATION_STYLES, {
    required_error: "Select your iteration style",
  }),

  // What they want to build - free text (required, 10-500 chars)
  want_to_build_next: z
    .string()
    .min(10, "Tell us more about what you want to build (at least 10 characters)")
    .max(500, "Maximum 500 characters"),

  // Stack focus - multi-select, at least 1 required
  stack_focus: z
    .array(z.enum(STACK_OPTIONS))
    .min(1, "Select at least one stack"),

  // Primary tools - multi-select, optional
  primary_tools: z
    .array(z.enum(TOOL_OPTIONS))
    .optional()
    .default([]),

  // Messaging preference - optional
  allow_messages: z.boolean().optional().default(true),
});

export type BuilderOnboardingInput = z.infer<typeof builderOnboardingSchema>;

// ============================================================================
// ELIGIBILITY HELPERS
// ============================================================================

/**
 * Check if a user's builder profile is complete
 * Returns true only if ALL required fields are filled
 */
export function isBuilderProfileComplete(profile: {
  timezone: string | null;
  availability_hours_per_week: number | null;
  work_best_mode: string[] | null;
  iteration_style: string | null;
  stack_focus: string[] | null;
}): boolean {
  return !!(
    profile.timezone &&
    profile.timezone.length > 0 &&
    profile.availability_hours_per_week &&
    profile.availability_hours_per_week > 0 &&
    profile.work_best_mode &&
    profile.work_best_mode.length > 0 &&
    profile.iteration_style &&
    profile.iteration_style.length > 0 &&
    profile.stack_focus &&
    profile.stack_focus.length > 0
  );
}

/**
 * Gating status result type
 * Used to show users what they're missing for eligibility
 */
export type BuilderGatingStatus = {
  isEligible: boolean;
  missingRequirements: string[];
};

/**
 * Get comprehensive gating status for a user
 * Checks all 7 requirements: GitHub + 2 repos + 5 builder profile fields
 */
export function getBuilderGatingStatus(profile: {
  hasGitHub: boolean;
  portfolioCount: number;
  timezone: string | null;
  availability_hours_per_week: number | null;
  work_best_mode: string[] | null;
  iteration_style: string | null;
  stack_focus: string[] | null;
}): BuilderGatingStatus {
  const missing: string[] = [];

  // GitHub connection (required)
  if (!profile.hasGitHub) {
    missing.push("Connect GitHub");
  }

  // Portfolio items (at least 2 required)
  if (profile.portfolioCount < 2) {
    missing.push(`Import at least 2 repos (${profile.portfolioCount}/2)`);
  }

  // Timezone (required)
  if (!profile.timezone || profile.timezone.length === 0) {
    missing.push("Set your timezone");
  }

  // Availability hours per week (required)
  if (!profile.availability_hours_per_week || profile.availability_hours_per_week <= 0) {
    missing.push("Set availability hours per week");
  }

  // Work preferences (at least 1 required)
  if (!profile.work_best_mode || profile.work_best_mode.length === 0) {
    missing.push("Select work preferences");
  }

  // Iteration style (required)
  if (!profile.iteration_style || profile.iteration_style.length === 0) {
    missing.push("Select iteration style (vibe coder or regular coder)");
  }

  // Stack focus (at least 1 required)
  if (!profile.stack_focus || profile.stack_focus.length === 0) {
    missing.push("Select stack focus");
  }

  return {
    isEligible: missing.length === 0,
    missingRequirements: missing,
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type WorkMode = typeof WORK_MODES[number];
export type StackOption = typeof STACK_OPTIONS[number];
export type ToolOption = typeof TOOL_OPTIONS[number];
export type IterationStyle = typeof ITERATION_STYLES[number];
