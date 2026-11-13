"use client";

import type { Team } from "@/types/team";

interface ResumenPair {
  a: number;
  b: number;
}

/**
 * Puerto fiel del bloque .ap-scoreboard de admin-partido.html (~333-391):
 * escudos, marcador grande, timer, indicador EN VIVO/FINALIZADO y la barra de
 * resumen de 5 métricas (goles/amarillas/rojas/tiros al arco/faltas), sumadas
 * por equipo — ver apUpdateSummaryBar.
 */
export function Scoreboard({
  teamA,
  teamB,
  golesA,
  golesB,
  done,
  timerLabel,
  periodLabel,
  resumen,
}: {
  teamA: Team;
  teamB: Team;
  golesA: number;
  golesB: number;
  done: boolean;
  timerLabel: string;
  periodLabel: string;
  resumen: { goles: ResumenPair; amarillas: ResumenPair; rojas: ResumenPair; tiros: ResumenPair; faltas: ResumenPair };
}) {
  const colA = teamA.color || "#00e676";
  const colB = teamB.color || "#ff1f44";

  return (
    <div className="ap-scoreboard">
      <div className="ap-scoreboard-main">
        <div className="ap-score-team">
          <div className="ap-team-shield" style={{ borderColor: colA + "66", background: colA + "11", color: colA }}>
            {teamA.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={teamA.photo} alt="" />
            ) : null}
          </div>
          <div className="ap-team-info">
            <div className="ap-team-name">{teamA.name}</div>
            <span className="ap-team-badge local">LOCAL</span>
          </div>
        </div>

        <div className="ap-score-center">
          <div className="ap-score-nums">
            <div className="ap-score-num local-score">{golesA}</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div className="ap-score-live">
                <div className="ap-live-dot"></div>
                <span>{done ? "FINALIZADO" : "EN VIVO"}</span>
              </div>
              <div className="ap-timer-big">{timerLabel}</div>
              <div className="ap-period-lbl">{periodLabel}</div>
            </div>
            <div className="ap-score-num visitante-score">{golesB}</div>
          </div>
        </div>

        <div className="ap-score-team right">
          <div className="ap-team-shield" style={{ borderColor: colB + "66", background: colB + "11", color: colB }}>
            {teamB.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={teamB.photo} alt="" />
            ) : null}
          </div>
          <div className="ap-team-info" style={{ textAlign: "right" }}>
            <div className="ap-team-name">{teamB.name}</div>
            <span className="ap-team-badge visitante">VISITANTE</span>
          </div>
        </div>
      </div>

      <div className="ap-resumen-bar">
        <div className="ap-resumen-stat">
          <div className="ap-resumen-label">GOLES</div>
          <div className="ap-resumen-val goles">
            {resumen.goles.a} - {resumen.goles.b}
          </div>
        </div>
        <div className="ap-resumen-stat">
          <div className="ap-resumen-label">AMARILLAS</div>
          <div className="ap-resumen-val tarjetas-amarillas">
            {resumen.amarillas.a} - {resumen.amarillas.b}
          </div>
        </div>
        <div className="ap-resumen-stat">
          <div className="ap-resumen-label">ROJAS</div>
          <div className="ap-resumen-val tarjetas-rojas">
            {resumen.rojas.a} - {resumen.rojas.b}
          </div>
        </div>
        <div className="ap-resumen-stat">
          <div className="ap-resumen-label">TIROS AL ARCO</div>
          <div className="ap-resumen-val">
            {resumen.tiros.a} - {resumen.tiros.b}
          </div>
        </div>
        <div className="ap-resumen-stat">
          <div className="ap-resumen-label">FALTAS</div>
          <div className="ap-resumen-val">
            {resumen.faltas.a} - {resumen.faltas.b}
          </div>
        </div>
      </div>
    </div>
  );
}
