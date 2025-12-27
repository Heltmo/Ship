import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { UserCard } from "./user-card";
import { getViewerEligibility, getFeedPeople } from "./actions";
import { RefreshPeopleButton } from "./refresh-button";

export const dynamic = "force-dynamic";

type FeedUser = {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  timezone?: string | null;
  availability_hours_per_week?: number | null;
  work_best_mode?: string[] | null;
  iteration_style?: string | null;
  stack_focus?: string[] | null;
  want_to_build_next?: string | null;
  allow_messages?: boolean | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_count: number;
  match_score?: number;
  match_strength?: string;
};

export default async function PeoplePage() {
  // Get viewer's eligibility status
  const viewerEligibility = await getViewerEligibility();

  if (!viewerEligibility) {
    redirect("/login");
  }
  if (!viewerEligibility.builderProfileComplete) {
    redirect("/find");
  }

  // Get feed of eligible users
  const { users, viewerId } = await getFeedPeople(50, 0);

  const seed = Math.floor(Date.now() / (5 * 60 * 1000));
  const others = users.filter((user: FeedUser) => user.id !== viewerId);
  const windowSize = 7;
  const rotationStart = others.length > 0 ? (seed * windowSize) % others.length : 0;
  const rotated = [
    ...others.slice(rotationStart),
    ...others.slice(0, rotationStart),
  ];
  const selected = rotated.slice(0, windowSize);
  const selfUser = users.find((user: FeedUser) => user.id === viewerId) || null;
  const visibleUsers = selfUser ? [selfUser, ...selected] : selected.slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Browse co-founders</h1>
        <p className="text-sm text-slate-400 mt-1">
          Meet a fresh batch every time you refresh. Message anyone who feels right.
        </p>
        <div className="mt-4">
          <RefreshPeopleButton />
        </div>
      </div>

      {visibleUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">
              No profiles yet. Check back later or connect GitHub and add 2 repos to appear in the feed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleUsers.map((user: FeedUser) => (
            <UserCard
              key={user.id}
              user={{
                id: user.id,
                full_name: user.full_name,
                headline: user.headline,
                bio: user.bio,
                location: user.location,
                timezone: user.timezone,
                availabilityHoursPerWeek: user.availability_hours_per_week,
                workBestMode: user.work_best_mode,
                iterationStyle: user.iteration_style,
                stackFocus: user.stack_focus,
                wantToBuildNext: user.want_to_build_next,
                allowMessages: user.allow_messages,
                github_url: user.github_url,
                linkedin_url: user.linkedin_url,
                portfolioCount: Number(user.portfolio_count || 0),
                matchScore: user.match_score,
                matchStrength: user.match_strength,
              }}
              isSelf={viewerId === user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
