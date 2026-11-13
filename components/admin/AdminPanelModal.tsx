"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfiles } from "@/context/ProfilesContext";
import { useTeams } from "@/context/TeamsContext";
import { useMatches } from "@/context/MatchesContext";
import { adminPanelPlayerMatches, adminPlayerCompleteness } from "@/lib/domain/adminPlayers";
import { isTeamMatchPast } from "@/lib/domain/teams";
import { matchDateTime } from "@/lib/domain/matches";
import { AdminPlayerEditor } from "@/components/admin/AdminPlayerEditor";
import { AdminMatchModal } from "@/components/admin/AdminMatchModal";
import { TorneosTab } from "@/components/admin/estadisticas/TorneosTab";
import type { ShOpenKey } from "@/components/admin/estadisticas/MatchDetailPanel";

/**
 * Puerto fiel de renderAdminPanel (app.js ~7834-7924) — el modal "⚙ ADMIN"
 * resucitado (decisión C del brief de Fase 5): antes openAdminPanel()
 * redirigía en silencio al dashboard porque #admin-panel-modal no existía en
 * ningún HTML. JUGADORES/PARTIDOS REY DEL BARRIO/PARTIDOS MODO LIBRE/TORNEOS,
 * reutilizando el editor de jugador (pieza 1), la consola /admin/partido
 * (pieza 3) para Rey del Barrio, el modal de Modo Libre (pieza 2), y el
 * mismo componente de torneos que la pestaña TORNEOS del Centro de
 * Estadísticas (pieza 4) para no duplicar el formulario "+ CREAR PARTIDO".
 */
export function AdminPanelModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { profiles } = useProfiles();
  const { teams, teamMatches } = useTeams();
  const { openMatches } = useMatches();

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openLibreMatchId, setOpenLibreMatchId] = useState<string | null>(null);
  const [torneoOpenKey, setTorneoOpenKey] = useState<ShOpenKey | null>(null);
  const [now] = useState(() => Date.now());

  const allPlayers = Object.values(profiles)
    .filter((p) => adminPanelPlayerMatches(p, search))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const rbMatches = [...teamMatches].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  const freeMatches = [...openMatches].sort((a, b) => matchDateTime(b).getTime() - matchDateTime(a).getTime()).slice(0, 20);

  function toggleTorneoDetail(matchId: string, esEquipo: boolean, wrapId: string) {
    setTorneoOpenKey((prev) => (prev && prev.matchId === matchId && prev.wrapId === wrapId ? null : { matchId, esEquipo, wrapId }));
  }

  return (
    <div className="modal-overlay open">
      <div className="adm-card">
        <div className="adm-header">
          <div className="adm-title">⚙ ADMIN</div>
          <button className="adm-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="adm-body">
          <div className="adm-section-title">
            JUGADORES <span className="adm-count">{allPlayers.length}</span>
          </div>
          <input
            className="adm-search"
            type="text"
            autoComplete="off"
            placeholder="🔍 Buscar por apodo, nombre, posición o equipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="adm-player-list">
            {allPlayers.length === 0 ? (
              <div className="adm-no-results">No se encontró ningún jugador.</div>
            ) : (
              allPlayers.map((p) => {
                const complete = adminPlayerCompleteness(p);
                const ph = p.physical || { weight: null, height: null, age: null, foot: null };
                return (
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
                      <div className="adm-player-name">{p.nickname || p.name}</div>
                      <div className="adm-player-meta">
                        {p.position || "—"} · {ph.height ? ph.height + "cm" : "—"} · {ph.weight ? ph.weight + "kg" : "—"} · {ph.foot || "—"}
                      </div>
                    </div>
                    <span className="adm-status">{complete ? "✅" : "⚠️"}</span>
                    <button className="adm-edit-btn" onClick={() => setEditingId(p.id)}>
                      EDITAR
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="adm-section-title" style={{ marginTop: 28 }}>
            PARTIDOS REY DEL BARRIO
          </div>
          <div className="adm-match-list">
            {rbMatches.length === 0 ? (
              <div className="adm-empty">No hay partidos de equipo aún.</div>
            ) : (
              rbMatches.map((m) => {
                const past = isTeamMatchPast(m);
                const done = m.estado === "finalizado" && !!m.resultado;
                const badge = done ? `${m.resultado!.golesA}-${m.resultado!.golesB}` : past ? "SIN REGISTRAR" : "PROGRAMADO";
                const badgeCls = done ? "adm-badge-done" : past ? "adm-badge-old" : "adm-badge-prog";
                return (
                  <div className="adm-match-row" key={m.id}>
                    <div className="adm-match-info">
                      <div className="adm-match-teams">
                        {teams[m.teamAId]?.name || "?"} vs {teams[m.teamBId]?.name || "?"}
                      </div>
                      <div className="adm-match-meta">
                        {m.fecha}
                        {m.hora ? " · " + m.hora : ""} · {m.cancha}
                      </div>
                    </div>
                    <span className={`adm-badge ${badgeCls}`}>{badge}</span>
                    {past && !done && (
                      <button className="adm-edit-btn" onClick={() => router.push(`/admin/partido?m=${m.id}`)}>
                        REGISTRAR
                      </button>
                    )}
                    {done && (
                      <button className="adm-edit-btn adm-edit-btn-gray" onClick={() => router.push(`/admin/partido?m=${m.id}`)}>
                        VER
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="adm-section-title" style={{ marginTop: 28 }}>
            PARTIDOS MODO LIBRE
          </div>
          <div className="adm-match-list">
            {freeMatches.length === 0 ? (
              <div className="adm-empty">No hay partidos de Modo Libre aún.</div>
            ) : (
              freeMatches.map((m) => {
                const past = matchDateTime(m).getTime() < now - 2 * 60 * 60 * 1000;
                const done = !!(m.finalizado && m.resultado);
                const badge = done ? `${m.resultado!.golesLocal || 0}-${m.resultado!.golesVisitante || 0}` : past ? "SIN REGISTRAR" : "PROGRAMADO";
                const badgeCls = done ? "adm-badge-done" : past ? "adm-badge-old" : "adm-badge-prog";
                return (
                  <div className="adm-match-row" key={m.id}>
                    <div className="adm-match-info">
                      <div className="adm-match-teams">{m.cancha || m.zona || "Partido"}</div>
                      <div className="adm-match-meta">
                        {m.fecha}
                        {m.horaValue ? " · " + m.horaValue : ""}
                      </div>
                    </div>
                    <span className={`adm-badge ${badgeCls}`}>{badge}</span>
                    {past && !done && (
                      <button className="adm-edit-btn" onClick={() => setOpenLibreMatchId(m.id)}>
                        REGISTRAR
                      </button>
                    )}
                    {done && (
                      <button className="adm-edit-btn adm-edit-btn-gray" onClick={() => setOpenLibreMatchId(m.id)}>
                        VER
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="adm-section-title" style={{ marginTop: 28 }}>
            TORNEOS
          </div>
          <TorneosTab openKey={torneoOpenKey} onToggle={toggleTorneoDetail} />
        </div>
      </div>

      {editingId && <AdminPlayerEditor profileId={editingId} onClose={() => setEditingId(null)} />}
      {openLibreMatchId && <AdminMatchModal matchId={openLibreMatchId} onClose={() => setOpenLibreMatchId(null)} />}
    </div>
  );
}
