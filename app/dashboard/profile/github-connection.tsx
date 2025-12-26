"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

type GitHubConnectionProps = {
  connected: boolean;
  identity: {
    username: string;
    profile_url: string;
    connected_at: string;
  } | null;
};

export function GitHubConnection({ connected, identity }: GitHubConnectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>GitHub Connection</CardTitle>
            <CardDescription>
              GitHub verifies your work and powers discovery
            </CardDescription>
          </div>
          {connected && (
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30">
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {connected && identity ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-white/10 rounded-lg">
              <div>
                <p className="font-medium">@{identity.username}</p>
                <p className="text-sm text-slate-400">
                  Connected {new Date(identity.connected_at).toLocaleDateString()}
                </p>
              </div>
              <a
                href={identity.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-300 hover:text-orange-200"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/profile/connect-github" className="flex-1">
                <Button variant="default" className="w-full">
                  Import Repositories
                </Button>
              </Link>
              <Link href="/api/auth/github/start" className="flex-1">
                <Button variant="outline" className="w-full">
                  Sync Profile
                </Button>
              </Link>
            </div>
            <p className="text-xs text-slate-400">
              Import at least 2 repos to unlock likes and show up in People.
            </p>
            <p className="text-xs text-slate-400">
              Use "Sync Profile" to update your name, bio, and avatar from GitHub
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-slate-400 mb-4">
              Connect your GitHub account to import public repositories as proof of work.
            </p>
            <Link href="/api/auth/github/start">
              <Button>Connect GitHub</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
