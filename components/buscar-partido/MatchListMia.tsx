"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { useMatches } from "@/context/MatchesContext";
import { useRateModal } from "@/context/RateModalContext";
import { MatchCard } from "@/components/buscar-partido/MatchCard";
import { getMatchEstado, matchDateTime } from "@/lib/domain/matches";
import { matchParticipantIds } from "@/lib/domain/playerView";

function RateTeammates() {
  const { profile: me } = useAuth();
  const { profiles } = useProfiles();
  const { openMatches } = useMatches();
  const { open: openRate } = useRateModal();

  const blocks = useMemo(() => {
    if (!me) return [];
    const rated = me.ratedPlayers || {};
    const played = openMatches
      .filter((m) => getMatchEstado(m) === "finalizado" && matchParticipantIds(m).has(me.id))
      .sort((a, b) => matchDateTime(b).getTime() - matchDateTime(a).getTime());
    return played
      .map((m) => ({
        match: m,
        mates: [...matchParticipantIds(m)].filter((id) => id !== me.id && !rated[id] && profiles[id]),
      }))
      .filter((b) => b.mates.length > 0);
  }, [me, profiles, openMatches]);

  if (!blocks.length) return null;

  return (
    <>
      {blocks.map(({ match, mates }) => (
        <div className="rate-match-card" key={match.id}>
          <div className="rate-match-hdr">
            <span className="rate-match-title">CALIFICA A TUS COMPAÑEROS</span>
            <span className="rate-match-sub">
              {match.cancha || match.zona} · {match.fecha || ""}
            </span>
          </div>
          <div className="rate-mates">
            {mates.map((id) => {
              const p = profiles[id];
              return (
                <button className="rate-mate" key={id} onClick={() => openRate(id)}>
                  <span className="rate-mate-av">
                    {(p.nickname || p.name).split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </span>
                  <span className="rate-mate-name">{p.nickname || p.name}</span>
                  <span className="rate-mate-cta">⭐ CALIFICAR</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export function MatchListMia({ onJoin, onParticipants }: { onJoin: (matchId: string, pos: string) => void; onParticipants: (matchId: string) => void }) {
  const { profile: me } = useAuth();
  const { openMatches } = useMatches();

  const list = useMemo(() => {
    if (!me) return [];
    return openMatches
      .filter((m) => getMatchEstado(m) !== "finalizado" && m.necesita.some((n) => n.unidos.some((u) => u.profileId === me.id)))
      .sort((a, b) => matchDateTime(a).getTime() - matchDateTime(b).getTime());
  }, [me, openMatches]);

  if (!me) return <div className="bp-list-grid">{/* guest: nada que mostrar, la guarda de la app ya exige sesión */}</div>;

  return (
    <>
      <RateTeammates />
      <div className="bp-list-grid" id="bp-list-mia">
        {list.length ? (
          list.map((m) => <MatchCard key={m.id} match={m} mode="mia" onJoin={onJoin} onParticipants={onParticipants} />)
        ) : (
          <div className="bp-empty">No estás inscrito en ningún partido próximo.</div>
        )}
      </div>
    </>
  );
}
