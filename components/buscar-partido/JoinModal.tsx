"use client";

import { useAuth } from "@/context/AuthContext";
import { useMatches } from "@/context/MatchesContext";

export function JoinModal({ matchId, pos, onClose }: { matchId: string; pos: string; onClose: () => void }) {
  const { profile } = useAuth();
  const { openMatches, confirmJoin } = useMatches();
  const match = openMatches.find((m) => m.id === matchId);
  if (!match || !profile) return null;

  async function handleConfirm() {
    const res = await confirmJoin(matchId, pos);
    if (!res.ok && res.error) alert(res.error);
    onClose();
  }

  return (
    <div className="modal-overlay open" id="join-modal">
      <div className="invite-card" id="join-modal-content">
        <div className="invite-title">UNIRTE AL PARTIDO</div>
        <div className="invite-sub">
          {match.cancha || match.zona} — {match.fecha} · Posición {pos}
        </div>
        <div className="join-stats-grid">
          <div className="join-stat">
            <span>MI OVR</span>
            <strong>{profile.ovr}</strong>
          </div>
          <div className="join-stat">
            <span>POSICIÓN PRINCIPAL</span>
            <strong>{profile.position}</strong>
          </div>
          <div className="join-stat">
            <span>POSICIÓN SECUNDARIA</span>
            <strong>N/A</strong>
          </div>
          <div className="join-stat">
            <span>CONFIABILIDAD</span>
            <strong>100%</strong>
          </div>
          <div className="join-stat">
            <span>CALIFICACIÓN PROMEDIO</span>
            <strong>SIN DATOS</strong>
          </div>
          <div className="join-stat">
            <span>HISTORIAL DE ASISTENCIAS</span>
            <strong>SIN PARTIDOS AÚN</strong>
          </div>
        </div>
        <button className="auth-submit" onClick={handleConfirm}>
          SOLICITAR INGRESO
        </button>
        <button className="auth-cancel" onClick={onClose}>
          CANCELAR
        </button>
      </div>
    </div>
  );
}
