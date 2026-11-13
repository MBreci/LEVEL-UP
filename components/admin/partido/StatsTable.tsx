"use client";

import { AP_FIELD_POS_STATS, AP_NEG_STATS, AP_POR_POS_STATS, apCalcRating, type ApStatValues } from "@/lib/domain/adminTeamMatch";
import type { Profile, ProfilesById } from "@/types/profile";
import type { Team } from "@/types/team";

const POS_CLASS: Record<string, string> = { DEL: "del", MED: "med", DEF: "def", POR: "por" };

function statOf(stats: Record<string, ApStatValues>, pid: string): ApStatValues {
  return stats[pid] || {};
}

function ratingClass(r: number): string {
  return r >= 7.5 ? "cal-high" : r >= 6.0 ? "cal-mid" : "cal-low";
}

/**
 * Puerto fiel de la tabla .ap-stats-table de admin-partido.html (~394-451,
 * apBuildPlayerRow/apStatCell ~989-1041): una fila por jugador de ambos
 * equipos, con separador visual entre bloques, columnas dependientes de
 * posición (portero vs jugador de campo), calificación auto-calculada y
 * resumen mini por fila.
 */
export function StatsTable({
  teamA,
  teamB,
  profiles,
  stats,
  editable,
  onStatChange,
}: {
  teamA: Team;
  teamB: Team;
  profiles: ProfilesById;
  stats: Record<string, ApStatValues>;
  editable: boolean;
  onStatChange: (pid: string, key: string, delta: number, isNeg: boolean) => void;
}) {
  function renderRows(team: Team, startNum: number) {
    let num = startNum;
    return (team.memberIds || []).map((pid) => {
      if (!pid) return null;
      const p = profiles[pid];
      if (!p) return null;
      const rowNum = num++;
      return renderRow(pid, p, rowNum, team.color || "#00e676");
    });
  }

  function renderRow(pid: string, p: Profile, num: number, teamColor: string) {
    const isPor = p.position === "POR";
    const s = statOf(stats, pid);
    const posFields = isPor ? AP_POR_POS_STATS : AP_FIELD_POS_STATS;
    const rating = apCalcRating(p.position, s);
    const initials = (p.nickname || p.name).slice(0, 2).toUpperCase();

    return (
      <tr key={pid} data-pid={pid}>
        <td className="ap-num-cell">{num}</td>
        <td className="ap-player-cell">
          <div className="ap-player-cell-inner">
            {p.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="ap-avatar" src={p.photo} alt={p.nickname || p.name} />
            ) : (
              <div className="ap-avatar-ph" style={{ background: teamColor + "22", borderColor: teamColor + "44", color: teamColor }}>
                {initials}
              </div>
            )}
            <div>
              <div className="ap-player-name">{p.nickname || p.name}</div>
              <div className="ap-player-sub">
                {p.position} · OVR {p.ovr}
              </div>
            </div>
          </div>
        </td>
        <td>
          <span className={`ap-pos-badge ${POS_CLASS[p.position] || ""}`}>{p.position}</span>
        </td>
        <td className="ap-cond-cell">
          <span className="ap-cond">{p.ovr}%</span>
        </td>
        {posFields.map((f) => (
          <StatCell key={f.key} pid={pid} statKey={f.key} value={s[f.key] || 0} isNeg={false} editable={editable} onChange={onStatChange} />
        ))}
        {AP_NEG_STATS.map((f) => (
          <StatCell key={f.key} pid={pid} statKey={f.key} value={s[f.key] || 0} isNeg editable={editable} onChange={onStatChange} />
        ))}
        <td className="ap-resumen-cell">
          <div className="ap-resumen-mini">
            {isPor ? (
              <>
                <strong>ATJ:</strong>
                {s.atajadas || 0} <strong>ACH:</strong>
                {s.achiques || 0}
                <br />
                <strong>DES:</strong>
                {s.despejes || 0} <strong>AA:</strong>
                {s.atajadasArea || 0}
              </>
            ) : (
              <>
                <strong>G:</strong>
                {s.goles || 0} <strong>A:</strong>
                {s.asistencias || 0}
                <br />
                <strong>TA:</strong>
                {s.tirosAlArco || 0} <strong>REC:</strong>
                {s.recuperaciones || 0}
              </>
            )}
          </div>
        </td>
        <td className="ap-cal-cell">
          <div className={`ap-cal-val ${ratingClass(rating)}`}>{rating.toFixed(1)}</div>
        </td>
      </tr>
    );
  }

  return (
    <div className="ap-table-section">
      <div className="ap-table-header">
        ESTADÍSTICAS EN VIVO — REGISTRO MANUAL
        <span className="ap-help-badge" title="Usa los botones + y − para registrar las acciones de cada jugador. Las calificaciones se calculan automáticamente.">
          ?
        </span>
      </div>
      <div className="ap-table-scroll">
        <table className="ap-stats-table">
          <colgroup>
            <col style={{ width: 32 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 46 }} />
            <col style={{ width: 50 }} />
            <col style={{ width: 68 }} />
            <col style={{ width: 68 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 78 }} />
            <col style={{ width: 82 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 78 }} />
            <col style={{ width: 68 }} />
            <col style={{ width: 52 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 52 }} />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={4} className="ap-th-info"></th>
              <th colSpan={6} className="ap-th-pos">
                ACCIONES POSITIVAS
              </th>
              <th colSpan={5} className="ap-th-neg">
                ACCIONES NEGATIVAS
              </th>
              <th></th>
              <th>CALIF.</th>
            </tr>
            {/* Nota fiel: estos encabezados son estáticos en el original (ap-hdr-p1..p6
                nunca se reescriben por JS) aunque una fila de portero muestre
                estadísticas distintas (atajadas/despejes/etc.) en las mismas 6
                columnas — se replica tal cual, no se "arregla" el rótulo. */}
            <tr className="ap-stat-names-row">
              <th>#</th>
              <th className="ap-th-info">JUGADOR</th>
              <th>POS</th>
              <th>COND.</th>
              <th>GOL</th>
              <th>ASIST.</th>
              <th>TIRO AL ARCO</th>
              <th>PASE CLAVE</th>
              <th>RECUPERACIÓN</th>
              <th>JUGADA DESTACADA</th>
              <th className="ap-th-neg-sub">ERROR GRAVE</th>
              <th className="ap-th-neg-sub">OP. FALLADA</th>
              <th className="ap-th-neg-sub">FALTA COMETIDA</th>
              <th className="ap-th-neg-sub">AMARILLA</th>
              <th className="ap-th-neg-sub">ROJA</th>
              <th>RESUMEN</th>
              <th>CALIF.</th>
            </tr>
          </thead>
          <tbody>{renderRows(teamA, 1)}</tbody>
          <tbody>
            <tr className="ap-team-sep-row">
              <td colSpan={17}>— {teamB.name.toUpperCase()} (VISITANTE) —</td>
            </tr>
          </tbody>
          <tbody>{renderRows(teamB, 6)}</tbody>
        </table>
      </div>
    </div>
  );
}

function StatCell({
  pid,
  statKey,
  value,
  isNeg,
  editable,
  onChange,
}: {
  pid: string;
  statKey: string;
  value: number;
  isNeg: boolean;
  editable: boolean;
  onChange: (pid: string, key: string, delta: number, isNeg: boolean) => void;
}) {
  const cls = isNeg ? "neg-col" : "pos-col";
  const valCls = "ap-stat-val" + (value > 0 ? (isNeg ? " nonzero neg" : " nonzero") : "");
  return (
    <td className={`ap-stat-cell ${cls}`}>
      <div className="ap-stat-inner">
        <button className="ap-sm-btn minus" disabled={!editable} onClick={() => onChange(pid, statKey, -1, isNeg)}>
          −
        </button>
        <span className={valCls}>{value}</span>
        <button className="ap-sm-btn plus" disabled={!editable} onClick={() => onChange(pid, statKey, 1, isNeg)}>
          +
        </button>
      </div>
    </td>
  );
}
