"use client";

import { useProfiles } from "@/context/ProfilesContext";
import { useTeams } from "@/context/TeamsContext";
import type { Team } from "@/types/team";

export function KickModal({ team, playerId, onClose }: { team: Team; playerId: string; onClose: () => void }) {
  const { profiles } = useProfiles();
  const { kickTeamMember } = useTeams();
  const player = profiles[playerId];

  return (
    <div className="modal-overlay open" id="kick-modal">
      <div className="auth-card">
        <div className="auth-tabs">
          <div className="auth-tab on">EXPULSAR JUGADOR</div>
        </div>
        <div className="auth-label" style={{ whiteSpace: "pre-wrap" }}>
          Estás por echar a {player ? player.nickname || player.name : "este jugador"} de tu equipo. Esto puede tener
          consecuencias para tu equipo y los demás jugadores. ¿Deseas continuar?
        </div>
        <button
          className="auth-submit"
          onClick={() => {
            kickTeamMember(team.id, playerId);
            onClose();
          }}
        >
          SÍ, ECHAR DEL EQUIPO
        </button>
        <button className="auth-cancel" onClick={onClose}>
          CANCELAR
        </button>
      </div>
    </div>
  );
}
