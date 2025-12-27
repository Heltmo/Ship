"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Get all threads for the current user
export async function getUserThreads() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { threads: [] };
  }

  // Get thread IDs where user is a participant
  const { data: participantRecords } = await supabase
    .from("thread_participants")
    .select("thread_id")
    .eq("user_id", user.id);

  if (!participantRecords || participantRecords.length === 0) {
    return { threads: [] };
  }

  const threadIds = participantRecords.map((p) => p.thread_id);

  // Get threads (match info is optional, use participants to resolve users)
  const { data: threads, error: threadsError } = await supabase
    .from("threads")
    .select("id, last_message_at, created_at")
    .in("id", threadIds)
    .order("last_message_at", { ascending: false });

  if (threadsError) {
    console.error("Error fetching threads:", threadsError);
  }

  if (!threads) {
    return { threads: [] };
  }

  // For each thread, get the other participant's info and last message
  const enrichedThreads = await Promise.all(
    threads.map(async (thread: any) => {
      // Resolve the other user via participants
      const { data: participants } = await supabase
        .from("thread_participants")
        .select("user_id")
        .eq("thread_id", thread.id)
        .neq("user_id", user.id)
        .limit(1);

      const otherUserId = participants?.[0]?.user_id || null;

      const { data: otherUser } = otherUserId
        ? await supabase
            .from("users_profile")
            .select("id, full_name, headline, avatar_url")
            .eq("id", otherUserId)
            .single()
        : { data: null };

      // Get last message
      const { data: lastMessage } = await supabase
        .from("messages")
        .select("content, created_at, sender_user_id")
        .eq("thread_id", thread.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Get unread count
      const { data: participant } = await supabase
        .from("thread_participants")
        .select("last_read_at")
        .eq("thread_id", thread.id)
        .eq("user_id", user.id)
        .single();

      let unreadCount = 0;
      if (participant?.last_read_at) {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("thread_id", thread.id)
          .gt("created_at", participant.last_read_at);

        unreadCount = count || 0;
      }

      return {
        id: thread.id,
        lastMessageAt: thread.last_message_at,
        otherUser,
        lastMessage,
        unreadCount,
      };
    })
  );

  return { threads: enrichedThreads };
}

// Get messages for a specific thread
export async function getThreadMessages(threadId: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { messages: [], otherUser: null };
  }

  // Verify user is a participant
  const { data: participant } = await supabase
    .from("thread_participants")
    .select("*")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .single();

  if (!participant) {
    return { error: "Not authorized to view this thread" };
  }

  // Get messages
  const { data: messages } = await supabase
    .from("messages")
    .select(
      `
      id,
      content,
      sender_user_id,
      created_at,
      is_edited,
      edited_at
    `
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  let otherUser = null;
  const { data: participants } = await supabase
    .from("thread_participants")
    .select("user_id")
    .eq("thread_id", threadId)
    .neq("user_id", user.id)
    .limit(1);

  const otherUserId = participants?.[0]?.user_id || null;

  if (otherUserId) {
    const { data: userData } = await supabase
      .from("users_profile")
      .select("id, full_name, headline, avatar_url")
      .eq("id", otherUserId)
      .single();

    otherUser = userData;
  }

  return { messages: messages || [], otherUser, threadId };
}

// Send a message
export async function sendMessage(threadId: string, content: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Validate message content
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { error: "Message cannot be empty" };
  }
  if (trimmedContent.length > 10000) {
    return { error: "Message too long (max 10,000 characters)" };
  }

  // Verify user is a participant
  const { data: participant } = await supabase
    .from("thread_participants")
    .select("*")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .single();

  if (!participant) {
    return { error: "Not authorized to send messages in this thread" };
  }

  // Insert message
  const { data: newMessage, error: messageError } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_user_id: user.id,
      content: trimmedContent,
    })
    .select()
    .single();

  if (messageError) {
    console.error("Error sending message:", messageError);
    return { error: "Failed to send message" };
  }

  // Update thread's last_message_at
  await supabase
    .from("threads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", threadId);

  revalidatePath(`/dashboard/inbox/${threadId}`);
  revalidatePath("/dashboard/inbox");

  return { success: true, message: newMessage };
}

// Mark thread as read
export async function markThreadAsRead(threadId: string) {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("thread_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error marking thread as read:", error);
    return { error: "Failed to mark thread as read" };
  }

  return { success: true };
}
