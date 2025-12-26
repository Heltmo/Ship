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

  // Get threads with match info and last message
  const { data: threads } = await supabase
    .from("threads")
    .select(
      `
      id,
      match_id,
      last_message_at,
      created_at,
      matches (
        id,
        match_type,
        user_a_id,
        user_b_id
      )
    `
    )
    .in("id", threadIds)
    .order("last_message_at", { ascending: false });

  if (!threads) {
    return { threads: [] };
  }

  // For each thread, get the other participant's info and last message
  const enrichedThreads = await Promise.all(
    threads.map(async (thread: any) => {
      // Get the other user in the match
      const match = thread.matches;
      const otherUserId =
        match.user_a_id === user.id ? match.user_b_id : match.user_a_id;

      const { data: otherUser } = await supabase
        .from("users_profile")
        .select("id, full_name, headline, avatar_url")
        .eq("id", otherUserId)
        .single();

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
        matchId: thread.match_id,
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

  // Get thread info to find the other user
  const { data: thread } = await supabase
    .from("threads")
    .select(
      `
      matches (
        user_a_id,
        user_b_id
      )
    `
    )
    .eq("id", threadId)
    .single();

  let otherUser = null;
  if (thread?.matches) {
    const match = thread.matches as any;
    const otherUserId =
      match.user_a_id === user.id ? match.user_b_id : match.user_a_id;

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
      content: content,
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
