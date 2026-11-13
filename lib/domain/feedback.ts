import type { SupabaseClient } from "@supabase/supabase-js";

export type FeedbackType = "bug" | "idea" | "comentario" | "torneo" | "canje";
export type FeedbackStatus = "nuevo" | "revisado" | "resuelto";

export interface FeedbackTicket {
  id: number;
  type: FeedbackType;
  message: string;
  status: FeedbackStatus;
  reporter_id: string | null;
  reporter_name: string | null;
  contact_email: string | null;
  page: string | null;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export interface SubmitFeedbackInput {
  type: FeedbackType;
  message: string;
  reporterId: string | null;
  reporterName: string | null;
  contact: string | null;
  page: string;
}

export async function submitFeedback(sb: SupabaseClient, input: SubmitFeedbackInput): Promise<void> {
  await sb.rpc("submit_feedback", {
    p_type: input.type,
    p_message: input.message,
    p_reporter_id: input.reporterId,
    p_reporter_name: input.reporterName,
    p_contact: input.contact,
    p_page: input.page,
    p_ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
  });
}

export async function fetchMyTickets(sb: SupabaseClient, reporterId: string): Promise<FeedbackTicket[]> {
  const { data, error } = await sb.rpc("my_feedback", { p_reporter_id: reporterId });
  if (error || !data) return [];
  return data as FeedbackTicket[];
}

export async function adminListFeedback(sb: SupabaseClient, adminId: string): Promise<FeedbackTicket[]> {
  const { data, error } = await sb.rpc("admin_list_feedback", { p_admin_id: adminId });
  if (error || !data) return [];
  return data as FeedbackTicket[];
}

export async function adminReplyFeedback(
  sb: SupabaseClient,
  adminId: string,
  feedbackId: number,
  reply: string | null,
  status: FeedbackStatus
): Promise<boolean> {
  const { data } = await sb.rpc("admin_reply_feedback", {
    p_admin_id: adminId,
    p_feedback_id: feedbackId,
    p_reply: reply,
    p_status: status,
  });
  return data === true;
}

export const FEEDBACK_TYPE_ICON: Record<string, string> = {
  bug: "🐛",
  idea: "💡",
  comentario: "💬",
  torneo: "🏆",
  canje: "🎁",
};

export const FEEDBACK_STATUS_LABEL: Record<string, string> = {
  nuevo: "ENVIADO",
  revisado: "RESPONDIDO",
  resuelto: "RESUELTO",
};
