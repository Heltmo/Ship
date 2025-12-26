import { getProfile } from "./actions";
import { ProfileForm } from "./profile-form";
import { redirect } from "next/navigation";
import { GatingStatusCard } from "@/components/gating-status";
import { GitHubConnection } from "./github-connection";
import { getGitHubConnectionStatus } from "./connect-github/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const data = await getProfile();

  if (!data) {
    redirect("/login");
  }

  const { profile, gatingStatus } = data;

  // Get GitHub connection status
  const githubStatus = await getGitHubConnectionStatus();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-slate-400 mt-1">
            This is what others see. Connect GitHub and add 2 repos to appear in People.
          </p>
        </div>
        {profile?.id && (
          <Link href={`/dashboard/people/${profile.id}`}>
            <Button variant="outline" size="sm">
              View Public Profile
            </Button>
          </Link>
        )}
      </div>

      <GatingStatusCard status={gatingStatus} />

      <GitHubConnection
        connected={githubStatus.connected}
        identity={githubStatus.identity}
      />

      <ProfileForm profile={profile} />
    </div>
  );
}
