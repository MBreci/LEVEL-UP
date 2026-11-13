"use client";

import { useState } from "react";
import { useTeams } from "@/context/TeamsContext";
import { fileToDataUrl } from "@/lib/domain/fileToDataUrl";
import { containsProfanity } from "@/lib/domain/rank";

export function CreateTeamForm({ onEscudoClick }: { onEscudoClick: (src: string) => void }) {
  const { createTeam } = useTeams();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [city, setCity] = useState("");
  const [color, setColor] = useState("#00ff88");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(await fileToDataUrl(file));
  }

  async function submit() {
    if (!name.trim()) {
      setError("Escribe el nombre del equipo.");
      return;
    }
    if (containsProfanity(name) || containsProfanity(desc) || containsProfanity(city)) {
      setError("El nombre, descripción o ciudad contiene lenguaje ofensivo. Por favor elige otro.");
      return;
    }
    setError("");
    setBusy(true);
    const res = await createTeam({ name, desc, city, color, photo });
    setBusy(false);
    if (!res.ok) setError(res.error || "No se pudo crear el equipo.");
  }

  return (
    <div id="team-create-panel" className="eq-create-wrap">
      <div className="sec-hdr">
        <div className="sec-eyebrow">CREAR EQUIPO</div>
      </div>
      <div className="bp-form" id="team-create-form">
        <div className="auth-label">NOMBRE DEL EQUIPO</div>
        <input className="auth-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Halcones FC" maxLength={24} />
        <div className="auth-label">DESCRIPCIÓN (OPCIONAL)</div>
        <input className="auth-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej: Equipo de barrio, jugamos los domingos" maxLength={80} />
        <div className="auth-label">CIUDAD / BARRIO</div>
        <input className="auth-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Suba, Bogotá" maxLength={24} />
        <div className="auth-label">COLOR DEL EQUIPO</div>
        <input className="auth-input" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <div className="auth-label">ESCUDO (OPCIONAL)</div>
        <input className="auth-input" type="file" accept="image/*" onChange={handlePhoto} />
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="team-escudo escudo-clickable" src={photo} style={{ marginTop: 10 }} alt="" onClick={() => onEscudoClick(photo)} />
        )}
        <div className="auth-error">{error}</div>
        <button className="auth-submit" disabled={busy} onClick={submit}>
          {busy ? "CREANDO..." : "CREAR EQUIPO"}
        </button>
      </div>
    </div>
  );
}
