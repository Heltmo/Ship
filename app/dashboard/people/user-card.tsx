"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { likeUser, passUser, saveUser } from "./actions";
import { Heart, X, Bookmark, Loader2, MessageCircle, Lock } from "lucide-react";
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
    github_url: string | null;
    linkedin_url: string | null;
    portfolioCount: number;
  };
  initialAction?: string | null;
  viewerEligible: boolean;
};

export function UserCard({ user, initialAction, viewerEligible }: UserCardProps) {
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<string | null>(initialAction || null);
  const [showMatchMessage, setShowMatchMessage] = useState(false);
  const [matchInfo, setMatchInfo] = useState<{ matchId?: string; threadId?: string } | null>(null);

  const handleLike = () => {
    if (!viewerEligible) return; // Extra safety check

    startTransition(async () => {
      const result = await likeUser(user.id);

      if (result.error) {
        // Handle errors (LIKES_LOCKED, etc.)
        console.error("Like error:", result.error);
        return;
      }

      if (result.success) {
        setAction("like");

        // Show match message if it's a mutual match
        if (result.matched) {
          setShowMatchMessage(true);
          setMatchInfo({
            matchId: result.matchId,
            threadId: result.threadId,
          });
          setTimeout(() => {
            setShowMatchMessage(false);
          }, 5000);
        }
      }
    });
  };

  const handlePass = () => {
    startTransition(async () => {
      const result = await passUser(user.id);

      if (result.success) {
        setAction("pass");
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveUser(user.id);

      if (result.success) {
        setAction("save");
      }
    });
  };

  // If user has already been liked/passed, show different UI
  if (action === "pass") {
    return null; // Don't show passed users
  }

  if (action === "like" && showMatchMessage) {
    return (
      <Card className="border-orange-500/40 bg-orange-500/10">
        <CardContent className="py-8 text-center space-y-3">
          <MessageCircle className="h-12 w-12 text-orange-300 mx-auto" />
          <h3 className="font-semibold text-orange-200">It's a match!</h3>
          <p className="text-sm text-orange-200/80">
            You and {user.full_name || "this user"} liked each other. Check your Inbox to start chatting.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:border-orange-500/40 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{user.full_name || "Anonymous"}</CardTitle>
            {user.headline && (
              <CardDescription className="mt-1">{user.headline}</CardDescription>
            )}
          </div>
          {action === "save" && (
            <Badge variant="outline" className="ml-2">
              Saved
            </Badge>
          )}
          {action === "like" && (
            <Badge variant="accent" className="ml-2">
              Liked
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
        </div>

        <div className="flex gap-2 text-xs text-slate-400">
          <Badge variant="outline">Proof: {user.portfolioCount} repos</Badge>
        </div>

        {!action && (
          <div className="flex gap-2 pt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <Button
                      size="sm"
                      onClick={handleLike}
                      disabled={isPending || !viewerEligible}
                      className="w-full"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : !viewerEligible ? (
                        <>
                          <Lock className="mr-1.5 h-4 w-4" />
                          Like
                        </>
                      ) : (
                        <>
                          <Heart className="mr-1.5 h-4 w-4" />
                          Like
                        </>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!viewerEligible && (
                  <TooltipContent>
                    <p>Connect GitHub and import 2 repos to unlock likes</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePass}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={isPending}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        )}

        {action === "like" && (
          <div className="pt-2 text-xs text-slate-400 text-center">
            Waiting for {user.full_name?.split(" ")[0] || "them"} to like you back...
          </div>
        )}

        {(user.github_url || user.linkedin_url) && (
          <div className="flex gap-2 pt-2 text-xs">
            {user.github_url && (
              <a
                href={user.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-orange-200 underline"
              >
                GitHub
              </a>
            )}
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
