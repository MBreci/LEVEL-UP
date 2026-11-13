"use client";

import { useMemo } from "react";
import { useProfiles } from "@/context/ProfilesContext";
import { useMatches } from "@/context/MatchesContext";
import { getGeneralRanking, getPlatformStats } from "@/lib/domain/ranking";
import { getMatchEstado } from "@/lib/domain/matches";

export function HeroStats() {
  const { profiles, totalPlayers } = useProfiles();
  const stats = useMemo(() => getPlatformStats(profiles), [profiles]);
  return (
    <div className="h-stats" id="hero-stats">
      <div className="h-stat">
        <div className="h-stat-n">{totalPlayers != null ? totalPlayers : "—"}</div>
        <div className="h-stat-l">JUGADORES</div>
      </div>
      <div className="h-stat">
        <div className="h-stat-n">{stats.partidos}</div>
        <div className="h-stat-l">PARTIDOS</div>
      </div>
      <div className="h-stat">
        <div className="h-stat-n">{stats.mvps}</div>
        <div className="h-stat-l">MVP OTORGADOS</div>
      </div>
    </div>
  );
}

export function HeroFloats() {
  const { profiles, totalPlayers } = useProfiles();
  const { openMatches } = useMatches();

  const ranking = useMemo(() => getGeneralRanking(profiles), [profiles]);
  const top = ranking[0];
  const leftItems = useMemo(() => {
    const base = ranking.slice(0, 6).map((p) => `⚽ ${(p.name || "").slice(0, 10)} · OVR ${p.ovr || "?"}`);
    return [...base, ...base];
  }, [ranking]);

  const activeMatches = useMemo(
    () => openMatches.filter((m) => !m.finalizado && getMatchEstado(m) !== "finalizado"),
    [openMatches]
  );
  const rightItems = useMemo(() => {
    const matchItems = activeMatches.slice(0, 5).map((m) => `🔍 Fútbol ${m.formato} · ${m.zona || "Bogotá"}`);
    const base = matchItems.length
      ? matchItems
      : ["🏙️ BOGOTÁ · 2026", "⭐ TEMPORADA BETA", "⚽ FÚTBOL AMATEUR"];
    return [...base, ...base];
  }, [activeMatches]);

  return (
    <>
      <div className="hero-float hf-left" id="hero-float-left">
        <div className="hf-eyebrow">TOP JUGADOR</div>
        <div className="hf-n" id="hf-top-ovr">{top?.ovr || "—"}</div>
        <div className="hf-label-small">OVR</div>
        <div className="hf-divider"></div>
        <div className="hf-name" id="hf-top-name">{(top?.name || "—").toUpperCase().slice(0, 12)}</div>
        <div className="hf-tag" id="hf-top-rank">{(top?.rank || "CANTERANO").toUpperCase()}</div>
        <div className="hf-scroll-wrap">
          <div className="hf-scroll-inner" id="hf-left-scroll">
            {leftItems.map((text, i) => (
              <div className="hf-scroll-item" key={i}>{text}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="hero-float hf-right" id="hero-float-right">
        <div className="hf-eyebrow hf-eyebrow-f">EN VIVO</div>
        <div className="hf-n hf-n-f" id="hf-jugadores-n">{totalPlayers != null ? totalPlayers : "—"}</div>
        <div className="hf-label-small">JUGADORES</div>
        <div className="hf-divider hf-divider-f"></div>
        <div className="hf-stat-row">
          <span className="hf-stat-v" id="hf-partidos-n">{activeMatches.length || "0"}</span>
          <span className="hf-stat-l">PARTIDOS</span>
        </div>
        {/* GOLES siempre en 0: paridad deliberada con un bug de producción (renderHeroFloats
            en app.js suma `p.goles`, campo que no existe en el perfil — el campo real es `p.goals`). */}
        <div className="hf-stat-row">
          <span className="hf-stat-v hf-stat-v-f" id="hf-goles-n">0</span>
          <span className="hf-stat-l">GOLES</span>
        </div>
        <div className="hf-scroll-wrap">
          <div className="hf-scroll-inner hf-scroll-inner-f" id="hf-right-scroll">
            {rightItems.map((text, i) => (
              <div className="hf-scroll-item" key={i}>{text}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
