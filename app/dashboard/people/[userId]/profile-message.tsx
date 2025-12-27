"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { startThreadWithUser } from "../actions";

type ProfileMessageProps = {
  targetUserId: string;
  allowMessages?: boolean | null;
};

export function ProfileMessage({ targetUserId, allowMessages }: ProfileMessageProps) {
  const router = useRouter();
  const [isComposing, setIsComposing] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canMessage = allowMessages !== false;

  const handleStartMessage = () => {
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
      const result = await startThreadWithUser(targetUserId, content);

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

  if (!isComposing) {
    return (
      <Button size="sm" onClick={handleStartMessage} disabled={isPending || !canMessage}>
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="mr-1.5 h-4 w-4" />
            {canMessage ? "Message" : "DMs off"}
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-2">
      <Textarea
        value={messageDraft}
        onChange={(e) => setMessageDraft(e.target.value)}
        placeholder="Write a quick intro..."
        className="min-h-[90px]"
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
  );
}
