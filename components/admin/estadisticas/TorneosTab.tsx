"use client";

import { useState } from "react";
import { useTeams } from "@/context/TeamsContext";
import { useTournaments } from "@/context/TournamentsContext";
import { useProfiles } from "@/context/ProfilesContext";
import { calcTorneoStats } from "@/lib/domain/tournaments";
import { MatchDetailPanel, type ShOpenKey } from "@/components/admin/estadisticas/MatchDetailPanel";
import type { Tournament } from "@/types/tournament";

/**
 * Puerto fiel de renderStatsHubTorneos/renderStatsTorneoCard (app.js
 * ~7739-7809) + la restauración de crearPartidoTorneo (decisión B del brief
 * de Fase 5): un card de solo-lectura (partidos/posiciones/goleadores) POR
 * torneo, más el formulario "+ CREAR PARTIDO" que antes solo vivía en el
 * panel ⚙ ADMIN muerto — ahora es el único lugar donde se puede crear un
 * cruce de torneo.
 */
export function TorneosTab({ openKey, onToggle }: { openKey: ShOpenKey | null; onToggle: (matchId: string, esEquipo: boolean, wrapId: string) => void }) {
  const { tournaments } = useTournaments();
  const { teams, teamMatches, createTournamentMatch } = useTeams();
  const { profiles } = useProfiles();

  const list = Object.values(tournaments).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <div className="sh-section">
      <div className="adm-section-title" style={{ marginTop: 36 }}>
        TORNEOS
      </div>
      <div className="adm-torneo-list">
        {list.length === 0 ? (
          <div className="adm-empty">No hay torneos creados aún.</div>
        ) : (
          list.map((t) => (
            <TorneoCard key={t.id} t={t} teams={teams} teamMatches={teamMatches} profiles={profiles} openKey={openKey} onToggle={onToggle} createTournamentMatch={createTournamentMatch} />
          ))
        )}
      </div>
    </div>
  );
}

