"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  profileBasicsSchema,
  type ProfileBasicsInput,
  type UserSkillInput,
  type PortfolioItemInput,
  getGatingStatus,
  type GatingStatus,
} from "@/lib/validations/profile";
import { revalidatePath } from "next/cache";

// Type definitions for database entities
type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;

  // Social links
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  website_url: string | null;

  // Legacy fields (keeping for now)
  role_intent: string | null;
  looking_for_cofounder: boolean | null;
  looking_for_projects: boolean | null;
  profile_visibility: string | null;
  onboarding_completed: boolean | null;
};

type UserSkill = {
  id: string;
  skill_id: string;
  proficiency_level: string | null;
  years_of_experience: number | null;
  skill?: {
    id: string;
    name: string;
    category: string | null;
  };
};

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  image_url: string | null;
  project_type: string | null;
  tags: string[] | null;
  is_featured: boolean | null;
  display_order: number | null;
};

// Get current user's profile with related data
export async function getProfile(): Promise<{
  profile: UserProfile | null;
  skills: UserSkill[];
  portfolio: PortfolioItem[];
  gatingStatus: GatingStatus;
} | null> {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get profile
  const { data: profile } = await supabase
    .from("users_profile")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get skills
  const { data: skills } = await supabase
    .from("user_skills")
    .select(
      `
      id,
      skill_id,
      proficiency_level,
      years_of_experience,
      skill:skills(id, name, category)
    `
    )
    .eq("user_id", user.id);

  // Get portfolio items
  const { data: portfolio } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true });

  // Check if user has GitHub connected
  const { data: githubIdentity } = await supabase
    .from("user_identities")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", "github")
    .single();

  // Calculate gating status
  const portfolioCount = portfolio?.length || 0;
  const gatingStatus = getGatingStatus({
    hasGitHub: !!githubIdentity,
    portfolioCount,
  });

  return {
    profile: profile as UserProfile | null,
    skills: (skills as any as UserSkill[]) || [],
    portfolio: (portfolio as any as PortfolioItem[]) || [],
    gatingStatus,
  };
}

// Update profile basics
export async function updateProfileBasics(data: ProfileBasicsInput) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Validate input
  const validationResult = profileBasicsSchema.safeParse(data);
  if (!validationResult.success) {
    return {
      error: "Validation failed",
      details: validationResult.error.flatten().fieldErrors,
    };
  }

  const validated = validationResult.data;

  // Update profile basics
  const { error } = await supabase
    .from("users_profile")
    .update({
      // Basic info
      full_name: validated.full_name || null,
      bio: validated.bio || null,
      location: validated.location || null,
      avatar_url: validated.avatar_url || null,

      // Social links
      linkedin_url: validated.linkedin_url || null,
      github_url: validated.github_url || null,
      twitter_url: validated.twitter_url || null,
      website_url: validated.website_url || null,

      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

// Add or update user skills
export async function updateUserSkills(skills: UserSkillInput[]) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (skills.length < 5) {
    return { error: "At least 5 skills are required" };
  }

  // Delete existing skills
  await supabase.from("user_skills").delete().eq("user_id", user.id);

  // Insert new skills
  const skillsToInsert = skills.map((skill) => ({
    user_id: user.id,
    skill_id: skill.skill_id,
    proficiency_level: skill.proficiency_level || null,
    years_of_experience: skill.years_of_experience || null,
  }));

  const { error } = await supabase.from("user_skills").insert(skillsToInsert);

  if (error) {
    console.error("Error updating skills:", error);
    return { error: "Failed to update skills" };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

// Add or update portfolio items
export async function updatePortfolioItems(items: PortfolioItemInput[]) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (items.length < 2) {
    return { error: "At least 2 portfolio items are required" };
  }

  // Delete existing portfolio items
  await supabase.from("portfolio_items").delete().eq("user_id", user.id);

  // Insert new portfolio items
  const itemsToInsert = items.map((item, index) => ({
    user_id: user.id,
    title: item.title,
    description: item.description || null,
    url: item.url,
    project_type: item.project_type || null,
    tags: item.tags || null,
    is_featured: item.is_featured,
    display_order: index,
  }));

  const { error } = await supabase.from("portfolio_items").insert(itemsToInsert);

  if (error) {
    console.error("Error updating portfolio:", error);
    return { error: "Failed to update portfolio items" };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

// Delete a portfolio item
export async function deletePortfolioItem(itemId: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting portfolio item:", error);
    return { error: "Failed to delete portfolio item" };
  }

  revalidatePath("/dashboard/profile");
  return { success: true };
}

// Get all available skills for the skills selector
export async function getAllSkills() {
  const supabase = createServerSupabaseClient();

  const { data: skills, error } = await supabase
    .from("skills")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching skills:", error);
    return { skills: [] };
  }

  return { skills: skills || [] };
}

// Create a new skill (for admin or if users can add custom skills)
export async function createSkill(name: string, category?: string) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("skills")
    .insert({
      name,
      category: category || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating skill:", error);
    return { error: "Failed to create skill" };
  }

  return { skill: data };
}
