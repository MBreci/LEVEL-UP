"use client";

import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { useMatches } from "@/context/MatchesContext";
import { useTeams } from "@/context/TeamsContext";
import { usePlayerView } from "@/context/PlayerViewContext";
import { useRateModal } from "@/context/RateModalContext";
import { playerSharedMatch } from "@/lib/domain/playerView";
import { PlayerCard } from "@/components/card/PlayerCard";
import { CommunityRatings } from "@/components/card/CommunityRatings";

export function PlayerViewModal() {
  const { viewingId, loading, closePlayerView } = usePlayerView();
  const { profiles } = useProfiles();
  const { profile: me } = useAuth();
  const { openMatches } = useMatches();
  const { teams } = useTeams();
  const { open: openRate } = useRateModal();

  if (!viewingId) return null;
  const target = viewingId ? profiles[viewingId] : null;
  const canRate = !!me && !!target && me.id !== target.id && playerSharedMatch(openMatches, me, target.id);

  return (
    <div className="modal-overlay open" id="player-view-modal">
      <div className="player-view-card">
        <div className="card-section" id="player-view-content">
          {loading && !target && <div className="rk-empty" style={{ color: "var(--g)" }}>Cargando...</div>}
          {!loading && !target && <div className="rk-empty">No se pudo cargar este jugador.</div>}
          {target && (
            <>
              <PlayerCard profile={target} isMe={me?.id === target.id} teams={teams} />
              <CommunityRatings profile={target} />
              {canRate && (
                <button className="btn-g" style={{ width: "100%", marginTop: 12 }} onClick={() => openRate(target.id)}>
                  ⭐ CALIFICAR A {(target.nickname || target.name).toUpperCase()}
                </button>
              )}
            </>
          )}
        </div>
        <button className="auth-cancel" onClick={closePlayerView}>
          CERRAR
        </button>
      </div>
    </div>
  );
}
