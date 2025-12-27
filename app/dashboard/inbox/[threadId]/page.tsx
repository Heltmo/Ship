import { getThreadMessages, markThreadAsRead } from "../actions";
import { redirect } from "next/navigation";
import { ChatInterface } from "./chat-interface";

export default async function ThreadPage({
  params,
}: {
  params: { threadId: string };
}) {
  const { threadId } = params;
  const result = await getThreadMessages(threadId);

  if (result.error) {
    redirect("/dashboard/inbox");
  }

  // Mark thread as read
  await markThreadAsRead(threadId);

  return (
    <ChatInterface
      threadId={result.threadId!}
      initialMessages={result.messages || []}
      otherUser={result.otherUser || null}
    />
  );
}
