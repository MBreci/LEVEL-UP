"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTeams } from "@/context/TeamsContext";
import { getMyTeam, getTeamMatchesFor } from "@/lib/domain/teams";
import { FinalizeMatchModal } from "@/components/equipos/FinalizeMatchModal";
import type { TeamMatch } from "@/types/team";

export function TeamMatchesPanel() {
  const { profile: me, isAdmin } = useAuth();
  const { teams, teamMatches } = useTeams();
  const [finalizeId, setFinalizeId] = useState<string | null>(null);
  const router = useRouter();

  if (!me) return <div className="rk-empty">Inicia sesión para ver tus partidos programados.</div>;
  const myTeam = getMyTeam(teams, me.id);
  if (!myTeam) return <div className="rk-empty">Aún no tienes equipo. Crea uno en &quot;CREAR EQUIPO / MI EQUIPO&quot;.</div>;

  const programados = getTeamMatchesFor(teamMatches, myTeam.id, "programado");
  const finalizados = getTeamMatchesFor(teamMatches, myTeam.id, "finalizado");
  const isCaptain = myTeam.captainId === me.id;

  function row(m: TeamMatch, finalized: boolean) {
    const rivalId = m.teamAId === myTeam!.id ? m.teamBId : m.teamAId;
    const rival = teams[rivalId];
    const canFinalize = !finalized && isCaptain && m.teamAId === myTeam!.id;
    const hasResult = finalized && m.resultado;
    const resultLabel = hasResult ? `${m.resultado!.golesA} - ${m.resultado!.golesB}` : finalized ? "SIN RESULTADO" : "PROGRAMADO";
    const badgeCls = finalized ? (hasResult ? "hist-badge-done" : "hist-badge-old") : "hist-badge-prog";
    return (
      <div className={`team-hist-row ${finalized ? "past" : ""}`} key={m.id}>
        <span className="thr-info">
          {m.fecha}
          {m.hora ? " · " + m.hora : ""} · {m.cancha}
        </span>
        <span className="thr-rival">
          {myTeam!.name} <span style={{ color: "var(--td)", fontSize: 11 }}>VS</span> {rival ? rival.name : "EQUIPO RIVAL"}
        </span>
        <span className={`thr-badge ${badgeCls}`}>{resultLabel}</span>
        {isAdmin && !finalized && (
          <button className="mm-admin-btn" onClick={() => router.push(`/admin/partido?m=${m.id}`)}>
            ⚙ REGISTRAR
          </button>
        )}
        {canFinalize && !isAdmin && (
          <button className="mm-invite-btn" onClick={() => setFinalizeId(m.id)}>
            FINALIZAR
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="sec-hdr">
        <div className="sec-eyebrow">PARTIDOS PROGRAMADOS</div>
      </div>
      <div className="team-hist-list">
        {programados.length ? programados.map((m) => row(m, false)) : <div className="rk-empty">No tienes partidos programados.</div>}
      </div>
      <div className="sec-hdr">
        <div className="sec-eyebrow">HISTORIAL</div>
      </div>
      <div className="team-hist-list">
        {finalizados.length ? finalizados.map((m) => row(m, true)) : <div className="rk-empty">Aún no has finalizado partidos de equipo.</div>}
      </div>
      {finalizeId && <FinalizeMatchModal matchId={finalizeId} onClose={() => setFinalizeId(null)} />}
    </>
  );
}
