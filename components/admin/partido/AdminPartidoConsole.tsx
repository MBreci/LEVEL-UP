"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTeams } from "@/context/TeamsContext";
import { useProfiles } from "@/context/ProfilesContext";
import { useHasMounted } from "@/hooks/useHasMounted";
import { getLS } from "@/lib/storage";
import { AP_FIELD_POS_STATS, AP_NEG_STATS, AP_POR_POS_STATS, apDraftKey, type ApDraft, type ApEventEntry, type ApStatValues } from "@/lib/domain/adminTeamMatch";
import { Scoreboard } from "@/components/admin/partido/Scoreboard";
import { StatsTable } from "@/components/admin/partido/StatsTable";
import { BottomPanels } from "@/components/admin/partido/BottomPanels";
import type { TeamMatch } from "@/types/team";

interface ApFormState {
  stats: Record<string, ApStatValues>;
  mvpId: string | null;
  notes: string;
  timerSecs: number;
  events: ApEventEntry[];
}

function loadInitialFormState(match: TeamMatch | undefined): ApFormState {
  const empty: ApFormState = { stats: {}, mvpId: null, notes: "", timerSecs: 0, events: [] };
  if (!match) return empty;
  const done = match.estado === "finalizado" && !!match.resultado;
  if (done && match.stats) {
    const stats: Record<string, ApStatValues> = {};
    Object.entries(match.stats).forEach(([pid, saved]) => {
      stats[pid] = { ...(saved as ApStatValues) };
    });
    return { stats, mvpId: match.mvpId || null, notes: match.notes || "", timerSecs: 0, events: [] };
  }
  try {
    const raw = getLS().getItem(apDraftKey(match.id));
    if (raw) {
      const draft = JSON.parse(raw) as Partial<ApDraft>;
      return {
        stats: draft.stats || {},
        mvpId: draft.mvpId ?? null,
        notes: draft.notes || "",
        timerSecs: draft.timerSecs || 0,
        events: draft.events || [],
      };
    }
  } catch {
    /* borrador corrupto o localStorage bloqueado: se ignora, arranca en blanco */
  }
  return empty;
}

