"use client";

import { useState } from "react";
import { useTeams } from "@/context/TeamsContext";
import { useMatches } from "@/context/MatchesContext";
import { useProfiles } from "@/context/ProfilesContext";
import { playerTeamLabel } from "@/lib/domain/teams";
import {
  SH_LIBRE_STATS,
  SH_TEAM_FIELD_STATS,
  SH_TEAM_NEG_STATS,
  SH_TEAM_POR_STATS,
  shCalcRating,
  shCalcRatingLibre,
  statsHubBuildM2Libre,
  statsHubBuildM2Team,
  statsHubOpenMatchPlayerIds,
  statsHubPreviewText,
  statsHubTeamMatchPlayerIds,
  statsMapHasStoredDeltas,
  type ShStatValues,
} from "@/lib/domain/adminStatsHub";

/** Identifica el único detalle de partido abierto en toda la página (igual que _shOpenMatchId/_shOpenWrapId). */
export interface ShOpenKey {
  matchId: string;
  esEquipo: boolean;
  wrapId: string;
}

/**
 * Panel inline de carga/corrección de un partido — puerto fiel de
 * statsHubRenderDetail/statsHubBuildPlayerRow/statsHubUpdateRowPreview/
 * statsHubSaveMatch/statsHubResetMatch (app.js ~7297-7628). Se monta con un
 * `key` distinto por partido (ver PartidosTab/TorneosTab) para que el estado
 * de edición nunca se resetee por un sync de fondo de 45s — solo se
 * reinicializa si el admin cierra y vuelve a abrir el mismo partido.
 */
