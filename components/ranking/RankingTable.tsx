"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { usePlayerView } from "@/context/PlayerViewContext";
import { getGeneralRanking, type RankingEntry } from "@/lib/domain/ranking";
import { POS_LABELS, rkPosGroup, type RankPosGroup } from "@/lib/domain/rankingFilters";

const TABS: { pos: RankPosGroup; label: string; cls: string }[] = [
  { pos: "ALL", label: "🏆 GENERAL", cls: "" },
  { pos: "DEL", label: "⚡ DELANTEROS", cls: "rk-tab-del" },
  { pos: "MED", label: "🎯 MEDIOS", cls: "rk-tab-med" },
  { pos: "DEF", label: "🛡️ DEFENSAS", cls: "rk-tab-def" },
  { pos: "POR", label: "🧤 PORTEROS", cls: "rk-tab-por" },
];

export function RankingTable() {
  const { profile: me } = useAuth();
  const { profiles } = useProfiles();
  const { openPlayerView } = usePlayerView();
  const [pos, setPos] = useState<RankPosGroup>("ALL");
  const [query, setQuery] = useState("");

  const fullRanking = useMemo(() => getGeneralRanking(profiles), [profiles]);
  const base = useMemo(
    () => (pos === "ALL" ? fullRanking : fullRanking.filter((p) => rkPosGroup(p.pos) === pos)),
    [fullRanking, pos]
  );
  const list = useMemo(() => {
    if (!query) return base;
    const q = query.toLowerCase();
    return base.filter((p) => p.name.toLowerCase().includes(q) || p.rank.toLowerCase().includes(q));
  }, [base, query]);

  return (
    <section id="ranking">
      <div className="rk-search-wrap">
        <input
          className="rk-search-input"
          placeholder="Buscar jugador por nombre o rango..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          name="lu-rk-q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="rk-tabs">
        {TABS.map((t) => (
          <button
            key={t.pos}
            className={`rk-tab ${t.cls}${pos === t.pos ? " active" : ""}`}
            onClick={() => setPos(t.pos)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="rk-panel">
        <div className="rk-list-head">
          <span className="rk-list-title">{POS_LABELS[pos]}</span>
          <span className="rk-list-count">
            {base.length} jugador{base.length !== 1 ? "es" : ""}
          </span>
        </div>
        {!list.length ? (
          <div className="rk-empty">
            {query ? "No se encontraron jugadores en esta posición." : "Aún no hay jugadores en esta posición."}
          </div>
        ) : (
          list.map((p: RankingEntry) => {
            const num = base.findIndex((r) => r.id === p.id) + 1;
            const posG = rkPosGroup(p.pos);
            const isMe = !!me && p.id === me.id;
            return (
              <div
                key={p.id}
                className={`rk-row rk-${p.slug} ${isMe ? "me" : ""}`}
                onClick={() => openPlayerView(p.id)}
                style={{ cursor: "pointer" }}
              >
                <div className={`rk-pos ${num === 1 ? "gold" : num === 2 ? "silver" : num === 3 ? "bronze" : ""}`}>{num}</div>
                <div className="rk-av">
                  <div className="rk-av-fx"></div>
                  {p.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                </div>
                <div className="rk-info">
                  <div className="rk-name">
                    {p.name}
                    {isMe ? " (TÚ)" : ""} <span className={`rk-poschip rk-poschip-${posG}`}>{posG}</span>
                  </div>
                  <div className="rk-rank rk-emblem">
                    <span className="rk-emblem-emoji">{p.emoji}</span>
                    {p.rank}
                  </div>
                </div>
                <div className="rk-ovr">{p.ovr}</div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
