"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { useTeams } from "@/context/TeamsContext";
import { usePlayerView } from "@/context/PlayerViewContext";
import { getMyTeam, getTeamOVR, getTeamRecord } from "@/lib/domain/teams";

export function TeamViewModal({
  teamId,
  onClose,
  onChallenge,
  onEscudoClick,
}: {
  teamId: string;
  onClose: () => void;
  onChallenge: (teamId: string) => void;
  onEscudoClick: (src: string) => void;
}) {
  const { profile: me } = useAuth();
  const { profiles } = useProfiles();
  const { teams, teamMatches, requestJoinTeam, ensureTeamPhoto } = useTeams();
  const { openPlayerView } = usePlayerView();
  const team = teams[teamId];

  useEffect(() => {
    ensureTeamPhoto(teamId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  if (!team) {
    return (
      <div className="modal-overlay open" id="team-view-modal">
        <div className="player-view-card">
          <div className="card-section">
            <div className="rk-empty">No se pudo cargar este equipo.</div>
          </div>
          <button className="auth-cancel" onClick={onClose}>
            CERRAR
          </button>
        </div>
      </div>
    );
  }

  const ovr = getTeamOVR(team, profiles);
  const { wins, draws, losses, dg } = getTeamRecord(team);
  const captain = profiles[team.captainId];
  const members = team.memberIds.map((id) => (id ? profiles[id] : undefined)).filter((p): p is NonNullable<typeof p> => !!p);
  const recentMatches = teamMatches
    .filter((m) => (m.teamAId === teamId || m.teamBId === teamId) && m.estado === "finalizado")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);
  const myTeam = getMyTeam(teams, me?.id);
  const isMine = !!myTeam && myTeam.id === teamId;
  const alreadyMember = !!me && team.memberIds.includes(me.id);
  const alreadyRequested = !!me && team.joinRequests.includes(me.id);
  const col = team.color || "#00ff88";
  const colA = col + "22";
  const colG = col + "44";

  return (
    <div className="modal-overlay open" id="team-view-modal">
      <div className="player-view-card">
        <div className="card-section" id="team-view-content">
          <div className="tv-card">
            <div className="tv-hero" style={{ background: `linear-gradient(160deg,${colA} 0%,transparent 70%)` }}>
              <div className="tv-hero-bar" style={{ background: col, boxShadow: `0 0 24px ${colG}` }}></div>
              <div className="tv-hero-inner">
                <div className="tv-shield-wrap">
                  {team.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="tv-shield-img escudo-clickable" src={team.photo} onClick={() => onEscudoClick(team.photo!)} style={{ borderColor: col + "66" }} alt="" />
                  ) : (
                    <div className="tv-shield-placeholder" style={{ background: colA, borderColor: col + "66", color: col }}>
                      {team.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="tv-hero-info">
                  <div className="tv-team-name">{team.name}</div>
                  <div className="tv-team-city">
                    {team.city || "SIN CIUDAD"}
                    {team.desc ? " · " + team.desc : ""}
                  </div>
                  <div className="tv-captain">
                    👑 Capitán: <strong>{captain ? captain.nickname || captain.name : "DESCONOCIDO"}</strong>
                  </div>
                </div>
              </div>
              <div className="tv-stats-bar">
                <div className="tv-stat">
                  <div className="tv-stat-val" style={{ color: col }}>
                    {ovr}
                  </div>
                  <div className="tv-stat-lbl">OVR</div>
                </div>
                <div className="tv-stat-div"></div>
                <div className="tv-stat">
                  <div className="tv-stat-val">{wins}</div>
                  <div className="tv-stat-lbl">VICTORIAS</div>
                </div>
                <div className="tv-stat-div"></div>
                <div className="tv-stat">
                  <div className="tv-stat-val">{draws}</div>
                  <div className="tv-stat-lbl">EMPATES</div>
                </div>
                <div className="tv-stat-div"></div>
                <div className="tv-stat">
                  <div className="tv-stat-val">{losses}</div>
                  <div className="tv-stat-lbl">DERROTAS</div>
                </div>
                <div className="tv-stat-div"></div>
                <div className="tv-stat">
                  <div className="tv-stat-val">
                    {dg >= 0 ? "+" : ""}
                    {dg}
                  </div>
                  <div className="tv-stat-lbl">DIF. GOLES</div>
                </div>
              </div>
            </div>

            <div className="tv-section-label">PLANTILLA · {members.length}/8</div>
            <div className="tv-roster">
              {members.map((p) => {
                const isCap = p.id === team.captainId;
                return (
                  <div
                    className={`tv-player ${isCap ? "tv-player-cap" : ""}`}
                    key={p.id}
                    onClick={() => {
                      onClose();
                      openPlayerView(p.id);
                    }}
                  >
                    <div className="tv-player-av" style={isCap ? { borderColor: col } : undefined}>
                      {p.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} alt="" />
                      ) : (
                        <span>{p.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}</span>
                      )}
                    </div>
                    <div className="tv-player-name">{p.nickname || p.name}</div>
                    <div className="tv-player-pos">{p.position}</div>
                    <div className="tv-player-ovr" style={isCap ? { color: col } : undefined}>
                      OVR {p.ovr}
                    </div>
                    {isCap && (
                      <div className="tv-cap-badge" style={{ background: col, color: "#000" }}>
                        CAP
                      </div>
                    )}
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, 8 - members.length) }).map((_, i) => (
                <div className="tv-player tv-player-empty" key={i}>
                  <div className="tv-player-av tv-player-av-empty">+</div>
                  <div className="tv-player-name" style={{ color: "#333" }}>
                    LIBRE
                  </div>
                </div>
              ))}
            </div>

            {recentMatches.length > 0 && (
              <>
                <div className="tv-section-label">PARTIDOS RECIENTES</div>
                <div className="tv-matches">
                  {recentMatches.map((m) => {
                    const rival = teams[m.teamAId === teamId ? m.teamBId : m.teamAId];
                    const res = m.resultado;
                    let outcome = "—";
                    if (res) {
                      const myGoals = m.teamAId === teamId ? res.golesA : res.golesB;
                      const theirGoals = m.teamAId === teamId ? res.golesB : res.golesA;
                      outcome = myGoals > theirGoals ? "✔ VICTORIA" : myGoals < theirGoals ? "✘ DERROTA" : "— EMPATE";
                    }
                    const outcomeClass = outcome.startsWith("✔") ? "tv-match-w" : outcome.startsWith("✘") ? "tv-match-l" : "tv-match-d";
                    return (
                      <div className="tv-match-row" key={m.id}>
                        <div className="tv-match-rival">vs {rival ? rival.name : "RIVAL"}</div>
                        <div className="tv-match-score">{res ? res.golesA + " - " + res.golesB : "—"}</div>
                        <div className={`tv-match-outcome ${outcomeClass}`}>{outcome}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {!isMine && me && (
              <button
                className="tv-challenge-btn"
                style={{ background: `linear-gradient(135deg,${col},${col}cc)`, boxShadow: `0 0 20px ${colG}` }}
                onClick={() => {
                  onClose();
                  onChallenge(team.id);
                }}
              >
                ⚔ RETAR A {team.name.toUpperCase()}
              </button>
            )}
            {!isMine && !alreadyMember && !myTeam && team.openForPlayers && (
              <button className="mm-invite-btn" disabled={alreadyRequested} onClick={() => requestJoinTeam(team.id)}>
                {alreadyRequested ? "SOLICITUD ENVIADA" : "+ SOLICITAR UNIRME"}
              </button>
            )}
          </div>
        </div>
        <button className="auth-cancel" onClick={onClose}>
          CERRAR
        </button>
      </div>
    </div>
  );
}
