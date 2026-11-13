import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToProfile, type ProfileRow } from "@/lib/domain/profiles";
import { withTimeout } from "@/lib/withTimeout";
import type { Profile } from "@/types/profile";

/** Codifica un string a bytes UTF-8 sin depender de TextEncoder (falta en algunos WebView antiguos). */
function utf8Bytes(str: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") {
    try {
      return new TextEncoder().encode(str);
    } catch {
      /* cae al respaldo manual */
    }
  }
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c >= 0xd800 && c <= 0xdbff) {
      const c2 = str.charCodeAt(++i);
      const cp = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
      out.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f));
    } else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  return new Uint8Array(out);
}

// SHA-256 en JS puro. Respaldo para cuando crypto.subtle no está disponible
// (WebView in-app de WhatsApp/Instagram, contexto no seguro, etc.). Produce el
// MISMO hash que crypto.subtle, así el login funciona sin importar dónde se creó.
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256Hex(bytes: Uint8Array): string {
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a,
    h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const l = bytes.length, bitLen = l * 8;
  const withOne = l + 1;
  const k = (56 - (withOne % 64) + 64) % 64;
  const total = withOne + k + 8;
  const m = new Uint8Array(total);
  m.set(bytes);
  m[l] = 0x80;
  const hi = Math.floor(bitLen / 0x100000000), lo = bitLen >>> 0;
  m[total - 8] = (hi >>> 24) & 0xff; m[total - 7] = (hi >>> 16) & 0xff; m[total - 6] = (hi >>> 8) & 0xff; m[total - 5] = hi & 0xff;
  m[total - 4] = (lo >>> 24) & 0xff; m[total - 3] = (lo >>> 16) & 0xff; m[total - 2] = (lo >>> 8) & 0xff; m[total - 1] = lo & 0xff;
  const w = new Array<number>(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let i = 0; i < total; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = (m[i + 4 * t] << 24) | (m[i + 4 * t + 1] << 16) | (m[i + 4 * t + 2] << 8) | m[i + 4 * t + 3];
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, hh = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + S1 + ch + SHA256_K[t] + w[t]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      hh = g; g = f; f = e; e = (d + temp1) | 0; d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + hh) | 0;
  }
  const hx = (x: number) => ("00000000" + (x >>> 0).toString(16)).slice(-8);
  return hx(h0) + hx(h1) + hx(h2) + hx(h3) + hx(h4) + hx(h5) + hx(h6) + hx(h7);
}

export async function hashPassword(password: string): Promise<string> {
  const bytes = utf8Bytes(String(password));
  const subtle = typeof crypto !== "undefined" && crypto?.subtle ? crypto.subtle : null;
  if (subtle) {
    try {
      const buf = await subtle.digest("SHA-256", bytes as BufferSource);
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      /* contexto no seguro / WebView: cae al respaldo JS */
    }
  }
  return sha256Hex(bytes);
}

export function isPasswordMediumStrength(password: string): boolean {
  return password.length >= 6 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

export function normalizeId(text: string): string {
  return text.trim().toUpperCase();
}

export interface IdentifierMatch {
  id: string;
  name: string;
  nickname: string;
}

/** Busca localmente primero (rápido, sin red); si no hay match y forceCloud, consulta Supabase. */
export async function findProfileByIdentifier(
  sb: SupabaseClient | null,
  localProfiles: Record<string, Profile>,
  identifier: string,
  forceCloud = false
): Promise<IdentifierMatch | Profile | null> {
  const id = normalizeId(identifier);
  const local = Object.values(localProfiles).find((p) => p.name === id || p.nickname === id);
  if (local && !forceCloud) return local;
  if (!sb) return local || null;
  const { data: byName } = await sb.from("profiles").select("id,name,nickname").eq("name", id).limit(1);
  if (byName && byName.length) return byName[0] as IdentifierMatch;
  const { data: byNick } = await sb.from("profiles").select("id,name,nickname").eq("nickname", id).limit(1);
  if (byNick && byNick.length) return byNick[0] as IdentifierMatch;
  return local || null;
}

/** Login por función segura: el hash se compara en el servidor, nunca sale de la base. */
export async function verifyLogin(sb: SupabaseClient, identifier: string, passwordHash: string): Promise<Profile | null> {
  const { data } = await withTimeout(
    sb.rpc("verify_login", { p_identifier: normalizeId(identifier), p_password_hash: passwordHash }),
    8000,
    "login"
  );
  return data ? rowToProfile(data as ProfileRow) : null;
}

export async function checkEmailAvailable(sb: SupabaseClient, email: string): Promise<boolean | null> {
  const { data } = await sb.rpc("email_available", { p_email: email });
  return typeof data === "boolean" ? data : null;
}

export async function requestPasswordResetCode(sb: SupabaseClient, email: string): Promise<void> {
  await sb.rpc("request_password_reset", { p_email: email });
}

export type SetEmailResult = "ok" | "wrong_password" | "taken" | "invalid";

export async function setMyEmail(sb: SupabaseClient, id: string, currentPasswordHash: string, email: string): Promise<SetEmailResult> {
  const { data } = await sb.rpc("set_my_email", { p_id: id, p_current_hash: currentPasswordHash, p_email: email });
  return data as SetEmailResult;
}

export async function changeMyPassword(sb: SupabaseClient, id: string, currentPasswordHash: string, newPasswordHash: string): Promise<boolean> {
  const { data } = await sb.rpc("change_my_password", { p_id: id, p_current_hash: currentPasswordHash, p_new_hash: newPasswordHash });
  return data === true;
}

export async function confirmPasswordReset(
  sb: SupabaseClient,
  email: string,
  code: string,
  newHash: string
): Promise<{ ok: boolean; error: unknown }> {
  const { data, error } = await sb.rpc("confirm_password_reset", { p_email: email, p_code: code, p_new_hash: newHash });
  return { ok: data === true, error };
}
