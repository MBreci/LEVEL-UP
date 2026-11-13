"use client";

import { useMemo } from "react";
import { useProfiles } from "@/context/ProfilesContext";
import { useMatches } from "@/context/MatchesContext";
import { getMatchEstado } from "@/lib/domain/matches";

export function StatChips({ onScrollToOpen }: { onScrollToOpen: () => void }) {
  const { displayPlayerCount } = useProfiles();
  const { openMatches } = useMatches();

  const openWithSpace = useMemo(
    () =>
      openMatches.filter((m) => {
        if (m.finalizado || getMatchEstado(m) === "finalizado") return false;
        return m.necesita && m.necesita.some((n) => (n.unidos || []).length < (n.cupos || 0));
      }).length,
    [openMatches]
  );

  return (
    <div className="bp-stat-chips" id="bp-stat-chips">
      <div className="bp-stat-chip">
        <div className="bp-stat-chip-icon">👥</div>
        <div className="bp-stat-chip-val">{displayPlayerCount() || "0"}</div>
        <div className="bp-stat-chip-lbl">
          JUGADORES
          <br />
          DISPONIBLES
        </div>
      </div>
      <div className="bp-stat-chip bp-stat-chip--accent bp-stat-chip--link" onClick={onScrollToOpen}>
        <div className="bp-stat-chip-icon">🟢</div>
        <div className="bp-stat-chip-val">{openWithSpace || "0"}</div>
        <div className="bp-stat-chip-lbl">
          PARTIDOS CON
          <br />
          CUPO DISPONIBLE
        </div>
      </div>
    </div>
  );
}
