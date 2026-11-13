import type { SupabaseClient } from "@supabase/supabase-js";
import type { CasualBet, MatchEstado, OpenMatch } from "@/types/match";

interface OpenMatchRow {
  id: string;
  creator_id: string;
  creator_name: string;
  zona: string;
  cancha: string | null;
  direccion: string | null;
  arena_id: string | null;
  formato: string;
  superficie: string | null;
  fecha: string;
  fecha_iso: string;
  hora_value: string;
  precio: number | null;
  ovr_min: number | null;
  valor_por_persona: number | null;
  observaciones: string | null;
  confirmados_prev: OpenMatch["confirmadosPrev"] | null;
  abierto: boolean;
  necesita: OpenMatch["necesita"] | null;
  join_requests: OpenMatch["joinRequests"] | null;
  finalizado: boolean;
  prioritario: boolean | null;
  casual_bet: CasualBet | null;
  genero: OpenMatch["genero"] | null;
  posiciones_buscadas: string[] | null;
  created_at: number;
  stats: Record<string, unknown> | null;
  notes: string | null;
}

export function matchToRow(m: OpenMatch): Record<string, unknown> {
  return {
    id: m.id, creator_id: m.creatorId, creator_name: m.creatorName, zona: m.zona, cancha: m.cancha,
    direccion: m.direccion, arena_id: m.arenaId, formato: m.formato, superficie: m.superficie,
    fecha: m.fecha, fecha_iso: m.fechaISO, hora_value: m.horaValue, precio: m.precio, ovr_min: m.ovrMin,
    valor_por_persona: m.valorPorPersona, observaciones: m.observaciones,
    confirmados_prev: m.confirmadosPrev,
    abierto: m.abierto, necesita: m.necesita, join_requests: m.joinRequests, finalizado: m.finalizado,
    prioritario: m.prioritario || false, casual_bet: m.casualBet || null, genero: m.genero || "MIXTO", posiciones_buscadas: m.posiciones || [],
    created_at: m.createdAt, stats: m.stats || {}, notes: m.notes || null,
  };
}

export function rowToMatch(r: OpenMatchRow): OpenMatch {
  return {
    id: r.id, creatorId: r.creator_id, creatorName: r.creator_name, zona: r.zona, cancha: r.cancha,
    direccion: r.direccion, arenaId: r.arena_id, formato: r.formato, superficie: r.superficie,
    fecha: r.fecha, fechaISO: r.fecha_iso, horaValue: r.hora_value, precio: r.precio, ovrMin: r.ovr_min,
    valorPorPersona: r.valor_por_persona, observaciones: r.observaciones,
    confirmadosPrev: r.confirmados_prev || [],
    abierto: r.abierto, necesita: r.necesita || [], joinRequests: r.join_requests || [], finalizado: r.finalizado,
    prioritario: r.prioritario || false, casualBet: r.casual_bet || null, genero: r.genero || "MIXTO", posiciones: r.posiciones_buscadas || [],
    createdAt: r.created_at, stats: r.stats || {}, notes: r.notes || "",
  };
}

export async function fetchOpenMatchesFromCloud(sb: SupabaseClient): Promise<OpenMatch[] | null> {
  const { data, error } = await sb.from("open_matches").select("*");
  if (error || !data) {
    console.error("Error sincronizando partidos:", error?.message);
    return null;
  }
  return (data as unknown as OpenMatchRow[]).map(rowToMatch);
}

export async function pushMatchToCloud(sb: SupabaseClient, m: OpenMatch): Promise<void> {
  const { error } = await sb.from("open_matches").upsert(matchToRow(m));
  if (error) console.error("Error guardando partido en la nube:", error.message);
}

/** Borrado por función segura: solo el creador puede borrar su partido. */
export async function deleteMatchFromCloud(sb: SupabaseClient, matchId: string, requesterId: string): Promise<void> {
  const { error } = await sb.rpc("delete_my_match", { p_match_id: matchId, p_requester_id: requesterId });
  if (error) console.error("Error borrando partido en la nube:", error.message);
}

export async function fetchMatchFromCloud(sb: SupabaseClient, matchId: string): Promise<OpenMatch | null> {
  const { data } = await sb.from("open_matches").select("*").eq("id", matchId).single();
  return data ? rowToMatch(data as unknown as OpenMatchRow) : null;
}

export function getTotalCupos(m: OpenMatch): number {
  return m.necesita.reduce((s, n) => s + n.cupos, 0);
}

export function getTotalUnidos(m: OpenMatch): number {
  return m.necesita.reduce((s, n) => s + n.unidos.length, 0);
}