function TorneoCard({
  t,
  teams,
  teamMatches,
  profiles,
  openKey,
  onToggle,
  createTournamentMatch,
}: {
  t: Tournament;
  teams: ReturnType<typeof useTeams>["teams"];
  teamMatches: ReturnType<typeof useTeams>["teamMatches"];
  profiles: ReturnType<typeof useProfiles>["profiles"];
  openKey: ShOpenKey | null;
  onToggle: (matchId: string, esEquipo: boolean, wrapId: string) => void;
  createTournamentMatch: ReturnType<typeof useTeams>["createTournamentMatch"];
}) {
  const inscritos = (t.teams || []).map((e) => teams[e.teamId]).filter(Boolean);
  const { matches, scorersList, standingsList } = calcTorneoStats(t.id, teamMatches, teams, profiles);

  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [cancha, setCancha] = useState(t.cancha || "");

  async function submitCrear() {
    if (!teamAId || !teamBId) {
      alert("Selecciona los dos equipos.");
      return;
    }
    if (teamAId === teamBId) {
      alert("Los dos equipos deben ser distintos.");
      return;
    }
    if (!fecha) {
      alert("Ingresa la fecha del partido.");
      return;
    }
    const res = await createTournamentMatch({ torneoId: t.id, teamAId, teamBId, fecha, hora, cancha });
    if (!res.ok) {
      if (res.error) alert(res.error);
      return;
    }
    const teamA = teams[teamAId];
    const teamB = teams[teamBId];
    alert(`✅ Partido de torneo creado: ${teamA?.name || "?"} vs ${teamB?.name || "?"}.`);
    setTeamAId("");
    setTeamBId("");
    setFecha("");
    setHora("");
  }

  return (
    <div className="adm-torneo-card">
      <div className="adm-torneo-title">
        {t.nombre} <span className={`adm-badge adm-badge-${t.status === "abierto" ? "prog" : "done"}`}>{(t.status || "").toUpperCase()}</span>
      </div>
      <div className="adm-match-meta">
        {t.fecha || ""} · {inscritos.length} equipo(s) inscrito(s)
      </div>

      <div className="adm-torneo-subtitle">CREAR CRUCE</div>
      {inscritos.length >= 2 ? (
        <div className="adm-torneo-form">
          <select value={teamAId} onChange={(e) => setTeamAId(e.target.value)}>
            <option value="">Equipo A</option>
            {inscritos.map((tm) => (
              <option value={tm!.id} key={tm!.id}>
                {tm!.name}
              </option>
            ))}
          </select>
          <select value={teamBId} onChange={(e) => setTeamBId(e.target.value)}>
            <option value="">Equipo B</option>
            {inscritos.map((tm) => (
              <option value={tm!.id} key={tm!.id}>
                {tm!.name}
              </option>
            ))}
          </select>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          <input type="text" placeholder="Cancha" value={cancha} onChange={(e) => setCancha(e.target.value)} />
          <button className="adm-edit-btn" onClick={submitCrear}>
            + CREAR PARTIDO
          </button>
        </div>
      ) : (
        <div className="adm-empty">Necesita al menos 2 equipos inscritos para crear cruces.</div>
      )}

      <div className="adm-torneo-subtitle">PARTIDOS</div>
      {matches.length === 0 ? (
        <div className="adm-empty">Sin partidos para este torneo todavía.</div>
      ) : (
        matches.map((m) => {
          const teamA = teams[m.teamAId];
          const teamB = teams[m.teamBId];
          const done = m.estado === "finalizado" && !!m.resultado;
          const badge = done ? `${m.resultado!.golesA}-${m.resultado!.golesB}` : "SIN REGISTRAR";
          const wrapId = "sh-tn-detail-" + m.id;
          const isOpen = openKey?.matchId === m.id && openKey?.wrapId === wrapId;
          return (
            <div className="adm-match-row sh-match-row" key={m.id}>
              <div className="adm-match-info">
                <div className="adm-match-teams">
                  {teamA ? teamA.name : "?"} vs {teamB ? teamB.name : "?"}
                </div>
                <div className="adm-match-meta">
                  {m.fecha}
                  {m.hora ? " · " + m.hora : ""} · {m.cancha || ""}
                </div>
              </div>
              <span className={`adm-badge ${done ? "adm-badge-done" : "adm-badge-prog"}`}>{badge}</span>
              <button className="adm-edit-btn" onClick={() => onToggle(m.id, true, wrapId)}>
                {done ? "VER / CORREGIR" : "CARGAR ESTADÍSTICAS"}
              </button>
              <div className={`sh-detail${isOpen ? " open" : ""}`}>{isOpen && <MatchDetailPanel key={wrapId} matchId={m.id} esEquipo onClose={() => onToggle(m.id, true, wrapId)} />}</div>
            </div>
          );
        })
      )}

      {standingsList.length > 0 && (
        <>
          <div className="adm-torneo-subtitle">POSICIONES</div>
          <table className="adm-torneo-table">
            <thead>
              <tr>
                <th>EQUIPO</th>
                <th>PJ</th>
                <th>PTS</th>
                <th>DG</th>
              </tr>
            </thead>
            <tbody>
              {standingsList.map((s) => (
                <tr key={s.teamId}>
                  <td>{s.name}</td>
                  <td>{s.w + s.d + s.l}</td>
                  <td>{s.pts}</td>
                  <td>
                    {s.dg > 0 ? "+" : ""}
                    {s.dg}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {scorersList.length > 0 && (
        <>
          <div className="adm-torneo-subtitle">GOLEADORES</div>
          <table className="adm-torneo-table">
            <thead>
              <tr>
                <th>JUGADOR</th>
                <th>G</th>
                <th>A</th>
              </tr>
            </thead>
            <tbody>
              {scorersList.map((s) => (
                <tr key={s.pid}>
                  <td>{s.name}</td>
                  <td>{s.goles}</td>
                  <td>{s.asistencias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
