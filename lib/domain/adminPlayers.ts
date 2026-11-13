import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/types/profile";

function foldAccents(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Puerto fiel de filterAdminPlayers/renderAdminPanel (app.js ~7840-7941):
 * substring único (no multi-término) sobre apodo+nombre+posición+equipo+
 * correo. El original solo hace .toLowerCase(); acá se pliegan acentos
 * también (case/acento-insensible) por pedido explícito del brief de Fase 5.
 */
export function adminPanelPlayerMatches(p: Profile, query: string): boolean {
  const q = foldAccents((query || "").trim());
  if (!q) return true;
  const haystack = foldAccents(`${p.nickname || ""} ${p.name || ""} ${p.position || ""} ${p.team || ""} ${p.email || ""}`.replace(/"/g, ""));
  return haystack.includes(q);
}

/** Puerto fiel del badge ✅/⚠️ de renderAdminPanel: foto + medidas completas. */
export function adminPlayerCompleteness(p: Profile): boolean {
  const ph = p.physical || { weight: null, height: null, age: null, foot: null };
  return !!p.photo && !!ph.weight && !!ph.height;
}

/**
 * Puerto fiel de openAdminPlayer (app.js ~8268-8282): la carta cacheada
 * localmente puede tener foto/photo_full desactualizada, así que el editor
 * admin siempre relee estas dos columnas directo de la nube al abrir.
 */
export async function fetchFreshPlayerPhotos(
  sb: SupabaseClient,
  profileId: string
): Promise<{ photo: string | null; photoFull: string | null }> {
  const { data } = await sb.from("profiles").select("photo,photo_full").eq("id", profileId).single();
  const row = data as { photo?: string | null; photo_full?: string | null } | null;
  return { photo: row?.photo ?? null, photoFull: row?.photo_full ?? null };
}

export type AdminPhotoKind = "card" | "full";

/**
 * Puerto fiel de previewAdminPhoto (app.js ~8340-8362): sube al bucket
 * player-photos con upsert:true, path players/{id}.ext o players/{id}-full.ext,
 * y devuelve la URL pública con cache-bust ?t=Date.now().
 */
export async function uploadAdminPlayerPhoto(
  sb: SupabaseClient,
  profileId: string,
  file: File,
  kind: AdminPhotoKind
): Promise<{ url: string | null; error: string | null }> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `players/${profileId}${kind === "full" ? "-full" : ""}.${ext}`;
  const { error } = await sb.storage.from("player-photos").upload(path, file, { upsert: true });
  if (error) return { url: null, error: error.message };
  const { data: urlData } = sb.storage.from("player-photos").getPublicUrl(path);
  return { url: urlData.publicUrl + "?t=" + Date.now(), error: null };
}

/**
 * is_admin es una columna protegida por trigger del servidor — nunca se
 * escribe por profileToRow/upsert normal. Puerto fiel de la llamada RPC en
 * saveAdminPlayer (app.js ~8392).
 */
export async function setIsAdminInCloud(
  sb: SupabaseClient,
  adminId: string,
  targetId: string,
  value: boolean
): Promise<{ error: unknown }> {
  const { error } = await sb.rpc("admin_set_is_admin", { p_admin_id: adminId, p_target_id: targetId, p_value: value });
  return { error };
}