export function matchDateTime(m: OpenMatch): Date {
  return new Date(`${m.fechaISO || "2026-01-01"}T${m.horaValue || "18:00"}:00`);
}

export function getMatchEstado(m: OpenMatch): MatchEstado {
  if (m.finalizado) return "finalizado";
  const dt = matchDateTime(m).getTime();
  const now = Date.now();
  if (now >= dt + 2 * 60 * 60 * 1000) return "finalizado";
  if (now >= dt) return "en_juego";
  const faltan = getTotalCupos(m) - getTotalUnidos(m);
  if (faltan <= 0) return "confirmado";
  if (faltan === 1) return "ultimos_cupos";
  return "buscando_jugadores";
}

export const ESTADO_INFO: Record<MatchEstado, { label: string; cls: string }> = {
  buscando_jugadores: { label: "BUSCANDO JUGADORES", cls: "estado-buscando" },
  ultimos_cupos: { label: "ÚLTIMOS CUPOS", cls: "estado-ultimos" },
  confirmado: { label: "CONFIRMADO", cls: "estado-confirmado" },
  en_juego: { label: "EN JUEGO", cls: "estado-enjuego" },
  finalizado: { label: "FINALIZADO", cls: "estado-finalizado" },
};

export function generoLabel(v: string | null | undefined): string {
  return ({ MASCULINO: "♂ MASCULINO", FEMENINO: "♀ FEMENINO", MIXTO: "⚧ MIXTO" } as Record<string, string>)[v || "MIXTO"] || "⚧ MIXTO";
}

export function casualBetLabel(v: string | null | undefined): string {
  return (
    ({
      cancha: "🏟️ El perdedor paga la cancha",
      bebida: "🍺 El perdedor paga la bebida",
      ambas: "🏟️🍺 El perdedor paga cancha + bebida",
    } as Record<string, string>)[v || ""] || ""
  );
}

const POS_BUSCADA_LABELS: Record<string, string> = {
  ARQUERO: "🧤 Arquero",
  DEFENSA: "🛡 Defensa",
  VOLANTE: "⚙ Volante",
  DELANTERO: "⚡ Delantero",
};

export function posBuscadasLabel(arr: string[] | null | undefined): string {
  return (arr || []).map((p) => POS_BUSCADA_LABELS[p] || p).join(", ");
}

/** Quita cualquier URL pegada (y sus paréntesis) para no mostrar el link crudo de Google Maps. */
export function cleanDireccionDisplay(d: string | null | undefined): string {
  if (!d) return "";
  return String(d)
    .replace(/\(?\s*https?:\/\/\S+\s*\)?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[·,\s]+$/, "")
    .trim();
}

/** Si la dirección trae un link se usa; si no, se arma una búsqueda de Google Maps. */
export function matchMapsUrl(m: Pick<OpenMatch, "direccion" | "cancha" | "zona">): string {
  const d = (m.direccion || "").trim();
  const urlMatch = d.match(/https?:\/\/\S+/i);
  if (urlMatch) return urlMatch[0].replace(/[)\s]+$/, "");
  const q = encodeURIComponent(cleanDireccionDisplay(d) || m.cancha || m.zona || "cancha");
  return "https://www.google.com/maps/search/?api=1&query=" + q;
}

export interface BpFilters {
  zona: string;
  cancha: string;
  fecha: string;
  formato: string;
  ovr: string;
  precio: string;
  cupos: boolean;
  abiertos: boolean;
  genero: string;
}

export const EMPTY_BP_FILTERS: BpFilters = {
  zona: "", cancha: "", fecha: "", formato: "", ovr: "", precio: "", cupos: false, abiertos: false, genero: "",
};

export function applyBpFilters(list: OpenMatch[], f: BpFilters): OpenMatch[] {
  return list.filter((m) => {
    if (f.zona && m.zona !== f.zona) return false;
    if (f.cancha && !(m.cancha || "").toLowerCase().includes(f.cancha.toLowerCase())) return false;
    if (f.fecha && m.fechaISO !== f.fecha) return false;
    if (f.formato && m.formato !== f.formato) return false;
    if (f.ovr && (m.ovrMin || 0) > parseInt(f.ovr, 10)) return false;
    if (f.precio && m.precio && parseInt(String(m.precio), 10) > parseInt(f.precio, 10)) return false;
    if (f.cupos && getTotalCupos(m) - getTotalUnidos(m) <= 0) return false;
    if (f.abiertos && m.abierto === false) return false;
    if (f.genero && (m.genero || "MIXTO") !== f.genero) return false;
    return true;
  });
}