export function MatchDetailPanel({ matchId, esEquipo, onClose }: { matchId: string; esEquipo: boolean; onClose: () => void }) {
  const { teams, teamMatches, statsHubSaveTeamMatch, statsHubResetTeamMatch } = useTeams();
  const { openMatches, statsHubSaveOpenMatch, statsHubResetOpenMatch } = useMatches();
  const { profiles } = useProfiles();

  const teamMatch = esEquipo ? teamMatches.find((m) => m.id === matchId) : undefined;
  const openMatch = !esEquipo ? openMatches.find((m) => m.id === matchId) : undefined;
  const teamA = teamMatch ? teams[teamMatch.teamAId] : undefined;
  const teamB = teamMatch ? teams[teamMatch.teamBId] : undefined;

  const done = esEquipo ? !!(teamMatch?.estado === "finalizado" && teamMatch?.resultado) : !!(openMatch?.finalizado && openMatch?.resultado);
  const savedStats = (esEquipo ? teamMatch?.stats : openMatch?.stats) as Record<string, ShStatValues & { ovrDelta?: number; xpGain?: number; lpGain?: number }> | undefined;

  const [stats, setStats] = useState<Record<string, ShStatValues>>(() => {
    const init: Record<string, ShStatValues> = {};
    if (done && savedStats) Object.entries(savedStats).forEach(([pid, s]) => (init[pid] = { ...s }));
    return init;
  });
  const [mvpId, setMvpId] = useState<string | null>(() => (esEquipo ? teamMatch?.mvpId || null : openMatch?.mvpId || null));
  const [notes, setNotes] = useState(() => (esEquipo ? teamMatch?.notes || "" : openMatch?.notes || ""));
  const [golesA, setGolesA] = useState(() => String((esEquipo && teamMatch?.resultado?.golesA) || 0));
  const [golesB, setGolesB] = useState(() => String((esEquipo && teamMatch?.resultado?.golesB) || 0));
  const [golesLocal, setGolesLocal] = useState(() => String((!esEquipo && openMatch?.resultado?.golesLocal) || 0));
  const [golesVisitante, setGolesVisitante] = useState(() => String((!esEquipo && openMatch?.resultado?.golesVisitante) || 0));
  const [correcting, setCorrecting] = useState(false);

  if (esEquipo && (!teamMatch || !teamA || !teamB)) return null;
  if (!esEquipo && !openMatch) return null;

  const editable = !done || correcting;
  const playerIds = esEquipo ? statsHubTeamMatchPlayerIds(teamA, teamB) : statsHubOpenMatchPlayerIds(openMatch!);

  function statOf(pid: string): ShStatValues {
    return stats[pid] || {};
  }

  function setStat(pid: string, key: string, rawValue: string) {
    const val = Math.max(0, parseInt(rawValue, 10) || 0);
    setStats((prev) => ({ ...prev, [pid]: { ...(prev[pid] || {}), [key]: val } }));
  }

  function buildM2(pid: string) {
    const s = statOf(pid);
    const mvp = pid === mvpId;
    if (esEquipo) {
      const p = profiles[pid];
      return statsHubBuildM2Team(p?.position, s, mvp);
    }
    return statsHubBuildM2Libre(s, mvp);
  }

  function scoreSum(key: "goles"): { a: number; b: number } {
    const sum = (team: typeof teamA) => (team?.memberIds || []).reduce((s, pid) => s + (pid ? stats[pid]?.[key] || 0 : 0), 0);
    return { a: sum(teamA), b: sum(teamB) };
  }

  async function handleFinalize() {
    if (esEquipo && teamMatch && teamA && teamB) {
      const gA = parseInt(golesA, 10) || 0;
      const gB = parseInt(golesB, 10) || 0;
      const label = gA > gB ? `${teamA.name} gana ${gA}-${gB} a ${teamB.name}` : gA < gB ? `${teamB.name} gana ${gB}-${gA} a ${teamA.name}` : `Empate ${gA}-${gB}`;
      if (!confirm(`¿Confirmar resultado?\n\n${label}\n\nEsto actualizará OVR y estadísticas de todos los jugadores.`)) return;
      const res = await statsHubSaveTeamMatch(matchId, { golesA: gA, golesB: gB, notes, mvpId, stats }, false);
      if (!res.ok) return;
      alert(`Resultado registrado.\n\n${label}`);
      onClose();
    } else if (openMatch) {
      const gL = parseInt(golesLocal, 10) || 0;
      const gV = parseInt(golesVisitante, 10) || 0;
      if (!confirm("¿Confirmar y enviar estas estadísticas?")) return;
      const res = await statsHubSaveOpenMatch(matchId, { golesLocal: gL, golesVisitante: gV, notes, mvpId, stats, playerIds }, false);
      if (!res.ok) return;
      alert("Estadísticas enviadas y cartas actualizadas.");
      onClose();
    }
  }

  function startCorrection() {
    if (
      !confirm(
        "Vas a corregir este partido.\n\nAl guardar la corrección se revierte con precisión lo que ya se le había sumado a cada jugador (OVR/XP/LP/goles/asistencias) y se vuelve a calcular todo con los datos corregidos que cargues acá. No se pierde nada: se ajusta sobre el puntaje actual de cada jugador.\n\n¿Continuar?"
      )
    )
      return;
    setCorrecting(true);
  }

  async function saveCorrection() {
    const hasDeltas = statsMapHasStoredDeltas(savedStats);
    if (esEquipo && teamMatch && teamA && teamB) {
      const gA = parseInt(golesA, 10) || 0;
      const gB = parseInt(golesB, 10) || 0;
      const label = gA > gB ? `${teamA.name} gana ${gA}-${gB} a ${teamB.name}` : gA < gB ? `${teamB.name} gana ${gB}-${gA} a ${teamA.name}` : `Empate ${gA}-${gB}`;
      if (
        !confirm(
          `¿Corregir este partido completo?\n\n${label}\n\nSe va a REVERTIR con precisión lo que ya se le había sumado a cada jugador y al récord de los equipos con los datos anteriores, y se vuelve a calcular todo (OVR/XP/LP/goles/asistencias/partidos jugados) con los datos corregidos que cargaste. No se borra nada del jugador: se ajusta sobre su puntaje actual.`
        )
      )
        return;
      if (
        !hasDeltas &&
        !confirm(
          "Este partido se cargó antes de que existiera esta función y no tiene guardado lo que aplicó la primera vez, así que no se puede revertir con precisión. Si continuás, lo nuevo se va a SUMAR encima de lo que ya tenía cada jugador, sin restar lo viejo primero.\n\n¿Continuar de todos modos?"
        )
      )
        return;
      const res = await statsHubSaveTeamMatch(matchId, { golesA: gA, golesB: gB, notes, mvpId, stats }, true);
      if (!res.ok) return;
      alert(`Corrección guardada.\n\n${label}\n\nEl puntaje de cada jugador quedó recalculado con los datos corregidos.`);
      setCorrecting(false);
      onClose();
    } else if (openMatch) {
      const gL = parseInt(golesLocal, 10) || 0;
      const gV = parseInt(golesVisitante, 10) || 0;
      if (
        !confirm(
          "Vas a corregir este partido completo.\n\nSe va a REVERTIR con precisión lo que ya se le había sumado a cada jugador con los datos anteriores, y se vuelve a calcular todo (OVR/XP/LP/goles/asistencias/partidos jugados) con los datos corregidos. No se borra nada del jugador: se ajusta sobre su puntaje actual.\n\n¿Continuar?"
        )
      )
        return;
      if (
        !hasDeltas &&
        !confirm(
          "Este partido se cargó antes de que existiera esta función y no tiene guardado lo que aplicó la primera vez, así que no se puede revertir con precisión. Si continuás, lo nuevo se va a SUMAR encima de lo que ya tenía cada jugador, sin restar lo viejo primero.\n\n¿Continuar de todos modos?"
        )
      )
        return;
      const res = await statsHubSaveOpenMatch(matchId, { golesLocal: gL, golesVisitante: gV, notes, mvpId, stats, playerIds }, true);
      if (!res.ok) return;
      alert("Corrección guardada. El puntaje de cada jugador quedó recalculado con los datos corregidos.");
      setCorrecting(false);
      onClose();
    }
  }

  async function handleReset() {
    const hasDeltas = statsMapHasStoredDeltas(savedStats);
    const warn = hasDeltas
      ? 'Esto va a REVERTIR el registro de este partido: se restan el OVR/XP/LP/goles/asistencias/partidos jugados que ganó cada jugador, y el partido vuelve a quedar "sin registrar" para cargarlo de nuevo.\n\n¿Seguro que este partido se marcó por error?'
      : 'Este partido no tiene guardados los deltas que aplicó (se cargó antes de esta función) — solo se puede reiniciar el ESTADO del partido. El OVR/XP/goles/asistencias que ya se le sumaron a cada jugador NO se revierten solos; si hace falta, corregilos a mano desde "Editar jugador".\n\n¿Continuar igual?';
    if (!confirm(warn)) return;
    const res = esEquipo ? await statsHubResetTeamMatch(matchId) : await statsHubResetOpenMatch(matchId);
    if (!res.ok) return;
    alert("Partido reiniciado. Ya podés volver a cargar sus estadísticas.");
    onClose();
  }

  function renderPlayerRow(pid: string) {
    const p = profiles[pid];
    if (!p) return null;
    const isPor = esEquipo && p.position === "POR";
    const fields = esEquipo ? (isPor ? SH_TEAM_POR_STATS : SH_TEAM_FIELD_STATS) : SH_LIBRE_STATS;
    const negFields = esEquipo ? SH_TEAM_NEG_STATS : [];
    const s = statOf(pid);
    const rating = esEquipo ? shCalcRating(p.position, s) : shCalcRatingLibre(s);
    const m2 = buildM2(pid);
    const stored = savedStats?.[pid];
    const preview = statsHubPreviewText(p, m2, done, correcting, stored);
    const dorsal = p.dorsal === 0 || p.dorsal ? `#${p.dorsal} ` : "";

    return (
      <div className="sh-player-row" key={pid} data-pid={pid}>
        <div className="sh-player-name">
          {dorsal}
          {p.nickname || p.name} <span className="sh-player-pos">{p.position}</span>
          {!esEquipo && <span className="sh-player-team">{playerTeamLabel(p, teams)}</span>}
        </div>
        <div className="sh-stat-cells">
          {[...fields, ...negFields].map((f) => (
            <div className="sh-stat-cell" key={f.key}>
              <span className="sh-stat-name">{f.label}</span>
              {editable ? (
                <input className="sh-stat-num" type="number" min={0} value={s[f.key] || 0} onChange={(e) => setStat(pid, f.key, e.target.value)} />
              ) : (
                <span>{s[f.key] || 0}</span>
              )}
            </div>
          ))}
        </div>
        <div className="sh-cal-wrap">
          CALIF <span className="sh-cal-auto">{rating.toFixed(1)}</span>
        </div>
        <label className="sh-mvp-wrap">
          <input type="radio" name={`sh-mvp-${matchId}`} checked={mvpId === pid} disabled={!editable} onChange={() => setMvpId(pid)} /> MVP
        </label>
        <div className="sh-preview">{preview}</div>
      </div>
    );
  }

  const scoreHtml = esEquipo ? (
    <>
      <div className="sh-score-inputs">
        <b>{teamA?.name || "EQUIPO A"}</b>
        <input className="sh-cal-input" type="number" min={0} value={golesA} disabled={!editable} onChange={(e) => setGolesA(e.target.value)} />—
        <input className="sh-cal-input" type="number" min={0} value={golesB} disabled={!editable} onChange={(e) => setGolesB(e.target.value)} />
        <b>{teamB?.name || "EQUIPO B"}</b>
      </div>
      <div className="sh-score-hint">
        Suma de goles cargados por jugador (referencia): <span>{scoreSum("goles").a}-{scoreSum("goles").b}</span>
      </div>
    </>
  ) : (
    <div className="sh-score-inputs">
      LOCAL <input className="sh-cal-input" type="number" min={0} value={golesLocal} disabled={!editable} onChange={(e) => setGolesLocal(e.target.value)} /> · VISITANTE{" "}
      <input className="sh-cal-input" type="number" min={0} value={golesVisitante} disabled={!editable} onChange={(e) => setGolesVisitante(e.target.value)} />
    </div>
  );

  const actionHtml = !done ? (
    <button className="adm-edit-btn" onClick={handleFinalize}>
      FINALIZAR
    </button>
  ) : correcting ? (
    <button className="adm-edit-btn" onClick={saveCorrection}>
      GUARDAR CORRECCIÓN
    </button>
  ) : (
    <>
      <button className="adm-edit-btn" onClick={startCorrection}>
        CORREGIR
      </button>
      <button className="sh-btn-warn" onClick={handleReset}>
        MARCAR COMO SIN REGISTRAR
      </button>
    </>
  );

  return (
    <div className="sh-detail open">
      {scoreHtml}
      <div className="sh-players-wrap">
        {esEquipo ? (
          <>
            <div className="sh-team-block">
              <div className="sh-team-title">LOCAL · {teamA?.name || "?"}</div>
              {(teamA?.memberIds || []).map((pid) => (pid ? renderPlayerRow(pid) : null))}
            </div>
            <div className="sh-team-block">
              <div className="sh-team-title">VISITANTE · {teamB?.name || "?"}</div>
              {(teamB?.memberIds || []).map((pid) => (pid ? renderPlayerRow(pid) : null))}
            </div>
          </>
        ) : playerIds.length ? (
          playerIds.map((pid) => renderPlayerRow(pid))
        ) : (
          <div className="adm-empty">Sin jugadores confirmados.</div>
        )}
      </div>
      <textarea className="sh-notes" placeholder="Notas del partido" disabled={!editable} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="sh-detail-actions">{actionHtml}</div>
    </div>
  );
}
