"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { startThreadWithUser } from "./actions";
import { Loader2, Send } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type UserCardProps = {
  user: {
    id: string;
    full_name: string | null;
    headline: string | null;
    bio: string | null;
    location: string | null;
    timezone?: string | null;
    availabilityHoursPerWeek?: number | null;
    workBestMode?: string[] | null;
    iterationStyle?: string | null;
    stackFocus?: string[] | null;
    wantToBuildNext?: string | null;
    github_url: string | null;
    linkedin_url: string | null;
    portfolioCount: number;
    allowMessages?: boolean | null;
    matchScore?: number; // Match compatibility score (0-100)
    matchStrength?: string; // 'strong' | 'medium' | 'wildcard'
  };
  isSelf?: boolean;
};

export function UserCard({ user, isSelf = false }: UserCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isComposing, setIsComposing] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);

  const stackLabels: Record<string, string> = {
    web: "Web",
    mobile: "Mobile",
    ai: "AI/ML",
    game: "Game",
    backend: "Backend",
    tooling: "Dev Tools",
  };

  const workModeLabels: Record<string, string> = {
    solo_deep_work: "Solo deep work",
    pair_programming: "Pair programming",
    async_communication: "Async",
    real_time_collaboration: "Realtime",
  };

  const iterationLabels: Record<string, string> = {
    vibe_coder: "Vibe coder",
    regular_coder: "Regular coder",
  };

  const stackFocus = Array.isArray(user.stackFocus) ? user.stackFocus : [];
  const workBestMode = Array.isArray(user.workBestMode) ? user.workBestMode : [];
  const iterationStyleLabel = user.iterationStyle ? iterationLabels[user.iterationStyle] : null;
  const canMessage = user.allowMessages !== false;

  const handleStartMessage = () => {
    if (!canMessage) {
      return;
    }
    setIsComposing(true);
    setMessageError(null);
  };

  const handleCancelMessage = () => {
    setIsComposing(false);
    setMessageDraft("");
    setMessageError(null);
  };

  const handleSendMessage = () => {
    if (!messageDraft.trim()) {
      setMessageError("Write a quick intro before sending.");
      return;
    }

    const content = messageDraft.trim();
    startTransition(async () => {
      const result = await startThreadWithUser(user.id, content);

      if (result.error) {
        setMessageError(
          result.error === "TARGET_MESSAGES_DISABLED"
            ? "This user has DMs turned off."
            : "Could not start a chat. Try again."
        );
        return;
      }

      router.push(`/dashboard/inbox/${result.threadId}`);
    });
  };

  return (
    <Card className="hover:border-orange-500/40 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{user.full_name || "Anonymous"}</CardTitle>
              {user.matchStrength && (
                <Badge
                  variant={
                    user.matchStrength === "strong"
                      ? "default"
                      : user.matchStrength === "medium"
                      ? "accent"
                      : "outline"
                  }
                  className={
                    user.matchStrength === "strong"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : user.matchStrength === "medium"
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                      : "bg-slate-500/20 text-slate-300 border-slate-500/40"
                  }
                >
                  {user.matchStrength === "strong" && "🔥 Strong Match"}
                  {user.matchStrength === "medium" && "✨ Medium Match"}
                  {user.matchStrength === "wildcard" && "🎲 Wildcard"}
                </Badge>
              )}
            </div>
            {user.headline && (
              <CardDescription className="mt-1">{user.headline}</CardDescription>
            )}
          </div>
          {isSelf && (
            <Badge variant="outline" className="ml-2">
              You
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {user.bio && <p className="text-sm text-slate-400 line-clamp-2">{user.bio}</p>}

        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {user.location && (
            <span className="flex items-center gap-1">
              {user.location}
            </span>
          )}
          {user.timezone && (
            <span className="flex items-center gap-1">
              TZ: {user.timezone}
            </span>
          )}
          {user.availabilityHoursPerWeek && (
            <span className="flex items-center gap-1">
              {user.availabilityHoursPerWeek} hrs/wk
            </span>
          )}
        </div>

        {stackFocus.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {stackFocus.slice(0, 4).map((stack) => (
              <Badge key={stack} variant="outline">
                {stackLabels[stack] || stack}
              </Badge>
            ))}
          </div>
        )}

        {(workBestMode.length > 0 || iterationStyleLabel) && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            {iterationStyleLabel && (
              <Badge variant="outline">Style: {iterationStyleLabel}</Badge>
            )}
            {workBestMode.slice(0, 2).map((mode) => (
              <Badge key={mode} variant="outline">
                {workModeLabels[mode] || mode}
              </Badge>
            ))}
          </div>
        )}

        {user.wantToBuildNext && (
          <div className="text-xs text-slate-400 line-clamp-2">
            Wants to build: <span className="text-slate-200">{user.wantToBuildNext}</span>
          </div>
        )}

        <div className="flex gap-2 text-xs text-slate-400">
          <Badge variant="outline">Proof: {user.portfolioCount} repos</Badge>
          {!isSelf && !canMessage && (
            <Badge variant="outline">DMs off</Badge>
          )}
        </div>

        {!isSelf && !isComposing && (
          <div className="flex gap-2 pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <Button
                      size="sm"
                      onClick={handleStartMessage}
                      disabled={isPending || !canMessage}
                      className="w-full"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="mr-1.5 h-4 w-4" />
                          {canMessage ? "Message" : "DMs off"}
                        </>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send a short intro to start a chat</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {!isSelf && isComposing && (
          <div className="space-y-2 pt-2">
            <Textarea
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              placeholder="Write a quick intro..."
              className="min-h-[80px]"
              disabled={isPending}
            />
            {messageError && (
              <p className="text-xs text-orange-300">{messageError}</p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={isPending || !messageDraft.trim()}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelMessage}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isSelf && (
          <div className="pt-2 text-xs text-slate-400 text-center">
            This is your public card in People.
          </div>
        )}

        {(user.linkedin_url || user.id) && (
          <div className="flex gap-2 pt-2 text-xs">
            <Link
              href={`/dashboard/people/${user.id}`}
              className="text-slate-300 hover:text-orange-200 underline"
            >
              Profile
            </Link>
            {user.linkedin_url && (
              <a
                href={user.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-orange-200 underline"
              >
                LinkedIn
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
