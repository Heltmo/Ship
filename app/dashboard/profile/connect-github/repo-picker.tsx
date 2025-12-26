"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { importGitHubRepos } from "./actions";
import { Loader2, Star, GitBranch, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

type Repo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
  topics: string[];
};

interface RepoPickerProps {
  repos: Repo[];
}

export function RepoPicker({ repos }: RepoPickerProps) {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const toggleRepo = (repoId: number) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      if (newSelected.size >= 3) {
        setError("You can only select up to 3 repositories");
        return;
      }
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
    setError(null);
  };

  const handleImport = () => {
    if (selectedRepos.size === 0) {
      setError("Please select at least one repository");
      return;
    }

    const reposToImport = repos.filter((repo) => selectedRepos.has(repo.id));

    startTransition(async () => {
      const result = await importGitHubRepos(reposToImport);

      if (result.error) {
        setError(result.error);
        setSuccess(null);
      } else {
        setSuccess(result.message || "Successfully imported repositories!");
        setError(null);
        // Redirect to profile after a short delay
        setTimeout(() => {
          router.push("/dashboard/profile?tab=portfolio");
        }, 2000);
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (repos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-400">
            No public repositories found. Create some repos on GitHub first!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Card className="border-orange-500/40 bg-orange-500/10">
          <CardContent className="py-3">
            <p className="text-sm text-orange-200">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="py-3">
            <p className="text-sm text-emerald-200">{success}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Select repositories to import
          </h3>
          <p className="text-sm text-slate-400">
            Choose up to 3 repositories to add to your portfolio. Pick 2+ to unlock likes.
          </p>
        </div>
        <div className="text-sm text-slate-400">
          {selectedRepos.size}/3 selected
        </div>
      </div>

      <div className="space-y-3">
        {repos.map((repo) => {
          const isSelected = selectedRepos.has(repo.id);

          return (
            <Card
              key={repo.id}
              className={`cursor-pointer transition-colors ${
                isSelected ? "border-orange-500/50 bg-orange-500/10" : "hover:border-orange-500/40"
              }`}
              onClick={() => toggleRepo(repo.id)}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRepo(repo.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-100 truncate">
                        {repo.name}
                      </h4>
                      {repo.language && (
                        <Badge variant="outline" className="text-xs">
                          {repo.language}
                        </Badge>
                      )}
                    </div>

                    {repo.description && (
                      <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                        {repo.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {repo.stargazers_count}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Updated {formatDate(repo.pushed_at)}
                      </div>
                    </div>

                    {repo.topics.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {repo.topics.slice(0, 5).map((topic) => (
                          <Badge
                            key={topic}
                            variant="outline"
                            className="text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleImport}
          disabled={isPending || selectedRepos.size === 0}
          className="flex-1"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <GitBranch className="mr-2 h-4 w-4" />
              Import {selectedRepos.size}{" "}
              {selectedRepos.size === 1 ? "Repository" : "Repositories"}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/profile")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
