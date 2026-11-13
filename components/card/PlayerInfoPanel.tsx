"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { getNextRank, getRank } from "@/lib/domain/rank";
import { playerTeamLabel } from "@/lib/domain/teams";
import { getGeneralRanking } from "@/lib/domain/ranking";
import { PhysicalGrid } from "@/components/card/PhysicalGrid";
import type { Profile } from "@/types/profile";
import type { Team } from "@/types/team";

const ATTR_ROWS: { key: keyof Profile["attrs"]; label: string }[] = [
  { key: "pac", label: "PAC · RITMO" },
  { key: "sho", label: "SHO · TIRO" },
  { key: "pas", label: "PAS · PASE" },
  { key: "dri", label: "DRI · REGATE" },
  { key: "def", label: "DEF · DEFENSA" },
  { key: "fis", label: "FIS · FÍSICO" },
];

export function PlayerInfoPanel({ profile, teams = {} }: { profile: Profile; teams?: Record<string, Team> }) {
  const { editNickname } = useAuth();
  const { profiles } = useProfiles();

  const ranking = useMemo(() => getGeneralRanking(profiles), [profiles]);
  const rank = getRank(profile.xp);
  const next = getNextRank(profile.xp);
  const prevMin = rank.min;
  const nextMin = next ? next.min : prevMin + 1;
  const pct = next ? Math.min(100, Math.round(((profile.xp - prevMin) / (nextMin - prevMin)) * 100)) : 100;
  const rankPos = ranking.findIndex((p) => p.id === profile.id) + 1;

  return (
    <div className="pi" id="player-info">
      <div className="pi-name">
        {profile.name}{" "}
        {profile.nickname ? (
          <span className="pi-nick" onClick={editNickname}>
            &quot;{profile.nickname}&quot; ✎
          </span>
        ) : (
          <span className="pi-nick pi-nick-add" onClick={editNickname}>
            + AGREGAR APODO
          </span>
        )}
      </div>
      <div className="pi-sub">
        {profile.position} · {playerTeamLabel(profile, teams)}
      </div>
      <div className={`pi-rank-hero rk-${rank.slug}`}>
        <div className="pi-rank-hero-fx"></div>
        <div className="pi-rank-hero-emoji">{rank.emoji}</div>
        <div className="pi-rank-hero-body">
          <div className="pi-rank-hero-label">RANGO ACTUAL</div>
          <div className="pi-rank-hero-name">{rank.name}</div>
          <div className="pi-rank-hero-tag">{rank.tagline}</div>
        </div>
      </div>
      <div className="pi-tags">
        <div className="pi-tag gold">RANKING GENERAL #{rankPos}</div>
      </div>
      <div className="pi-stats">
        <div className="pi-stat">
          <div className="pi-stat-n">{profile.matches}</div>
          <div className="pi-stat-l">PARTIDOS</div>
        </div>
        <div className="pi-stat">
          <div className="pi-stat-n">{profile.goals}</div>
          <div className="pi-stat-l">GOLES</div>
        </div>
        <div className="pi-stat">
          <div className="pi-stat-n">{profile.assists}</div>
          <div className="pi-stat-l">ASISTENCIAS</div>
        </div>
        <div className="pi-stat">
          <div className="pi-stat-n">{profile.mvps}</div>
          <div className="pi-stat-l">MVP</div>
        </div>
      </div>
      <div className="attr-bars-title">FICHA FÍSICA</div>
      <PhysicalGrid physical={profile.physical} />
      <div className="bars">
        <div className="bar">
          <div className="bar-top">
            <span className="bar-l">OVERALL (OVR)</span>
            <span className="bar-n">{profile.ovr}/100</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${profile.ovr}%` }}></div>
          </div>
        </div>
      </div>
      <div className="attr-bars">
        <div className="attr-bars-title">ATRIBUTOS</div>
        {ATTR_ROWS.map((row) => (
          <div className={`attr-bar ${row.key}`} key={row.key}>
            <div className="attr-bar-top">
              <span className="attr-bar-l">{row.label}</span>
              <span className="attr-bar-n">{profile.attrs[row.key]}</span>
            </div>
            <div className="attr-bar-track">
              <div className="attr-bar-fill" style={{ width: `${profile.attrs[row.key]}%` }}></div>
            </div>
          </div>
        ))}
      </div>
      <div className="lvl-wrap">
        <div className="lvl-top">
          <div className="lvl-badge">{rank.name}</div>
          <div className="lvl-xp">
            {profile.xp} XP {next ? `· ${nextMin - profile.xp} XP PARA ${next.name}` : "· RANGO MÁXIMO"}
          </div>
        </div>
        <div className="lvl-track">
          <div className="lvl-fill" style={{ width: `${pct}%` }}></div>
        </div>
      </div>
    </div>
  );
}
