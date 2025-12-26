import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { UserCard } from "./user-card";
import { getUserInteractions, getViewerEligibility, getFeedPeople } from "./actions";
import { LikesLockedBanner } from "@/components/likes-locked-banner";

type FeedUser = {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  portfolio_count: number;
};

export default async function PeoplePage() {
  // Get viewer's eligibility status
  const viewerEligibility = await getViewerEligibility();

  if (!viewerEligibility) {
    redirect("/login");
  }

  // Get feed of eligible users
  const { users } = await getFeedPeople(50, 0);

  // Get user's existing interactions to show action state
  const { interactions } = await getUserInteractions();
  const interactionMap = new Map(
    interactions.map((i: any) => [i.target_id, i.action])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">People</h1>
        <p className="text-sm text-slate-400 mt-1">
          Browse builders. Like to match, pass to skip, save to revisit.
        </p>
      </div>

      {/* Show eligibility banner if user is not eligible */}
      <LikesLockedBanner eligibility={viewerEligibility} />

      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">
              No profiles yet. Check back later or connect GitHub and add 2 repos to appear in the feed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((user: FeedUser) => (
            <UserCard
              key={user.id}
              user={{
                id: user.id,
                full_name: user.full_name,
                headline: user.headline,
                bio: user.bio,
                location: user.location,
                github_url: user.github_url,
                linkedin_url: user.linkedin_url,
                portfolioCount: Number(user.portfolio_count || 0),
              }}
              initialAction={interactionMap.get(user.id) || null}
              viewerEligible={viewerEligibility.isEligible}
            />
          ))}
        </div>
      )}
    </div>
  );
}
