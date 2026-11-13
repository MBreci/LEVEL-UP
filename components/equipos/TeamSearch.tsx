"use client";

import { useMemo, useState } from "react";
import { useProfiles } from "@/context/ProfilesContext";
import { useTeams } from "@/context/TeamsContext";
import { getTeamOVR, getTeamRecord, searchTeams } from "@/lib/domain/teams";
import type { Team } from "@/types/team";

export function TeamSearch({ onOpenTeam }: { onOpenTeam: (teamId: string) => void }) {
  const { profiles } = useProfiles();
  const { teams } = useTeams();
  const [query, setQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);

  const list = useMemo(() => searchTeams(teams, profiles, query), [teams, profiles, query]);
  const suggestions = query.trim() ? list.slice(0, 6) : [];

  return (
    <>
      <div className="rdb-banner">
        <div className="rdb-banner-glow"></div>
        <div className="rdb-banner-content">
          <div className="rdb-banner-crown">👑</div>
          <div className="rdb-banner-body">
            <div className="rdb-banner-title">MODO COMPETITIVO OFICIAL</div>
            <div className="rdb-banner-text">
              Rey del Barrio no es un partido libre. Aquí se miden los jugadores en canchas certificadas por LEVEL UP.
              Cada partido registra tu desempeño real y actualiza tu ficha: OVR, estadísticas y rango.
            </div>
            <div className="rdb-banner-pills">
              <div className="rdb-pill rdb-pill-on">📍 Canchas certificadas LEVEL UP</div>
              <div className="rdb-pill rdb-pill-on">📊 Toma de medidas en cancha</div>
              <div className="rdb-pill rdb-pill-on">🃏 Actualiza tu ficha de jugador</div>
              <div className="rdb-pill rdb-pill-off">≠ No es modo partido libre</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pl-search-wrap">
        <input
          className="pl-search-input"
          placeholder="Buscar equipo por nombre o ciudad..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSuggestOpen(true)}
          onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
        />
        <div className={`pl-suggest${suggestOpen && suggestions.length ? " open" : ""}`}>
          {suggestions.map((t) => (
            <div className="pl-suggest-item" key={t.id} onClick={() => onOpenTeam(t.id)}>
              <span>{t.name}</span>
              <span className="s-sub">
                {t.city || ""} · OVR {getTeamOVR(t, profiles)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="pl-grid">
        {!list.length ? (
          <div className="rk-empty">No se encontraron equipos. ¡Sé el primero en crear uno!</div>
        ) : (
          list.map((t) => <TeamCard team={t} key={t.id} onOpen={() => onOpenTeam(t.id)} />)
        )}
      </div>
    </>
  );
}

function TeamCard({ team: t, onOpen }: { team: Team; onOpen: () => void }) {
  const { profiles } = useProfiles();
  const ovr = getTeamOVR(t, profiles);
  const { wins, losses, draws } = getTeamRecord(t);
  const col = t.color || "#00ff88";
  const colAlpha = col + "22";
  const colGlow = col + "55";

  return (
    <div
      className="tc-card"
      onClick={onOpen}
      style={{ ["--tc" as string]: col, ["--tc-a" as string]: colAlpha, ["--tc-g" as string]: colGlow, borderColor: col + "33" }}
    >
      <div className="tc-top" style={{ background: `linear-gradient(160deg,${colAlpha} 0%,transparent 60%)` }}>
        <div className="tc-accent" style={{ background: col, boxShadow: `0 0 18px ${colGlow}` }}></div>
        <div className="tc-shield">
          {t.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.photo} className="tc-shield-img" style={{ borderColor: col + "55" }} alt="" />
          ) : (
            <div className="tc-shield-placeholder" style={{ background: colAlpha, borderColor: col + "55", color: col }}>
              {t.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="tc-info">
          <div className="tc-name">{t.name}</div>
          <div className="tc-city">{t.city || "SIN CIUDAD"}</div>
          <div className="tc-members">
            <span className="tc-dot" style={{ background: col }}></span>
            {t.memberIds.length}/8 JUGADORES
          </div>
        </div>
      </div>
      <div className="tc-bottom">
        <div className="tc-stat">
          <div className="tc-stat-val" style={{ color: col }}>
            {ovr}
          </div>
          <div className="tc-stat-lbl">OVR</div>
        </div>
        <div className="tc-divider"></div>
        <div className="tc-stat">
          <div className="tc-stat-val">{wins}</div>
          <div className="tc-stat-lbl">VICTORIAS</div>
        </div>
        <div className="tc-divider"></div>
        <div className="tc-stat">
          <div className="tc-stat-val">{draws}</div>
          <div className="tc-stat-lbl">EMPATES</div>
        </div>
        <div className="tc-divider"></div>
        <div className="tc-stat">
          <div className="tc-stat-val">{losses}</div>
          <div className="tc-stat-lbl">DERROTAS</div>
        </div>
      </div>
    </div>
  );
}
