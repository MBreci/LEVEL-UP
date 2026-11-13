"use client";

import { useMemo, useState } from "react";
import { useProfiles } from "@/context/ProfilesContext";
import { usePlayerView } from "@/context/PlayerViewContext";
import { useTeams } from "@/context/TeamsContext";
import { getRank } from "@/lib/domain/rank";
import { playerTeamLabel } from "@/lib/domain/teams";

export function PlayerSearchGrid() {
  const { profiles } = useProfiles();
  const { openPlayerView } = usePlayerView();
  const { teams } = useTeams();
  const [query, setQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);

  const q = query.trim().toLowerCase();

  const list = useMemo(() => {
    return Object.values(profiles)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.nickname || "").toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
      .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name));
  }, [profiles, q]);

  const suggestions = useMemo(() => {
    if (!q) return [];
    return Object.values(profiles)
      .filter((p) => p.name.toLowerCase().includes(q) || (p.nickname || "").toLowerCase().includes(q))
      .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name))
      .slice(0, 6);
  }, [profiles, q]);

  return (
    <section id="jugadores">
      <div className="pl-search-wrap">
        <input
          className="pl-search-input"
          placeholder="Buscar por nombre, apodo o equipo..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          name="lu-pl-q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSuggestOpen(true)}
          onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
        />
        <div className={`pl-suggest${suggestOpen && suggestions.length ? " open" : ""}`}>
          {suggestions.map((p) => (
            <div
              className="pl-suggest-item"
              key={p.id}
              onClick={() => {
                setQuery(p.nickname || p.name);
                setSuggestOpen(false);
                openPlayerView(p.id);
              }}
            >
              <span>{p.nickname || p.name}</span>
              <span className="s-sub">
                {p.position} · {playerTeamLabel(p, teams)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="pl-grid">
        {!list.length ? (
          <div className="rk-empty">No se encontraron jugadores.</div>
        ) : (
          list.map((p) => {
            const rank = getRank(p.xp);
            return (
              <div className={`pl-card rk-${rank.slug}`} key={p.id} onClick={() => openPlayerView(p.id)}>
                <div className="pl-card-av">
                  <div className="rk-av-fx"></div>
                  {p.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                </div>
                <div className="pl-card-name">{p.nickname || p.name}</div>
                <div className="pl-card-sub">
                  {p.position} · {playerTeamLabel(p, teams)}
                </div>
                <div className="pl-card-tags">
                  <span className="rk-emblem">
                    <span className="rk-emblem-emoji">{rank.emoji}</span>
                    {rank.name}
                  </span>
                  <span className="pi-tag gold">OVR {p.ovr}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
