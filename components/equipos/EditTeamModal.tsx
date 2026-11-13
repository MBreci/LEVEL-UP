"use client";

import { useState } from "react";
import { useTeams } from "@/context/TeamsContext";
import { fileToDataUrl } from "@/lib/domain/fileToDataUrl";
import { containsProfanity } from "@/lib/domain/rank";
import type { Team } from "@/types/team";

export function EditTeamModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const { editTeam } = useTeams();
  const [name, setName] = useState(team.name);
  const [desc, setDesc] = useState(team.desc || "");
  const [city, setCity] = useState(team.city || "");
  const [color, setColor] = useState(team.color || "#00ff88");
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState("");

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
    const res = await editTeam(team.id, { name, desc, city, color, photo });
    if (!res.ok) {
      setError(res.error || "No se pudo guardar.");
      return;
    }
    onClose();
  }

  const preview = photo !== undefined ? photo : team.photo;

  return (
    <div className="modal-overlay open" id="edit-team-modal">
      <div className="auth-card">
        <div className="auth-tabs">
          <div className="auth-tab on">EDITAR EQUIPO</div>
        </div>
        <div className="auth-label">NOMBRE DEL EQUIPO</div>
        <input className="auth-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
        <div className="auth-label">DESCRIPCIÓN (OPCIONAL)</div>
        <input className="auth-input" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={80} />
        <div className="auth-label">CIUDAD / BARRIO</div>
        <input className="auth-input" value={city} onChange={(e) => setCity(e.target.value)} maxLength={24} />
        <div className="auth-label">COLOR DEL EQUIPO</div>
        <input className="auth-input" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <div className="auth-label">ESCUDO (OPCIONAL)</div>
        <input className="auth-input" type="file" accept="image/*" onChange={handlePhoto} />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="team-escudo" src={preview} style={{ marginTop: 10 }} alt="" />
        )}
        <div className="auth-error">{error}</div>
        <button className="auth-submit" onClick={submit}>
          GUARDAR CAMBIOS
        </button>
        <button className="auth-cancel" onClick={onClose}>
          CANCELAR
        </button>
      </div>
    </div>
  );
}
