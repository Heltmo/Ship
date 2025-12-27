"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
  topics: string[];
  private: boolean;
  owner: {
    login: string;
  };
};

// Fetch user's GitHub repos using the temporary token
export async function fetchGitHubRepos() {
  const token = cookies().get("github_temp_token")?.value;

  if (!token) {
    return { error: "GitHub session expired. Please reconnect." };
  }

  try {
    const response = await fetch(
      "https://api.github.com/user/repos?type=owner&sort=updated&per_page=100",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const repos: GitHubRepo[] = await response.json();

    // Filter to only public repos and format for UI
    const publicRepos = repos
      .filter((repo) => !repo.private)
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        language: repo.language,
        pushed_at: repo.pushed_at,
        topics: repo.topics || [],
      }));

    return { repos: publicRepos };
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch repositories",
    };
  }
}

// Import selected GitHub repos into portfolio_items
export async function importGitHubRepos(
  selectedRepos: Array<{
    id: number;
    name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    language: string | null;
    pushed_at: string;
    topics: string[];
  }>
) {
  if (selectedRepos.length === 0) {
    return { error: "Please select at least one repository" };
  }

  if (selectedRepos.length > 3) {
    return { error: "You can only import up to 3 repositories at a time" };
  }

  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Prepare portfolio items
    const portfolioItems = selectedRepos.map((repo) => ({
      user_id: user.id,
      title: repo.name,
      description: repo.description || `GitHub repository: ${repo.name}`,
      url: repo.html_url,
      type: "github_repo",
      metadata: {
        github_id: repo.id,
        stars: repo.stargazers_count,
        language: repo.language,
        pushed_at: repo.pushed_at,
        topics: repo.topics,
      },
      is_featured: false,
    }));

    // Insert portfolio items (will skip duplicates due to unique constraint)
    const { data, error } = await supabase
      .from("portfolio_items")
      .insert(portfolioItems)
      .select();

    if (error) {
      // Check if it's a duplicate error
      if (error.code === "23505") {
        // Unique violation
        return {
          error: "One or more repositories have already been imported",
        };
      }
      throw error;
    }

    // Clear the temporary token cookie
    cookies().delete("github_temp_token");

    // Check if builder profile is complete
    const { data: profile } = await supabase
      .from("users_profile")
      .select("timezone, availability_hours_per_week, work_best_mode, iteration_style, stack_focus")
      .eq("id", user.id)
      .single();

    const needsOnboarding = !(
      profile?.timezone &&
      profile?.availability_hours_per_week &&
      profile?.work_best_mode &&
      (profile.work_best_mode as any[]).length > 0 &&
      profile?.iteration_style &&
      profile?.stack_focus &&
      (profile.stack_focus as any[]).length > 0
    );

    // Revalidate profile page
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/profile/builder-onboarding");

    return {
      success: true,
      imported: data?.length || 0,
      message: `Successfully imported ${data?.length || 0} ${
        data?.length === 1 ? "repository" : "repositories"
      }`,
      redirect: needsOnboarding ? "/find" : "/matches",
    };
  } catch (error) {
    console.error("Error importing GitHub repos:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to import repositories",
    };
  }
}

// Get GitHub connection status
export async function getGitHubConnectionStatus() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { connected: false };
  }

  const { data: identity } = await supabase
    .from("user_identities")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "github")
    .single();

  return {
    connected: !!identity,
    identity: identity || null,
  };
}

// Disconnect GitHub
export async function disconnectGitHub() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("user_identities")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "github");

  if (error) {
    return { error: "Failed to disconnect GitHub" };
  }

  revalidatePath("/dashboard/profile");

  return { success: true };
}
