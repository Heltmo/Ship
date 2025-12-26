import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getUserThreads } from "./actions";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";

export default async function InboxPage() {
  const { threads } = await getUserThreads();

  if (!threads) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="text-sm text-slate-400 mt-1">
          Chats open after a mutual like in People
        </p>
      </div>

      {threads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">
              No conversations yet. Match with someone in the People feed to start chatting!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {threads.map((thread: any) => (
            <Link key={thread.id} href={`/dashboard/inbox/${thread.id}`}>
              <Card className="hover:border-orange-500/40 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {thread.otherUser?.full_name || "Anonymous"}
                      </CardTitle>
                      {thread.otherUser?.headline && (
                        <CardDescription className="mt-1 text-xs">
                          {thread.otherUser.headline}
                        </CardDescription>
                      )}
                    </div>
                    {thread.unreadCount > 0 && (
                      <Badge variant="accent" className="ml-2">
                        {thread.unreadCount} new
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {thread.lastMessage && (
                    <div className="space-y-1">
                      <p className="text-sm text-slate-400 line-clamp-1">
                        {thread.lastMessage.sender_user_id === null
                          ? "SYS"
                          : thread.lastMessage.sender_user_id
                        }: {thread.lastMessage.content}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(thread.lastMessage.created_at).toLocaleDateString()} at{" "}
                        {new Date(thread.lastMessage.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
