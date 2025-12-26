import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type EligibilityStatus = {
  isEligible: boolean;
  hasGitHub: boolean;
  portfolioCount: number;
};

interface LikesLockedBannerProps {
  eligibility: EligibilityStatus;
}

export function LikesLockedBanner({ eligibility }: LikesLockedBannerProps) {
  // Don't show banner if user is eligible
  if (eligibility.isEligible) {
    return null;
  }

  const requirements = [
    {
      label: "GitHub connected",
      completed: eligibility.hasGitHub,
      progress: null,
    },
    {
      label: "At least 2 repos (projects)",
      completed: eligibility.portfolioCount >= 2,
      progress: `${eligibility.portfolioCount}/2`,
    },
  ];

  const completedCount = requirements.filter((r) => r.completed).length;

  return (
    <Card className="mb-6 border-orange-500/30 bg-orange-500/10">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Lock className="h-5 w-5 text-orange-300" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-200 mb-1">
              Likes Locked - Add proof of work to unlock
            </h3>
            <p className="text-sm text-orange-200/80 mb-3">
              Connect GitHub and import at least 2 repos to start liking people.
              You can still browse, pass, and save profiles.
            </p>

            <div className="space-y-2 mb-4">
              {requirements.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-sm"
                >
                  {req.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                  )}
                  <span
                    className={
                      req.completed ? "text-emerald-200" : "text-orange-200/80"
                    }
                  >
                    {req.label}
                    {req.progress && (
                      <span className="ml-1 font-medium">{req.progress}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-sm font-medium text-orange-200">
                {completedCount}/2 complete
              </div>
              {!eligibility.hasGitHub ? (
                <Link href="/api/auth/github/start">
                  <Button size="sm" variant="default">
                    Connect GitHub
                  </Button>
                </Link>
              ) : eligibility.portfolioCount < 2 ? (
                <Link href="/dashboard/profile/connect-github">
                  <Button size="sm" variant="default">
                    Import Repositories
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard/profile">
                  <Button size="sm" variant="default">
                    View Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
