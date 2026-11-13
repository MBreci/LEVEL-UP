import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewProfileInput, Profile, PlayerAttrs, PlayerPhysical } from "@/types/profile";
import { withTimeout } from "@/lib/withTimeout";

export interface ProfileRow {
  id: string;
  name: string;
  nickname: string | null;
  email?: string | null;
  gender: string | null;
  position: string;
  team: string;
  photo: string | null;
  photo_full?: string | null;
  password_hash?: string;
  security_question?: string | null;
  security_answer_hash?: string | null;
  ovr: number;
  xp: number;
  lp: number;
  last_update: Profile["lastUpdate"];
  matches: number;
  goals: number;
  assists: number;
  mvps: number;
  attrs: PlayerAttrs | null;
  history: Profile["history"] | null;
  notifications: Profile["notifications"] | null;
  physical: PlayerPhysical | null;
  notif_seen_count: number | null;
  achievements: string[] | null;
  pending_reveal: unknown | null;
  dorsal: number | null;
  saldo: number | null;
  is_admin: boolean | null;
  founder: boolean | null;
  community_ratings: Record<string, { sum: number; count: number }> | null;
  rated_players: Record<string, number> | null;
}

const DEFAULT_ATTRS: PlayerAttrs = { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, fis: 60 };
const DEFAULT_PHYSICAL: PlayerPhysical = { weight: null, height: null, age: null, foot: null };

/**
 * Columnas del perfil SIN la foto (base64, muy pesada) — el sync masivo nunca
 * trae fotos, se cargan bajo demanda al ver una carta. Tampoco incluye
 * password_hash/security_answer_hash/email: nunca se exponen por select
 * masivo, solo por las funciones seguras (login/reset).
 */
export const PROFILE_SYNC_COLS =
  "id,name,nickname,gender,position,team,ovr,xp,lp,last_update,matches,goals,assists,mvps,attrs,history,notifications,physical,notif_seen_count,achievements,pending_reveal,dorsal,saldo,is_admin,founder,community_ratings,rated_players";

export function profileToRow(p: Profile): Record<string, unknown> {
  return {
    id: p.id, name: p.name, nickname: p.nickname, gender: p.gender || null, position: p.position, team: p.team,
    photo: p.photo, photo_full: p.photoFull,
    ovr: p.ovr, xp: p.xp, lp: p.lp,
    last_update: p.lastUpdate, matches: p.matches, goals: p.goals, assists: p.assists, mvps: p.mvps,
    attrs: p.attrs, history: p.history, notifications: p.notifications, physical: p.physical,
    notif_seen_count: p.notifSeenCount || 0, achievements: p.achievements || [], pending_reveal: p.pendingReveal || null,
    dorsal: p.dorsal === 0 || p.dorsal ? p.dorsal : null,
    community_ratings: p.communityRatings || {}, rated_players: p.ratedPlayers || {},
    // is_admin, saldo, email, founder y las credenciales NO se incluyen a propósito:
    // son columnas protegidas y el trigger del servidor rechaza cualquier escritura
    // de ellas desde el frontend, incluso mandando el mismo valor.
  };
}

export function rowToProfile(r: ProfileRow): Profile {
  return {
    id: r.id, name: r.name, nickname: r.nickname ?? "", email: r.email ?? null, gender: (r.gender as Profile["gender"]) ?? null,
    position: r.position as Profile["position"], team: r.team,
    photo: r.photo, photoFull: r.photo_full ?? null, passwordHash: r.password_hash ?? "",
    securityQuestion: r.security_question ?? null,
    securityAnswerHash: r.security_answer_hash ?? null,
    ovr: r.ovr, xp: r.xp, lp: r.lp,
    lastUpdate: r.last_update ?? null, matches: r.matches || 0, goals: r.goals || 0, assists: r.assists || 0, mvps: r.mvps || 0,
    attrs: r.attrs || DEFAULT_ATTRS,
    history: r.history || [], notifications: r.notifications || [],
    physical: r.physical || DEFAULT_PHYSICAL,
    notifSeenCount: r.notif_seen_count || 0, achievements: r.achievements || [], pendingReveal: r.pending_reveal || null,
    dorsal: r.dorsal === 0 || r.dorsal ? r.dorsal : null,
    saldo: r.saldo || 0,
    isAdmin: r.is_admin || false,
    founder: r.founder ?? undefined,
    communityRatings: r.community_ratings || {}, ratedPlayers: r.rated_players || {},
  };
}

export function makeProfile(input: NewProfileInput): Profile {
  return {
    id: "p_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    name: input.name.toUpperCase(),
    nickname: input.nickname ? input.nickname.toUpperCase() : "",
    email: input.email ? input.email.trim().toLowerCase() : null,
    gender: input.gender || null,
    position: input.position,
    team: input.team || "SIN EQUIPO",
    photo: null,
    passwordHash: input.passwordHash,
    securityQuestion: input.securityQuestion || null,
    securityAnswerHash: input.securityAnswerHash || null,
    ovr: 60,
    xp: 0,
    lp: 0,
    lastUpdate: null,
    matches: 0,
    goals: 0,
    assists: 0,
    mvps: 0,
    attrs: { ...DEFAULT_ATTRS },
    physical: { ...DEFAULT_PHYSICAL },
    history: [],
    notifications: [
      { icon: "👋", text: "Bienvenido a LEVEL UP. Juega tu primer partido para activar tu carta.", time: "AHORA" },
    ],
    notifSeenCount: 0,
    achievements: [],
    saldo: 0,
    pendingReveal: null,
    dorsal: null,
    isAdmin: input.isAdmin || false,
  };
}

