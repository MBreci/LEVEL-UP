"use client";

import { useMatches } from "@/context/MatchesContext";

export function ParticipantsModal({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const { openMatches } = useMatches();
  const match = openMatches.find((m) => m.id === matchId);
  if (!match) return null;
  const rows = match.necesita.flatMap((n) => n.unidos.map((u) => ({ ...u, pos: n.pos })));

  return (
    <div className="modal-overlay open" id="participants-modal">
      <div className="invite-card" id="participants-content">
        <div className="invite-title">PARTICIPANTES</div>
        <div className="invite-sub">
          {match.cancha || match.zona} — {match.fecha}
        </div>
        <div className="invite-list">
          {rows.length ? (
            rows.map((r, i) => (
              <div className="invite-row" key={i}>
                {r.name} · {r.pos}
              </div>
            ))
          ) : (
            <div className="invite-empty">Aún no hay jugadores inscritos.</div>
          )}
        </div>
        <button className="auth-cancel" onClick={onClose}>
          CERRAR
        </button>
      </div>
    </div>
  );
}
