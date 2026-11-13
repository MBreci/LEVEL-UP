"use client";

import { useMemo } from "react";
import { useProfiles } from "@/context/ProfilesContext";
import { useMatches } from "@/context/MatchesContext";
import { getMatchEstado } from "@/lib/domain/matches";

interface TickerItem {
  icon: string;
  strong: string;
  rest: string;
}

export function ActivityTicker() {
  const { profiles } = useProfiles();
  const { openMatches } = useMatches();

  const items = useMemo<TickerItem[]>(() => {
    const list: TickerItem[] = [];
    openMatches
      .filter((m) => getMatchEstado(m) !== "finalizado")
      .forEach((m) => {
        m.necesita
          .filter((n) => n.unidos.length < n.cupos)
          .forEach((n) => {
            list.push({
              icon: "🔍",
              strong: `SE BUSCA ${n.pos}`,
              rest: ` Fútbol ${m.formato} · ${m.zona} · ${m.fecha} · faltan ${n.cupos - n.unidos.length}`,
            });
          });
      });
    Object.values(profiles)
      .slice(-5)
      .forEach((p) => list.push({ icon: "🆕", strong: "NUEVO JUGADOR", rest: ` ${p.nickname || p.name} se unió a LEVEL UP` }));
    if (list.length === 0) {
      return [{ icon: "⚽", strong: "", rest: 'Sé el primero en publicar tu búsqueda en "BUSCAR PARTIDO"' }];
    }
    return [...list, ...list];
  }, [openMatches, profiles]);

  return (
    <div className="ticker">
      <div className="tk-pill">
        <div className="tk-dot"></div>
        <div className="tk-lbl">ACTIVIDAD</div>
      </div>
      <div className="tk-feed">
        <div className="tk-inner" id="ticker-inner">
          {items.map((item, i) => (
            <span className="tk-item" key={i}>
              {item.icon} {item.strong && <strong>{item.strong}</strong>}
              {item.rest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
