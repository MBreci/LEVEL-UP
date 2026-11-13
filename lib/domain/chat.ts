import type { SupabaseClient } from "@supabase/supabase-js";

export interface MatchMessage {
  id: string | number;
  sender_id: string;
  sender_name: string;
  text: string;
  created_at: string;
}

export async function getMatchMessages(sb: SupabaseClient, matchId: string, requesterId: string): Promise<MatchMessage[]> {
  const { data, error } = await sb.rpc("get_match_messages", { p_match_id: matchId, p_requester_id: requesterId });
  if (error || !data) return [];
  return data as MatchMessage[];
}

export async function postMatchMessage(sb: SupabaseClient, matchId: string, senderId: string, senderName: string, text: string): Promise<boolean> {
  const { data } = await sb.rpc("post_match_message", {
    p_match_id: matchId,
    p_sender_id: senderId,
    p_sender_name: senderName,
    p_text: text,
  });
  return !!data;
}
