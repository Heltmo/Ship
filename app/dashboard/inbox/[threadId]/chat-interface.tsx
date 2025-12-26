"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage } from "../actions";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Message = {
  id: string;
  content: string;
  sender_user_id: string | null;
  created_at: string;
  is_edited: boolean;
  edited_at: string | null;
};

type OtherUser = {
  id: string;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
};

interface ChatInterfaceProps {
  threadId: string;
  initialMessages: Message[];
  otherUser: OtherUser | null;
}

export function ChatInterface({
  threadId,
  initialMessages,
  otherUser,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create Supabase client for realtime
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Subscribe to new messages via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((current) => {
            // Avoid duplicates
            if (current.some((m) => m.id === newMsg.id)) {
              return current;
            }
            return [...current, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, supabase]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    setNewMessage("");

    startTransition(async () => {
      const result = await sendMessage(threadId, messageToSend);

      if (result.error) {
        // Show error, restore message
        setNewMessage(messageToSend);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/inbox">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <CardTitle className="text-base">
                {otherUser?.full_name || "Anonymous"}
              </CardTitle>
              {otherUser?.headline && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {otherUser.headline}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
            const isSystem = message.sender_user_id === null;
            const isCurrentUser =
              message.sender_user_id !== null && message.sender_user_id !== otherUser?.id;

            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} ${
                  isSystem ? "justify-center" : ""
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    isSystem
                      ? "bg-slate-950/80 text-slate-300 text-sm border border-white/10"
                      : isCurrentUser
                        ? "bg-orange-500 text-slate-950"
                        : "bg-white/10 text-slate-100"
                  }`}
                >
                  {isSystem && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium">SYS: system message</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      isCurrentUser ? "text-slate-900/70" : "text-slate-500"
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="border-t border-white/10 p-4">
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Press Enter to send - Shift+Enter for new line)"
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              disabled={isPending}
            />
            <Button
              onClick={handleSend}
              disabled={isPending || !newMessage.trim()}
              size="lg"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Press Enter to send - Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
}
