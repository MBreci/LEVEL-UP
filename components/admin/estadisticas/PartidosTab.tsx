"use client";

import { useState } from "react";
import { useTeams } from "@/context/TeamsContext";
import { useMatches } from "@/context/MatchesContext";
import { useTournaments } from "@/context/TournamentsContext";
import { matchDateTime } from "@/lib/domain/matches";
import { MatchDetailPanel, type ShOpenKey } from "@/components/admin/estadisticas/MatchDetailPanel";
import type { OpenMatch } from "@/types/match";
import type { TeamMatch } from "@/types/team";

type FiltroModo = "todos" | "libre" | "rey";

interface Row {
  esEquipo: boolean;
  teamMatch?: TeamMatch;
  openMatch?: OpenMatch;
  id: string;
  when: Date;
}

/**
 * Puerto fiel de renderStatsHubPartidos (app.js ~7630-7677): listado
 * combinado de open_matches + team_matches, más reciente primero, con
 * toolbar de filtro por modo/torneo y detalle inline expandible.
 */
export function PartidosTab({ openKey, onToggle }: { openKey: ShOpenKey | null; onToggle: (matchId: string, esEquipo: boolean, wrapId: string) => void }) {
  const { teams, teamMatches } = useTeams();
  const { openMatches } = useMatches();
  const { tournaments } = useTournaments();

  const [filtroModo, setFiltroModo] = useState<FiltroModo>("todos");
  const [filtroTorneo, setFiltroTorneo] = useState("");

  let rows: Row[] = [];
  if (filtroModo !== "rey") {
    rows = rows.concat(openMatches.map((m) => ({ esEquipo: false, openMatch: m, id: m.id, when: matchDateTime(m) })));
  }
  if (filtroModo !== "libre") {
    rows = rows.concat(
      teamMatches
        .filter((m) => !filtroTorneo || m.torneoId === filtroTorneo)
        .map((m) => ({ esEquipo: true, teamMatch: m, id: m.id, when: new Date(`${m.fecha}T${m.hora || "00:00"}`) }))
    );
  }
  rows.sort((a, b) => b.when.getTime() - a.when.getTime());
  rows = rows.slice(0, 60);

  const tournamentList = Object.values(tournaments).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className="sh-section" id="sh-root">
      <div className="adm-section-title">PARTIDOS</div>
      <div className="sh-toolbar">
        <button className={`sh-filtro-btn ${filtroModo === "todos" ? "on" : ""}`} onClick={() => setFiltroModo("todos")}>
          TODOS
        </button>
        <button className={`sh-filtro-btn ${filtroModo === "libre" ? "on" : ""}`} onClick={() => setFiltroModo("libre")}>
          MODO LIBRE
        </button>
        <button className={`sh-filtro-btn ${filtroModo === "rey" ? "on" : ""}`} onClick={() => setFiltroModo("rey")}>
          REY DEL BARRIO / TORNEO
        </button>
        <select className="sh-filtro-torneo" value={filtroTorneo} onChange={(e) => setFiltroTorneo(e.target.value)}>
          <option value="">Todos los torneos</option>
          {tournamentList.map((t) => (
            <option value={t.id} key={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="adm-match-list">
        {rows.length === 0 ? (
          <div className="adm-empty">No hay partidos con este filtro.</div>
        ) : (
          rows.map(({ esEquipo, teamMatch, openMatch, id }) => {
            const done = esEquipo ? !!(teamMatch?.estado === "finalizado" && teamMatch?.resultado) : !!(openMatch?.finalizado && openMatch?.resultado);
            const badge = done
              ? esEquipo
                ? `${teamMatch!.resultado!.golesA}-${teamMatch!.resultado!.golesB}`
                : `${openMatch!.resultado!.golesLocal || 0}-${openMatch!.resultado!.golesVisitante || 0}`
              : "SIN REGISTRAR";
            const torneo = esEquipo && teamMatch?.torneoId ? tournaments[teamMatch.torneoId]?.nombre : null;
            const titulo = esEquipo ? `${teams[teamMatch!.teamAId]?.name || "?"} vs ${teams[teamMatch!.teamBId]?.name || "?"}` : openMatch!.cancha || openMatch!.zona || "Partido Modo Libre";
            const meta = esEquipo ? `${teamMatch!.fecha}${teamMatch!.hora ? " · " + teamMatch!.hora : ""}` : `${openMatch!.fecha}${openMatch!.horaValue ? " · " + openMatch!.horaValue : ""}`;
            const isOpen = openKey?.matchId === id && openKey?.wrapId === "sh-detail-" + id;
            return (
              <div className="adm-match-row sh-match-row" key={(esEquipo ? "eq-" : "lib-") + id}>
                <div className="adm-match-info">
                  <div className="adm-match-teams">
                    {titulo} <span className="sh-mode-tag">{esEquipo ? "REY DEL BARRIO" : "MODO LIBRE"}</span>
                  </div>
                  <div className="adm-match-meta">
                    {meta}
                    {torneo ? " · " + torneo : ""}
                  </div>
                </div>
                <span className={`adm-badge ${done ? "adm-badge-done" : "adm-badge-prog"}`}>{badge}</span>
                <button className="adm-edit-btn" onClick={() => onToggle(id, esEquipo, "sh-detail-" + id)}>
                  {done ? "VER / CORREGIR" : "CARGAR ESTADÍSTICAS"}
                </button>
                <div className={`sh-detail${isOpen ? " open" : ""}`}>
                  {isOpen && <MatchDetailPanel key={id + ":sh-detail-" + id} matchId={id} esEquipo={esEquipo} onClose={() => onToggle(id, esEquipo, "sh-detail-" + id)} />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
