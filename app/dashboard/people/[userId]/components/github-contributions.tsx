"use client";

import { ActivityCalendar } from "react-activity-calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

type Props = {
  username: string;
  contributions: ContributionDay[] | null;
  totalContributions: number;
  error?: string | null;
};

export function GitHubContributions({ username, contributions, totalContributions, error }: Props) {
  if (error || !contributions) {
    return null; // Fail silently, don't break page
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>GitHub Activity</span>
          <span className="text-sm font-normal text-slate-400">
            {totalContributions.toLocaleString()} contributions in the last year
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <ActivityCalendar
            data={contributions}
            theme={{
              light: ["#0d1117", "#0e4429", "#006d32", "#26a641", "#39d353"],
              dark: ["#0d1117", "#0e4429", "#006d32", "#26a641", "#39d353"],
            }}
            colorScheme="dark"
            showWeekdayLabels
            labels={{
              totalCount: "{{count}} contributions in the last year",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
