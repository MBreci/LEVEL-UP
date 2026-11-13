"use client";

import { useMemo, useState } from "react";
import { useProfiles } from "@/context/ProfilesContext";
import { useTeams } from "@/context/TeamsContext";
import { playerTeamLabel } from "@/lib/domain/teams";
import { statsHubPlayerMatches } from "@/lib/domain/adminStatsHub";
import { AdminPlayerEditor } from "@/components/admin/AdminPlayerEditor";

const PAGE_SIZE = 10;

/**
 * Puerto fiel de renderStatsHubJugadores/statsHubJugadoresSearch/
 * statsHubJugadoresGoPage (app.js ~7679-7737): búsqueda multi-término
 * paginada (10 por página), EDITAR abre el mismo editor admin compartido.
 */
export function JugadoresTab() {
  const { profiles } = useProfiles();
  const { teams } = useTeams();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  const allPlayers = useMemo(() => {
    return Object.values(profiles)
      .filter((p) => statsHubPlayerMatches(p, query, playerTeamLabel(p, teams)))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [profiles, teams, query]);

  const totalPages = Math.max(1, Math.ceil(allPlayers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = allPlayers.slice(start, start + PAGE_SIZE);

  function handleSearch(v: string) {
    setQuery(v);
    setPage(1);
  }

  return (
    <div className="sh-section">
      <div className="adm-section-title" style={{ marginTop: 36 }}>
        JUGADORES
      </div>
      <div className="sh-toolbar">
        <input
          className="sh-search-input"
          type="text"
          placeholder="Buscar por nombre, apodo, posición, equipo o dorsal..."
          autoComplete="off"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <div className="adm-player-list">
        {pageItems.length === 0 ? (
          <div className="adm-empty">No se encontraron jugadores con ese filtro.</div>
        ) : (
          pageItems.map((p) => (
            <div className="adm-player-row" key={p.id}>
              <div className="adm-player-av">
                {p.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} alt="" />
                ) : (
                  <div className="adm-av-placeholder">{(p.nickname || p.name).slice(0, 2)}</div>
                )}
              </div>
              <div className="adm-player-info">
                <div className="adm-player-name">
                  {p.dorsal === 0 || p.dorsal ? <span className="sh-player-dorsal">#{p.dorsal}</span> : null} {p.nickname || p.name}
                </div>
                <div className="adm-player-meta">
                  {p.position || "?"} · {playerTeamLabel(p, teams)} · OVR {p.ovr || 60} · {p.goals || 0}G {p.assists || 0}A · {p.matches || 0} PJ
                </div>
              </div>
              <button className="adm-edit-btn" onClick={() => setEditingId(p.id)}>
                EDITAR
              </button>
            </div>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="sh-paginator">
          <button className="sh-page-btn" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
            ‹ ANTERIOR
          </button>
          <span className="sh-page-info">
            Página {currentPage} de {totalPages} · {allPlayers.length} jugador(es)
          </span>
          <button className="sh-page-btn" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
            SIGUIENTE ›
          </button>
        </div>
      )}
      {editingId && <AdminPlayerEditor profileId={editingId} onClose={() => setEditingId(null)} />}
    </div>
  );
}
