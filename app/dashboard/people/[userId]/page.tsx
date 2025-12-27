import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Github, Linkedin, Twitter, Globe, Star } from "lucide-react";
import Link from "next/link";
import { ProfileMessage } from "./profile-message";
import { fetchGitHubContributions } from "./actions";
import { GitHubContributions } from "./components/github-contributions";

type ProfileData = {
  id: string;
  full_name: string | null;
  bio: string | null;
  location: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
  allow_messages?: boolean | null;
};

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: string;
  metadata: {
    github_id?: number;
    stars?: number;
    language?: string;
    topics?: string[];
  } | null;
};

async function getUserProfile(userId: string) {
  const supabase = createServerSupabaseClient();

  // Get current user (to check if they're viewing their own profile)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("users_profile")
    .select("id, full_name, bio, location, github_url, linkedin_url, twitter_url, website_url, avatar_url, allow_messages")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Get portfolio items (GitHub repos)
  const { data: portfolio } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Get GitHub identity
  const { data: githubIdentity } = await supabase
    .from("user_identities")
    .select("username, profile_url")
    .eq("user_id", userId)
    .eq("provider", "github")
    .single();

  // Get GitHub contributions if user has GitHub connected
  let contributionData = null;
  let contributionError = null;
  let totalContributions = 0;

  if (githubIdentity?.username) {
    const result = await fetchGitHubContributions(githubIdentity.username);
    if (result.data) {
      contributionData = result.data.contributions;
      totalContributions = Object.values(result.data.total).reduce((a, b) => a + b, 0);
    } else if (result.error) {
      contributionError = result.error;
    }
  }

  return {
    profile: profile as ProfileData,
    portfolio: (portfolio || []) as PortfolioItem[],
    githubIdentity,
    contributionData,
    contributionError,
    totalContributions,
    isOwnProfile: currentUser.id === userId,
  };
}

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
  const { profile, portfolio, githubIdentity, contributionData, contributionError, totalContributions, isOwnProfile } = await getUserProfile(params.userId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6">
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || "User"}
            width={120}
            height={120}
            className="rounded-full border-4 border-white/10 object-cover w-24 h-24 sm:w-[120px] sm:h-[120px]"
            loading="lazy"
          />
        )}
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{profile.full_name || "Anonymous Builder"}</h1>
              {githubIdentity && (
                <a
                  href={githubIdentity.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-orange-200 flex items-center gap-1 mt-1"
                >
                  <Github className="h-4 w-4" />
                  @{githubIdentity.username}
                </a>
              )}
            </div>
            <div className="flex items-start justify-start sm:justify-end">
              {isOwnProfile ? (
                <Link href="/dashboard/profile">
                  <Button variant="outline" size="sm">
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                <ProfileMessage targetUserId={profile.id} allowMessages={profile.allow_messages} />
              )}
            </div>
          </div>

          {profile.location && (
            <p className="text-slate-400 mt-2">{profile.location}</p>
          )}

          {profile.bio && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">About</div>
              <p className="text-slate-300 mt-2 whitespace-pre-line">{profile.bio}</p>
            </div>
          )}

          {/* Social Links */}
          <div className="flex gap-3 mt-4">
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-orange-200"
              >
                <Github className="h-5 w-5" />
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-orange-200"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            )}
            {profile.twitter_url && (
              <a
                href={profile.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-orange-200"
              >
                <Twitter className="h-5 w-5" />
              </a>
            )}
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-orange-200"
              >
                <Globe className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* GitHub Contributions */}
      {githubIdentity && (
        <GitHubContributions
          username={githubIdentity.username}
          contributions={contributionData}
          totalContributions={totalContributions}
          error={contributionError}
        />
      )}

      {/* Products / GitHub Repos */}
      <Card>
        <CardHeader>
          <CardTitle>Projects & Proof of Work</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolio.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No projects added yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-white/10 bg-slate-950/60 rounded-lg p-4 hover:border-orange-500/50 hover:shadow-[0_20px_50px_-35px_rgba(249,115,22,0.4)] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {item.type === "github_repo" && <Github className="h-4 w-4 text-slate-300" />}
                        {item.title}
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </h3>
                      {item.description && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata for GitHub repos */}
                  {item.type === "github_repo" && item.metadata && (
                    <div className="flex items-center gap-3 mt-3 text-sm text-slate-400">
                      {item.metadata.stars !== undefined && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {item.metadata.stars}
                        </div>
                      )}
                      {item.metadata.language && (
                        <Badge variant="outline" className="text-xs">
                          {item.metadata.language}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Topics */}
                  {item.type === "github_repo" && item.metadata?.topics && item.metadata.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.metadata.topics.slice(0, 3).map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
