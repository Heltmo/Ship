import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { fetchGitHubRepos, getGitHubConnectionStatus } from "./actions";
import { RepoPicker } from "./repo-picker";
import Link from "next/link";

export default async function ConnectGitHubPage() {
  const { connected, identity } = await getGitHubConnectionStatus();

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Connect GitHub</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-400">
              Connect your GitHub account to import repositories as proof of work
              and appear in the People feed.
            </p>
            <Link href="/api/auth/github/start">
              <Button className="w-full">
                <Github className="mr-2 h-5 w-5" />
                Connect GitHub Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch repos
  const result = await fetchGitHubRepos();

  if (result.error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-orange-500/40 bg-orange-500/10">
          <CardContent className="py-12 text-center">
            <p className="text-orange-200 mb-4">{result.error}</p>
            <Link href="/api/auth/github/start">
              <Button>
                <Github className="mr-2 h-5 w-5" />
                Reconnect GitHub
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import GitHub Repositories</h1>
        <p className="text-sm text-slate-400 mt-1">
          Connected as{" "}
          <a
            href={identity?.profile_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-300 hover:underline"
          >
            @{identity?.username}
          </a>
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Pick at least 2 repos to unlock likes and appear in People.
        </p>
      </div>

      <RepoPicker repos={result.repos || []} />
    </div>
  );
}