/**
 * Rellena campos que toda carta debe tener. Un perfil sin estos (escritura
 * local a medias en un WebView, esquema viejo, sync parcial) hacía que la
 * interfaz completa se congelara con un perfil incompleto — con esto se
 * repara en vez de romper.
 */
export function normalizeProfile(p: Profile): Profile {
  if (!p || typeof p !== "object") return p;
  if (!Array.isArray(p.notifications)) p.notifications = [];
  if (!Array.isArray(p.history)) p.history = [];
  if (!Array.isArray(p.achievements)) p.achievements = [];
  if (typeof p.notifSeenCount !== "number") p.notifSeenCount = 0;
  if (!p.attrs || typeof p.attrs !== "object") p.attrs = { ...DEFAULT_ATTRS };
  if (!p.physical || typeof p.physical !== "object") p.physical = { ...DEFAULT_PHYSICAL };
  return p;
}

/** Acceso a Rey del Barrio y Torneos. */
export function isFounder(profile: Profile | null): boolean {
  return !!(profile && profile.founder);
}

/** Jugador nuevo con acceso restringido (founder===false explícito; undefined = aún no sincronizado, no se restringe). */
export function isRestrictedPlayer(profile: Profile | null): boolean {
  return !!(profile && profile.founder === false);
}

export async function pushProfileToCloud(sb: SupabaseClient, p: Profile): Promise<{ error: unknown }> {
  const row = profileToRow(p);
  let error: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await withTimeout(sb.from("profiles").upsert(row), 8000, "push-profile");
      error = res.error;
    } catch (e) {
      error = e;
    }
    if (!error) return { error: null };
    const msg = (error as { message?: string })?.message || "";
    if (/duplicate key|unique|violates|constraint|protegido/i.test(msg)) break;
    if (attempt < 2) await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
  }
  if (error) console.error("Error guardando perfil en la nube:", error);
  return { error };
}

/**
 * Escribe SOLO las credenciales (password + pregunta de seguridad) con un
 * UPDATE dirigido. profileToRow no las incluye, así que ninguna sincronización
 * normal puede pisar la contraseña con datos viejos de otro dispositivo.
 */
export async function pushCredentialsToCloud(
  sb: SupabaseClient,
  p: Pick<Profile, "id" | "passwordHash" | "securityQuestion" | "securityAnswerHash">
): Promise<{ error: unknown }> {
  const { error } = await sb
    .from("profiles")
    .update({
      password_hash: p.passwordHash,
      security_question: p.securityQuestion || null,
      security_answer_hash: p.securityAnswerHash || null,
    })
    .eq("id", p.id);
  if (error) console.error("Error guardando credenciales en la nube:", error.message);
  return { error };
}

/** Alta completa (incluye credenciales) — INSERT, no upsert: anon no puede leer columnas protegidas. */
export async function createProfileInCloud(sb: SupabaseClient, p: Profile): Promise<{ error: unknown }> {
  const row = {
    ...profileToRow(p),
    email: p.email || null,
    password_hash: p.passwordHash,
    security_question: p.securityQuestion || null,
    security_answer_hash: p.securityAnswerHash || null,
  };
  let error: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await withTimeout(sb.from("profiles").insert(row), 8000, "insert");
      error = res.error;
    } catch (e) {
      error = e;
    }
    if (!error) return { error: null };
    const msg = (error as { message?: string })?.message || "";
    if (/duplicate key|unique|violates|constraint/i.test(msg)) break;
    if (attempt < 1) await new Promise((r) => setTimeout(r, 700));
  }
  if (error) console.error("Error creando perfil en la nube:", error);
  return { error };
}

export async function deleteProfileFromCloud(sb: SupabaseClient, id: string): Promise<void> {
  const { error } = await sb.from("profiles").delete().eq("id", id);
  if (error) console.error("Error borrando perfil en la nube:", error.message);
}

export async function fetchProfilesFromCloud(sb: SupabaseClient): Promise<ProfileRow[] | null> {
  const { data, error } = await sb.from("profiles").select(PROFILE_SYNC_COLS);
  if (error || !data) {
    console.error("Error sincronizando perfiles:", error?.message);
    return null;
  }
  return data as unknown as ProfileRow[];
}

export async function fetchPlayerProfileFromCloud(sb: SupabaseClient, id: string): Promise<ProfileRow | null> {
  const { data } = await sb.from("profiles").select(PROFILE_SYNC_COLS + ",photo").eq("id", id).single();
  return (data as unknown as ProfileRow) || null;
}

export async function fetchTotalPlayersFromCloud(sb: SupabaseClient): Promise<number | null> {
  const { count } = await sb.from("profiles").select("id", { count: "exact", head: true });
  return typeof count === "number" && count >= 0 ? count : null;
}
