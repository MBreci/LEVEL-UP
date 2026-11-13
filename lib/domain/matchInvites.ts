import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeviceMatchInvite } from "@/types/match";

interface MatchInviteRow {
  id: string;
  match_id: string;
  zona: string;
  fecha: string;
  from_id: string;
  from_name: string;
  to_id: string;
  to_name: string;
  status: DeviceMatchInvite["status"];
}

export function matchInviteToRow(i: DeviceMatchInvite): Record<string, unknown> {
  return { id: i.id, match_id: i.matchId, zona: i.zona, fecha: i.fecha, from_id: i.fromId, from_name: i.fromName, to_id: i.toId, to_name: i.toName, status: i.status };
}

export function rowToMatchInvite(r: MatchInviteRow): DeviceMatchInvite {
  return { id: r.id, matchId: r.match_id, zona: r.zona, fecha: r.fecha, fromId: r.from_id, fromName: r.from_name, toId: r.to_id, toName: r.to_name, status: r.status };
}

export async function pushMatchInviteToCloud(sb: SupabaseClient, i: DeviceMatchInvite): Promise<void> {
  const { error } = await sb.from("match_invites").upsert(matchInviteToRow(i));
  if (error) console.error("Error guardando invitación de partido en la nube:", error.message);
}

export async function fetchMatchInvitesFromCloud(sb: SupabaseClient): Promise<DeviceMatchInvite[] | null> {
  const { data, error } = await sb.from("match_invites").select("*");
  if (error || !data) return null;
  return (data as unknown as MatchInviteRow[]).map(rowToMatchInvite);
}
