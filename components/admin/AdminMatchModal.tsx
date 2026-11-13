"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMatches } from "@/context/MatchesContext";
import { useProfiles } from "@/context/ProfilesContext";
import {
  ADMIN_OPEN_STAT_FIELDS,
  adminOpenEventLabel,
  adminOpenStatFromSaved,
  buildOpenMatchPlayerIds,
  emptyAdminOpenStat,
  type AdminOpenStatEntry,
} from "@/lib/domain/adminOpenMatch";

interface EventEntry {
  min: number;
  text: string;
}

/**
 * Puerto fiel de openAdminMatch/adminStatChange/adminAddTime/adminToggleTimer/
 * adminFinalizeMatch/adminStartCorrection/adminSaveCorrection (app.js
 * ~7943-8264) + markup de #admin-match-modal (buscar-partido.html). Consola
 * admin de un partido de Modo Libre (open_matches): marcador, timer local,
 * box score por jugador y notas.
 */
export function AdminMatchModal({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const { openMatches, adminFinalizeOpenMatch, adminCorrectOpenMatch } = useMatches();
  const { profiles } = useProfiles();
  const match = openMatches.find((m) => m.id === matchId);

  const done = !!(match?.finalizado && match?.resultado);
  const playerIds = useMemo(() => (match ? buildOpenMatchPlayerIds(match) : []), [match]);

  // Precarga desde el partido ya finalizado (VER/CORREGIR), igual que
  // openAdminMatch — inicializadores perezosos (no un efecto) porque el modal
  // se monta de cero cada vez que se abre (matchId no cambia en caliente).
  const [stats, setStats] = useState<Record<string, AdminOpenStatEntry>>(() => {
    const init: Record<string, AdminOpenStatEntry> = {};
    if (done && match?.stats) {
      Object.entries(match.stats).forEach(([pid, saved]) => {
        init[pid] = adminOpenStatFromSaved(saved as Record<string, unknown>);
      });
    }
    return init;
  });
  const [calificaciones, setCalificaciones] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (done && match?.stats) {
      Object.entries(match.stats).forEach(([pid, saved]) => {
        const cal = (saved as { calificacion?: number })?.calificacion;
        init[pid] = cal != null ? String(cal) : "6.5";
      });
    }
    return init;
  });
  const [mvpId, setMvpId] = useState<string | null>(() => (done ? match?.mvpId || null : null));
  const [notes, setNotes] = useState(() => (done ? match?.notes || "" : ""));
  const [golesLocal, setGolesLocal] = useState(() => String((done && match?.resultado?.golesLocal) || 0));
  const [golesVisitante, setGolesVisitante] = useState(() => String((done && match?.resultado?.golesVisitante) || 0));
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [correcting, setCorrecting] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  if (!match) return null;

  const editable = !done || correcting;

  function statOf(pid: string): AdminOpenStatEntry {
    return stats[pid] || emptyAdminOpenStat();
  }

  function changeStat(pid: string, key: keyof AdminOpenStatEntry, delta: number) {
    const current = statOf(pid);
    const next = Math.max(0, (current[key] || 0) + delta);
    setStats((prev) => ({ ...prev, [pid]: { ...current, [key]: next } }));
    if (delta > 0) {
      const p = profiles[pid];
      const name = p ? p.nickname || p.name : pid;
      setEvents((prev) => [{ min: Math.floor(timerSeconds / 60), text: adminOpenEventLabel(key, name) }, ...prev]);
    }
  }

  function calOf(pid: string): string {
    return calificaciones[pid] ?? "6.5";
  }

  function timerLabel(): string {
    const m = Math.floor(timerSeconds / 60);
    const s = timerSeconds % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function buildFormInput() {
    const calNums: Record<string, number> = {};
    playerIds.forEach((pid) => {
      calNums[pid] = parseFloat(calOf(pid)) || 6.5;
    });
    return {
      golesLocal: parseInt(golesLocal, 10) || 0,
      golesVisitante: parseInt(golesVisitante, 10) || 0,
      notes: notes.trim(),
      mvpId,
      stats,
      calificaciones: calNums,
    };
  }

  async function finalize() {
    const res = await adminFinalizeOpenMatch(matchId, buildFormInput());
    if (!res.ok) {
      if (res.error) alert(res.error);
      return;
    }
    onClose();
    alert("✅ Estadísticas enviadas y cartas actualizadas.");
  }

  function startCorrection() {
    if (
      !confirm(
        'Vas a corregir el box score ya cargado.\n\nOVR, XP y el historial YA aplicados NO se recalculan automáticamente — solo se corrige el detalle guardado. Si necesitás ajustar la carta de un jugador, hacelo desde "Editar jugador".\n\n¿Continuar?'
      )
    )
      return;
    setCorrecting(true);
  }

  async function saveCorrection() {
    if (!confirm("¿Guardar la corrección? El marcador y las cartas ya aplicadas NO cambian, solo el detalle del box score.")) return;
    const input = buildFormInput();
    const res = await adminCorrectOpenMatch(matchId, { stats: input.stats, calificaciones: input.calificaciones, mvpId: input.mvpId, notes: input.notes });
    if (!res.ok) return;
    setCorrecting(false);
    onClose();
    alert("✅ Corrección guardada. El marcador y las cartas ya aplicadas no cambiaron.");
  }

  return createPortal(
    <div className="modal-overlay admin-match-modal open" id="admin-match-modal">
      <div className="am-card">
        <div className="am-header">
          <div>
            <div className="am-match-title">⚙ {done ? "PARTIDO REGISTRADO" : "ADMINISTRAR PARTIDO"}</div>
            <div className="am-match-sub">
              {match.cancha || match.zona} · {match.fecha} · {match.horaValue || ""}
            </div>
          </div>
          <button className="am-close-btn" onClick={onClose}>
            ✕ CERRAR
          </button>
        </div>

        <div className="am-scoreboard">
          <div className="am-score-team">LOCAL</div>
          <input
            className="am-score-input"
            type="number"
            min={0}
            value={golesLocal}
            disabled={done}
            onChange={(e) => setGolesLocal(e.target.value)}
          />
          <div className="am-score-sep">·</div>
          <input
            className="am-score-input"
            type="number"
            min={0}
            value={golesVisitante}
            disabled={done}
            onChange={(e) => setGolesVisitante(e.target.value)}
          />
          <div className="am-score-team">VISITANTE</div>
        </div>

        <div className="am-timer">
          <span id="am-timer-display">{timerLabel()}</span>
          <button className="am-timer-btn" onClick={() => setTimerSeconds((s) => s + 60)}>
            +1 MIN
          </button>
          <button className="am-timer-btn" onClick={() => setTimerSeconds((s) => s + 5 * 60)}>
            +5 MIN
          </button>
          <button className="am-timer-btn" onClick={() => setTimerSeconds((s) => s + 10 * 60)}>
            +10 MIN
          </button>
          <button className="am-timer-btn" onClick={() => setTimerRunning((r) => !r)}>
            {timerRunning ? "⏹ DETENER" : "▶ INICIAR"}
          </button>
        </div>

        <div className="am-table-wrap">
          <table className="am-table">
            <thead>
              <tr>
                <th>JUGADOR</th>
                {ADMIN_OPEN_STAT_FIELDS.map((f) => (
                  <th key={f.key}>{f.label}</th>
                ))}
                <th>CALIF (1-10)</th>
                <th>MVP</th>
              </tr>
            </thead>
            <tbody>
              {playerIds.map((pid) => {
                const p = profiles[pid];
                const s = statOf(pid);
                return (
                  <tr key={pid} data-pid={pid}>
                    <td className="am-name-cell">
                      {p ? p.nickname || p.name : pid}
                      <br />
                      <span className="am-pos">
                        {p?.position || "?"} · OVR {p?.ovr ?? 60}
                      </span>
                    </td>
                    {ADMIN_OPEN_STAT_FIELDS.map((f) => (
                      <td className="am-stat-cell" key={f.key}>
                        {editable ? (
                          <>
                            <button className="am-btn-minus" onClick={() => changeStat(pid, f.key, -1)}>
                              −
                            </button>{" "}
                            <span>{s[f.key] || 0}</span>{" "}
                            <button className="am-btn-plus" onClick={() => changeStat(pid, f.key, 1)}>
                              +
                            </button>
                          </>
                        ) : (
                          <span>{s[f.key] || 0}</span>
                        )}
                      </td>
                    ))}
                    <td>
                      <input
                        className="am-cal-input"
                        type="number"
                        min={1}
                        max={10}
                        step={0.5}
                        value={calOf(pid)}
                        disabled={!editable}
                        onChange={(e) => setCalificaciones((prev) => ({ ...prev, [pid]: e.target.value }))}
                      />
                    </td>
                    <td>
                      <input
                        type="radio"
                        name="am-mvp"
                        checked={mvpId === pid}
                        disabled={!editable}
                        onChange={() => setMvpId(pid)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="am-events">
          <div className="am-events-title">EVENTOS</div>
          <div className="am-events-list">
            {events.map((e, i) => (
              <div className="am-event-item" key={i}>
                {e.min}&apos; · {e.text}
              </div>
            ))}
          </div>
        </div>

        <div className="am-notes-wrap">
          <label className="am-notes-label">NOTAS DEL PARTIDO</label>
          <textarea
            className="am-notes"
            rows={3}
            placeholder="Observaciones, incidentes, etc."
            disabled={!editable}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {done ? (
          correcting ? (
            <button className="am-finalize-btn" onClick={saveCorrection}>
              💾 GUARDAR CORRECCIÓN
            </button>
          ) : (
            <button className="am-finalize-btn" onClick={startCorrection}>
              ✏️ CORREGIR DATOS CARGADOS
            </button>
          )
        ) : (
          <button className="am-finalize-btn" onClick={finalize}>
            ✅ FINALIZAR Y ENVIAR ESTADÍSTICAS
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
