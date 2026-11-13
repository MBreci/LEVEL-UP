"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { getSupabase } from "@/lib/supabase/client";
import { pushProfileToCloud } from "@/lib/domain/profiles";
import { fetchFreshPlayerPhotos, setIsAdminInCloud, uploadAdminPlayerPhoto, type AdminPhotoKind } from "@/lib/domain/adminPlayers";
import type { Profile } from "@/types/profile";

const FEET = ["DERECHO", "IZQUIERDO", "AMBOS"] as const;

/**
 * Puerto fiel de openAdminPlayer/closeAdminPlayer/selectFoot/previewAdminPhoto/
 * saveAdminPlayer (app.js ~8266-8399) + markup de #admin-player-modal
 * (admin-estadisticas.html). Reutilizado tanto por el modal ⚙ ADMIN (decisión
 * C) como por la pestaña JUGADORES del Centro de Estadísticas (pieza 4).
 */
export function AdminPlayerEditor({ profileId, onClose }: { profileId: string; onClose: () => void }) {
  const { profile: me } = useAuth();
  const { profiles, setProfile } = useProfiles();
  const p = profiles[profileId];

  const [photo, setPhoto] = useState<string | null>(p?.photo || null);
  const [photoFull, setPhotoFull] = useState<string | null>(p?.photoFull || null);
  const [photoStatus, setPhotoStatus] = useState("");
  const [photoFullStatus, setPhotoFullStatus] = useState("");
  const [weight, setWeight] = useState(p?.physical?.weight != null ? String(p.physical.weight) : "");
  const [height, setHeight] = useState(p?.physical?.height != null ? String(p.physical.height) : "");
  const [age, setAge] = useState(p?.physical?.age != null ? String(p.physical.age) : "");
  const [foot, setFoot] = useState<string | null>(p?.physical?.foot || null);
  const [isAdminChecked, setIsAdminChecked] = useState(!!p?.isAdmin);
  const [saving, setSaving] = useState(false);

  // Trae foto/photo_full frescas de la nube al abrir (la carta cacheada localmente
  // puede estar desactualizada) — mismo criterio que openAdminPlayer.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fresh = await fetchFreshPlayerPhotos(getSupabase(), profileId);
      if (cancelled) return;
      setPhoto(fresh.photo);
      setPhotoFull(fresh.photoFull);
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (!p) return null;

  async function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>, kind: AdminPhotoKind) {
    const file = e.target.files?.[0];
    if (!file) return;
    const setStatus = kind === "card" ? setPhotoStatus : setPhotoFullStatus;
    setStatus("Subiendo foto...");
    const { url, error } = await uploadAdminPlayerPhoto(getSupabase(), profileId, file, kind);
    if (error || !url) {
      setStatus("✗ Error: " + (error || "desconocido"));
      return;
    }
    if (kind === "card") setPhoto(url);
    else setPhotoFull(url);
    setStatus("✔ Foto subida");
  }

  async function save() {
    setSaving(true);
    const w = parseFloat(weight) || null;
    const h = parseFloat(height) || null;
    const a = parseInt(age, 10) || null;
    const updated: Profile = {
      ...p,
      photo,
      photoFull,
      physical: { ...p.physical, weight: w, height: h, age: a, foot },
      isAdmin: isAdminChecked,
    };
    setProfile(updated);
    const sb = getSupabase();
    await pushProfileToCloud(sb, updated);
    // is_admin es protegido: se aplica aparte con la función segura RPC.
    let adminMsg = "";
    if (me) {
      const { error } = await setIsAdminInCloud(sb, me.id, profileId, isAdminChecked);
      if (error) adminMsg = "\n⚠️ No se pudo cambiar el rol de admin: " + ((error as { message?: string })?.message || String(error));
    }
    setSaving(false);
    onClose();
    alert("✅ Jugador actualizado." + (isAdminChecked ? " Ahora es ADMIN — debe refrescar su sesión para ver los controles." : "") + adminMsg);
  }

  return (
    <div className="modal-overlay open" id="admin-player-modal">
      <div className="ap-card">
        <div className="ap-header">
          <div>
            <div className="ap-title">EDITAR JUGADOR</div>
            <div className="ap-name">{p.nickname || p.name}</div>
          </div>
          <button className="am-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="ap-form">
          <label className="ap-label">
            FOTO MEDIO CUERPO <span style={{ opacity: 0.55, fontWeight: 400 }}>· para la tarjeta</span>
          </label>
          <div className="ap-photo-wrap">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="ap-photo-preview" src={photo} alt="" />
            ) : (
              <div className="ap-photo-preview ap-photo-empty">👤</div>
            )}
            <label className="ap-photo-btn" htmlFor="ap-photo-file">
              📷 SELECCIONAR FOTO
            </label>
            <input type="file" id="ap-photo-file" accept="image/*" style={{ display: "none" }} onChange={(e) => handlePhotoFile(e, "card")} />
            <div className="ap-photo-status">{photoStatus || (photo ? "✔ Foto cargada" : "Sin foto")}</div>
          </div>
          <label className="ap-label">
            FOTO CUERPO COMPLETO <span style={{ opacity: 0.55, fontWeight: 400 }}>· para la ficha</span>
          </label>
          <div className="ap-photo-wrap">
            {photoFull ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="ap-photo-preview" src={photoFull} alt="" />
            ) : (
              <div className="ap-photo-preview ap-photo-empty">🧍</div>
            )}
            <label className="ap-photo-btn" htmlFor="ap-photo-full-file">
              📷 SELECCIONAR FOTO
            </label>
            <input type="file" id="ap-photo-full-file" accept="image/*" style={{ display: "none" }} onChange={(e) => handlePhotoFile(e, "full")} />
            <div className="ap-photo-status">{photoFullStatus || (photoFull ? "✔ Foto cargada" : "Sin foto")}</div>
          </div>
          <label className="ap-label">PESO (kg)</label>
          <input className="ap-input" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
          <label className="ap-label">ALTURA (cm)</label>
          <input className="ap-input" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" />
          <label className="ap-label">EDAD</label>
          <input className="ap-input" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
          <label className="ap-label">PIE DOMINANTE</label>
          <div className="ap-foot-row">
            {FEET.map((f) => (
              <button key={f} type="button" className={`ap-foot-btn ${foot === f ? "on" : ""}`} onClick={() => setFoot(f)}>
                {f}
              </button>
            ))}
          </div>
          <label className="ap-label">ES ADMIN</label>
          <label className="ap-check-label">
            <input type="checkbox" checked={isAdminChecked} onChange={(e) => setIsAdminChecked(e.target.checked)} /> Admin del sistema
          </label>
        </div>
        <button className="am-finalize-btn" disabled={saving} onClick={save}>
          💾 GUARDAR
        </button>
      </div>
    </div>
  );
}