function timerToLabel(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

const ALL_AP_FIELDS = [...AP_FIELD_POS_STATS, ...AP_POR_POS_STATS, ...AP_NEG_STATS];

const PERIOD_LABELS: Record<string, string> = {
  "1": "PRIMER TIEMPO",
  "2": "SEGUNDO TIEMPO",
  et1: "TIEMPO EXTRA 1",
  et2: "TIEMPO EXTRA 2",
  pen: "PENALTIS",
};

/**
 * Orquestador de /admin/partido (pieza 3 de Fase 5) — puerto fiel de
 * initAdminPage + todo el estado module-level de admin-partido.html
 * (_apStats/_apMvpId/_apTimerSecs/_apEvents/_apCorrectionMode), modelado como
 * estado de React en vez de variables globales.
 */
export function AdminPartidoConsole() {
  const { profile: me, isAdmin } = useAuth();
  const router = useRouter();
  const hasMounted = useHasMounted();
  const searchParams = useSearchParams();
  const matchId = searchParams.get("m");

  const { teams, teamMatches, adminFinalizeTeamMatch, adminCorrectTeamMatch, cancelTeamMatch } = useTeams();
  const { profiles } = useProfiles();

  const match = matchId ? teamMatches.find((m) => m.id === matchId) : undefined;
  const teamA = match ? teams[match.teamAId] : undefined;
  const teamB = match ? teams[match.teamBId] : undefined;
  const done = !!(match && match.estado === "finalizado" && match.resultado);

  const [form, setForm] = useState<ApFormState>(() => loadInitialFormState(match));
  const [timerRunning, setTimerRunning] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [period, setPeriod] = useState("1");
  const [autosaveLabel, setAutosaveLabel] = useState("Los cambios se guardan automáticamente cada 15 segundos");

  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    if (hasMounted && !isAdmin) router.replace("/dashboard");
  }, [hasMounted, isAdmin, router]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setForm((prev) => ({ ...prev, timerSecs: prev.timerSecs + 1 })), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // Autoguardado cada 15s mientras no esté finalizado (apSaveDraft en un setInterval).
  useEffect(() => {
    if (!match || done) return;
    const id = setInterval(() => {
      const f = formRef.current;
      try {
        const draft: ApDraft = { stats: f.stats, mvpId: f.mvpId, timerSecs: f.timerSecs, events: f.events, notes: f.notes };
        getLS().setItem(apDraftKey(match.id), JSON.stringify(draft));
      } catch {
        /* localStorage bloqueado: se ignora, el estado sigue en memoria */
      }
      const now = new Date();
      setAutosaveLabel("Guardado: " + now.toLocaleTimeString("es-CO", { hour12: false }));
    }, 15000);
    return () => clearInterval(id);
  }, [match, done]);

  const editable = !done || correcting;

  function teamSum(team: typeof teamA, key: string): number {
    return (team?.memberIds || []).reduce((s, pid) => s + (pid ? form.stats[pid]?.[key] || 0 : 0), 0);
  }

  const golesA = done && match?.resultado ? match.resultado.golesA : teamSum(teamA, "goles");
  const golesB = done && match?.resultado ? match.resultado.golesB : teamSum(teamB, "goles");

  function changeStat(pid: string, key: string, delta: number) {
    setForm((prev) => {
      const cur = prev.stats[pid] || {};
      const nextVal = Math.max(0, (cur[key] || 0) + delta);
      const stats = { ...prev.stats, [pid]: { ...cur, [key]: nextVal } };
      let events = prev.events;
      if (delta > 0) {
        const p = profiles[pid];
        const name = p ? p.nickname || p.name : pid;
        const side = (teamA?.memberIds || []).includes(pid) ? "A" : "B";
        const teamName = side === "A" ? teamA?.name || "LOCAL" : teamB?.name || "VISITANTE";
        const teamColor = side === "A" ? teamA?.color || "#00e676" : teamB?.color || "#ff1f44";
        const label = ALL_AP_FIELDS.find((d) => d.key === key)?.label || key;
        events = [{ min: Math.floor(prev.timerSecs / 60), text: `${name} (${teamName}) — ${label}`, dotColor: teamColor }, ...prev.events];
      }
      return { ...prev, stats, events };
    });
  }

  function saveDraftNow() {
    if (!match) return;
    const draft: ApDraft = { stats: form.stats, mvpId: form.mvpId, timerSecs: form.timerSecs, events: form.events, notes: form.notes };
    try {
      getLS().setItem(apDraftKey(match.id), JSON.stringify(draft));
    } catch {
      /* localStorage bloqueado */
    }
    setAutosaveLabel("Guardado: " + new Date().toLocaleTimeString("es-CO", { hour12: false }));
  }

  async function handleFinalize() {
    if (!match || !teamA || !teamB) return;
    const label =
      golesA > golesB
        ? `${teamA.name} gana ${golesA}-${golesB} a ${teamB.name}`
        : golesA < golesB
          ? `${teamB.name} gana ${golesB}-${golesA} a ${teamA.name}`
          : `Empate ${golesA}-${golesB}`;
    if (!confirm(`¿Confirmar resultado?\n\n${label}\n\nEsto actualizará OVR y estadísticas de todos los jugadores.`)) return;
    const res = await adminFinalizeTeamMatch(match.id, { stats: form.stats, mvpId: form.mvpId, notes: form.notes.trim() });
    if (!res.ok) {
      if (res.error) alert(res.error);
      return;
    }
    try {
      getLS().removeItem(apDraftKey(match.id));
    } catch {
      /* ignore */
    }
    setTimerRunning(false);
    alert("Estadísticas enviadas y cartas actualizadas.");
    router.push("/equipos?tab=programados");
  }

  function startCorrection() {
    if (
      !confirm(
        'Vas a corregir el box score ya cargado.\n\nOVR, XP y el historial de los jugadores YA aplicados NO se recalculan automáticamente — solo se corrige el detalle guardado. Si necesitás ajustar la carta de un jugador, hacelo desde "Editar jugador".\n\n¿Continuar?'
      )
    )
      return;
    setCorrecting(true);
  }

  async function saveCorrection() {
    if (!match) return;
    if (!confirm("¿Guardar la corrección? El marcador y las cartas ya aplicadas NO cambian, solo el detalle del box score.")) return;
    const res = await adminCorrectTeamMatch(match.id, { stats: form.stats, mvpId: form.mvpId, notes: form.notes.trim() });
    if (!res.ok) return;
    setCorrecting(false);
    alert("Corrección guardada. El marcador y las cartas ya aplicadas no cambiaron.");
  }

  async function handleCancel() {
    if (!match) return;
    if (!confirm("¿Cancelar este partido? Esta acción no se puede deshacer.")) return;
    setTimerRunning(false);
    await cancelTeamMatch(match.id);
    router.back();
  }

  const resumen = useMemo(
    () => ({
      goles: { a: teamSum(teamA, "goles"), b: teamSum(teamB, "goles") },
      amarillas: { a: teamSum(teamA, "amarillas"), b: teamSum(teamB, "amarillas") },
      rojas: { a: teamSum(teamA, "rojas"), b: teamSum(teamB, "rojas") },
      tiros: { a: teamSum(teamA, "tirosAlArco"), b: teamSum(teamB, "tirosAlArco") },
      faltas: { a: teamSum(teamA, "faltasCometidas"), b: teamSum(teamB, "faltasCometidas") },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teamA, teamB, form.stats]
  );

  if (!hasMounted || !isAdmin) return null;

  if (!matchId) {
    return (
      <div className="ap-console">
        <div className="ap-error-banner">ERROR: No se especificó ID de partido.</div>
      </div>
    );
  }
  if (!match) {
    return (
      <div className="ap-console">
        <div className="ap-error-banner">
          Partido no encontrado. <a onClick={() => router.back()}>Volver</a>
        </div>
      </div>
    );
  }
  if (!teamA || !teamB) {
    return (
      <div className="ap-console">
        <div className="ap-error-banner">
          Equipos no encontrados en el sistema. <a onClick={() => router.back()}>Volver</a>
        </div>
      </div>
    );
  }

  return (
    <div className="ap-console">
      <div className="ap-topbar">
        <div className="ap-topbar-logo">
          LEVEL<span>UP</span>
        </div>
        <div className="ap-topbar-divider"></div>
        <div className="ap-topbar-arena">
          <div className="ap-topbar-arena-name">{match.cancha || "Cancha libre"}</div>
          <div className="ap-topbar-arena-loc">Bogotá, Colombia</div>
        </div>
        <div className="ap-topbar-divider"></div>
        <div className="ap-topbar-dt">
          <div className="ap-topbar-date">{match.fecha || ""}</div>
          <div className="ap-topbar-time">{match.hora || ""}</div>
        </div>
        <div className={`ap-topbar-status-badge ${done ? "done" : ""}`}>{done ? "PARTIDO FINALIZADO" : "PARTIDO OFICIAL"}</div>
        <div className="ap-topbar-id">ID: {match.id.replace("tm_", "").slice(-6).toUpperCase()}</div>
        <div className="ap-topbar-right">
          <div className="ap-autosave">
            <div className="ap-autosave-dot"></div>
            <span>GUARDADO AUTOMÁTICO</span>
          </div>
          <button className="ap-back-btn" onClick={() => router.back()}>
            VOLVER
          </button>
        </div>
      </div>

      <Scoreboard teamA={teamA} teamB={teamB} golesA={golesA} golesB={golesB} done={done} timerLabel={timerToLabel(form.timerSecs)} periodLabel={PERIOD_LABELS[period] || ""} resumen={resumen} />

      <StatsTable teamA={teamA} teamB={teamB} profiles={profiles} stats={form.stats} editable={editable} onStatChange={changeStat} />

      <BottomPanels
        events={form.events}
        timerLabel={timerToLabel(form.timerSecs)}
        timerRunning={timerRunning}
        onAddTime={(mins) => setForm((prev) => ({ ...prev, timerSecs: prev.timerSecs + mins * 60 }))}
        onToggleTimer={() => setTimerRunning((r) => !r)}
        period={period}
        onPeriodChange={setPeriod}
        notes={form.notes}
        onNotesChange={(v) => setForm((prev) => ({ ...prev, notes: v }))}
        notesEditable={editable}
        done={done}
        correcting={correcting}
        onStartCorrection={startCorrection}
        onSaveCorrection={saveCorrection}
        onFinalize={handleFinalize}
        onSaveDraft={saveDraftNow}
        onCancel={handleCancel}
        autosaveLabel={autosaveLabel}
        adminName={me ? me.nickname || me.name : "—"}
      />
    </div>
  );
}
