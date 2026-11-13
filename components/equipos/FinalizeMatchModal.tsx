"use client";

import { useState } from "react";
import { useProfiles } from "@/context/ProfilesContext";
import { useTeams } from "@/context/TeamsContext";
import type { MatchStatsInput } from "@/lib/domain/matchDeltas";

interface RowState {
  goles: string;
  asist: string;
  pases: string;
  recup: string;
  calif: string;
}

const DEFAULT_ROW: RowState = { goles: "0", asist: "0", pases: "20", recup: "3", calif: "6.5" };

export function FinalizeMatchModal({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const { profiles } = useProfiles();
  const { teams, teamMatches, finalizeTeamMatch } = useTeams();
  const match = teamMatches.find((m) => m.id === matchId);
  const teamA = match ? teams[match.teamAId] : null;
  const teamB = match ? teams[match.teamBId] : null;

  const [golesA, setGolesA] = useState("0");
  const [golesB, setGolesB] = useState("0");
  const [mvpId, setMvpId] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {};
    (teamA?.memberIds || []).forEach((id) => {
      if (id) init[id] = { ...DEFAULT_ROW };
    });
    return init;
  });

  if (!match || !teamA || !teamB) return null;

  function patchRow(pid: string, p: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [pid]: { ...prev[pid], ...p } }));
  }

  async function submit() {
    const playerStats: Record<string, MatchStatsInput> = {};
    Object.entries(rows).forEach(([pid, r]) => {
      playerStats[pid] = {
        goles: parseInt(r.goles, 10) || 0,
        asistencias: parseInt(r.asist, 10) || 0,
        pases: parseInt(r.pases, 10) || 0,
        recuperaciones: parseInt(r.recup, 10) || 0,
        calificacion: parseFloat(r.calif) || 6,
        mvp: pid === mvpId,
      };
    });
    const res = await finalizeTeamMatch(matchId, parseInt(golesA, 10) || 0, parseInt(golesB, 10) || 0, mvpId, playerStats);
    if (res.ok) onClose();
  }

  return (
    <div className="modal-overlay open" id="finalize-match-modal">
      <div className="auth-card fm-card">
        <div className="auth-tabs">
          <div className="auth-tab on">FINALIZAR PARTIDO</div>
        </div>
        <div className="fm-score-row">
          <div className="fm-score-team">
            <div className="auth-label">{teamA.name}</div>
            <input className="auth-input" type="number" min={0} value={golesA} onChange={(e) => setGolesA(e.target.value)} />
          </div>
          <div className="fm-score-vs">VS</div>
          <div className="fm-score-team">
            <div className="auth-label">{teamB.name}</div>
            <input className="auth-input" type="number" min={0} value={golesB} onChange={(e) => setGolesB(e.target.value)} />
          </div>
        </div>
        <div className="auth-label">ESTADÍSTICAS DE TU EQUIPO</div>
        <div className="fm-players-head">
          <span>JUGADOR</span>
          <span>GOLES</span>
          <span>ASIST.</span>
          <span>PASES</span>
          <span>RECUP.</span>
          <span>CALIF.</span>
          <span>MVP</span>
        </div>
        <div className="fm-players-list">
          {(teamA.memberIds || []).map((pid) => {
            if (!pid) return null;
            const p = profiles[pid];
            if (!p) return null;
            const r = rows[pid] || DEFAULT_ROW;
            return (
              <div className="fm-player-row" key={pid}>
                <div className="fm-player-name">{p.nickname || p.name}</div>
                <input type="number" min={0} max={15} className="fm-goles auth-input" value={r.goles} onChange={(e) => patchRow(pid, { goles: e.target.value })} />
                <input type="number" min={0} max={15} className="fm-asist auth-input" value={r.asist} onChange={(e) => patchRow(pid, { asist: e.target.value })} />
                <input type="number" min={0} max={60} className="fm-pases auth-input" value={r.pases} onChange={(e) => patchRow(pid, { pases: e.target.value })} />
                <input type="number" min={0} max={20} className="fm-recup auth-input" value={r.recup} onChange={(e) => patchRow(pid, { recup: e.target.value })} />
                <input type="number" min={1} max={10} step={0.1} className="fm-calif auth-input" value={r.calif} onChange={(e) => patchRow(pid, { calif: e.target.value })} />
                <label className="fm-mvp-label">
                  <input type="radio" name="fm-mvp" checked={mvpId === pid} onChange={() => setMvpId(pid)} /> MVP
                </label>
              </div>
            );
          })}
        </div>
        <button className="auth-submit" onClick={submit}>
          PROCESAR PARTIDO
        </button>
        <button className="auth-cancel" onClick={onClose}>
          CANCELAR
        </button>
      </div>
    </div>
  );
}
