"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { useMatches } from "@/context/MatchesContext";
import { getRank, getNextRank } from "@/lib/domain/rank";
import { getGeneralRanking } from "@/lib/domain/ranking";
import { getMatchEstado } from "@/lib/domain/matches";

export function DashboardProgress() {
  const { profile } = useAuth();
  const { profiles } = useProfiles();
  const { openMatches } = useMatches();
  const router = useRouter();

  const ranking = useMemo(() => getGeneralRanking(profiles), [profiles]);

  if (!profile) return null;

  const rank = getRank(profile.xp);
  const nextRank = getNextRank(profile.xp);
  const rankPos = ranking.findIndex((p) => p.id === profile.id) + 1;
  const lu = profile.lastUpdate;
  const nextMatch = openMatches.find((m) => m.creatorId === profile.id && getMatchEstado(m) !== "finalizado");
  const recentNotifs = [...profile.notifications].slice(-3).reverse();
  const xpPct = nextRank ? Math.min(100, Math.round(((profile.xp - rank.min) / (nextRank.min - rank.min)) * 100)) : 100;

  return (
    <div className="dash-wrap" id="dash-content">
      <div className="dash-welcome">BIENVENIDO DE NUEVO, {(profile.nickname || profile.name).split(" ")[0]}</div>
      <div className="dash-top-stats">
        <div className="dash-stat acc-g">
          <div className="dash-stat-v">{profile.ovr}</div>
          <div className="dash-stat-l">OVR</div>
        </div>
        <div className="dash-stat acc-f">
          <div className="dash-stat-v">{rank.name}</div>
          <div className="dash-stat-l">RANGO</div>
        </div>
        <div className="dash-stat acc-o">
          <div className="dash-stat-v">{profile.xp}</div>
          <div className="dash-stat-l">XP</div>
        </div>
        <div className="dash-stat acc-w">
          <div className="dash-stat-v">{profile.lp || 0}</div>
          <div className="dash-stat-l">LP</div>
        </div>
      </div>
      <div className="dash-xp-card">
        <div className="dash-xp-head">
          <span>PROGRESO DE RANGO</span>
          <span>{nextRank ? `${xpPct}% · FALTAN ${nextRank.min - profile.xp} XP PARA ${nextRank.name}` : "RANGO MÁXIMO ALCANZADO"}</span>
        </div>
        <div className="dash-xp-track">
          <div className="dash-xp-fill" style={{ width: `${xpPct}%` }}></div>
        </div>
      </div>
      {lu && (
        <div className="dash-card acc-g">
          <div className="dash-card-title">🔥 ÚLTIMA ACTUALIZACIÓN</div>
          <div className="dash-update-row">
            <span>
              OVR {lu.ovrDelta >= 0 ? "+" : ""}
              {lu.ovrDelta}
            </span>
            <span>XP +{lu.xpGain}</span>
            <span>LP +{lu.lpGain}</span>
          </div>
        </div>
      )}
      <div className="dash-card acc-f">
        <div className="dash-card-title">⚽ PRÓXIMO PARTIDO</div>
        {nextMatch ? (
          <>
            <div className="dash-match-info">
              {nextMatch.zona}
              {nextMatch.cancha ? " · " + nextMatch.cancha : ""} — {nextMatch.fecha}
            </div>
            <button className="dash-btn" onClick={() => router.push("/buscar-partido")}>
              VER PARTIDO
            </button>
          </>
        ) : (
          <div className="dash-empty">No tienes búsquedas activas. Publica una en &quot;PARTIDOS&quot;.</div>
        )}
      </div>
      <div className="dash-card acc-o">
        <div className="dash-card-title">🏆 RANKING</div>
        <div className="dash-rank-pos">TU POSICIÓN ACTUAL: #{rankPos}</div>
      </div>
      <div className="dash-card acc-w">
        <div className="dash-card-title">📋 ACTIVIDAD RECIENTE</div>
        {recentNotifs.length ? (
          recentNotifs.map((n, i) => (
            <div className="dash-activity-row" key={i}>
              {n.icon} {n.text}
            </div>
          ))
        ) : (
          <div className="dash-empty">Sin actividad reciente.</div>
        )}
      </div>
    </div>
  );
}
