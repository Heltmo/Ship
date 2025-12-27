"use server";

type ContributionDay = {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

type ContributionData = {
  total: { [year: number]: number };
  contributions: ContributionDay[];
};

export async function fetchGitHubContributions(username: string) {
  try {
    const response = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${username}?y=last`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      return { error: "Failed to fetch contributions" };
    }

    const data: ContributionData = await response.json();
    return { data };
  } catch (error) {
    return { error: "Unable to load contribution data" };
  }
}
