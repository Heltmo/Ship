import { z } from "zod";

// Profile basics validation - simple profile fields only
export const profileBasicsSchema = z.object({
  full_name: z.string().max(100).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
  location: z.string().max(100).optional().or(z.literal("")),
  avatar_url: z.string().url("Invalid avatar URL").optional().or(z.literal("")),

  // Social links
  linkedin_url: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  github_url: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  twitter_url: z.string().url("Invalid Twitter URL").optional().or(z.literal("")),
  website_url: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

export type ProfileBasicsInput = z.infer<typeof profileBasicsSchema>;

// Skill validation
export const skillSchema = z.object({
  skill_id: z.string().uuid(),
  proficiency_level: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  years_of_experience: z.coerce.number().min(0).max(50).optional(),
});

export const userSkillsSchema = z.array(skillSchema).min(5, "At least 5 skills are required");

export type UserSkillInput = z.infer<typeof skillSchema>;

// Portfolio item validation
export const portfolioItemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  url: z.string().url("Invalid URL").min(1, "URL is required"),
  project_type: z.enum(["web_app", "mobile_app", "open_source", "design", "other"]).optional(),
  tags: z.array(z.string()).optional(),
  is_featured: z.boolean().default(false),
});

export const portfolioItemsSchema = z
  .array(portfolioItemSchema)
  .min(2, "At least 2 portfolio items are required");

export type PortfolioItemInput = z.infer<typeof portfolioItemSchema>;

// Combined profile validation for gating check
export const completeProfileSchema = z.object({
  basics: profileBasicsSchema,
  skills: userSkillsSchema,
  portfolio: portfolioItemsSchema,
});

// Helper to check if profile meets discovery requirements
export function isProfileEligibleForDiscovery(profile: {
  hasGitHub: boolean;
  portfolioCount: number;
}): boolean {
  return profile.hasGitHub && profile.portfolioCount >= 2;
}

// Gating status result
export type GatingStatus = {
  isEligible: boolean;
  missingRequirements: string[];
};

export function getGatingStatus(profile: {
  hasGitHub: boolean;
  portfolioCount: number;
}): GatingStatus {
  const missing: string[] = [];

  if (!profile.hasGitHub) {
    missing.push("Connect GitHub");
  }
  if (profile.portfolioCount < 2) {
    missing.push(`Import at least 2 repos (projects) (${profile.portfolioCount}/2)`);
  }

  return {
    isEligible: missing.length === 0,
    missingRequirements: missing,
  };
}
