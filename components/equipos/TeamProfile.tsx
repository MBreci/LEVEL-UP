"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { useTeams } from "@/context/TeamsContext";
import { usePlayerView } from "@/context/PlayerViewContext";
import { getTeamOVR, getTeamRecord, POSITIONS } from "@/lib/domain/teams";
import { getRank } from "@/lib/domain/rank";
import { BenchSVG } from "@/components/equipos/BenchSVG";
import { SlotInviteModal } from "@/components/equipos/SlotInviteModal";
import { EditTeamModal } from "@/components/equipos/EditTeamModal";
import { KickModal } from "@/components/equipos/KickModal";
import type { Team } from "@/types/team";

const LEVELUP_URL = "https://levelupp.com.co";

function abrirWhatsApp(mensaje: string) {
  window.open("https://wa.me/?text=" + encodeURIComponent(mensaje), "_blank");
}

export function TeamProfile({ teamId, onEscudoClick }: { teamId: string; onEscudoClick: (src: string) => void }) {
  const { profile: me } = useAuth();
  const { profiles } = useProfiles();
  const { teams, setSlotPosition, toggleOpenForPlayers, requestLeaveTeam, respondJoinRequest, respondLeaveRequest } = useTeams();
  const { openPlayerView } = usePlayerView();
  const [slotInvite, setSlotInvite] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState<string | null>(null);

  const team = teams[teamId];
  if (!team) return <div className="rk-empty">No se pudo cargar este equipo.</div>;

  const ovr = getTeamOVR(team, profiles);
  const { record, dg } = getTeamRecord(team);
  const captain = profiles[team.captainId];
  const isCaptain = me?.id === team.captainId;
  const slotPositions = team.slotPositions || [];
  const totalFilled = team.memberIds.filter(Boolean).length;
  const isComplete = totalFilled >= 8;
  const pct = Math.round((totalFilled / 8) * 100);

  function invitarEquipoWhatsApp() {
    const nombre = team.name;
    const yo = me ? me.nickname || me.name : "";
    const msg =
      `¡Hola! 👋⚽ Estoy armando mi equipo *${nombre}* en LEVEL UP 👑 — la app donde jugamos Rey del Barrio y torneos con premios reales.\n\n` +
      `Crea tu cuenta gratis aquí 👉 ${LEVELUP_URL}\n\n` +
      `Luego búscame (${yo}) o busca a *${nombre}* para unirte a mi equipo. ¡Te espero! 🔥`;
    abrirWhatsApp(msg);
  }

  function buildCard(i: number, isSub: boolean) {
    const memberId = team.memberIds[i];
    const pos = slotPositions[i] || "";
    const posSelect = isCaptain && (
      <select
        className="team-fc-pos-select"
        onClick={(e) => e.stopPropagation()}
        value={pos}
        onChange={(e) => setSlotPosition(team.id, i, e.target.value)}
      >
        <option value="">ROL</option>
        {POSITIONS.map((p) => (
          <option value={p} key={p}>
            {p}
          </option>
        ))}
      </select>
    );

    if (!memberId) {
      if (!isCaptain) {
        return (
          <div className={`team-fc-slot empty ${isSub ? "sub" : ""}`} key={i}>
            <div className="team-fc-plus">+</div>
            <div className="team-fc-empty-lbl">{isSub ? "SUPLENTE" : pos || "CUPO LIBRE"}</div>
            {posSelect}
          </div>
        );
      }
      return (
        <div className={`team-fc-slot empty ${isSub ? "sub" : ""}`} key={i}>
          <div className="team-fc-plus" onClick={() => setSlotInvite(i)} style={{ cursor: "pointer" }}>
            +
          </div>
          <div className="team-fc-empty-lbl" onClick={() => setSlotInvite(i)} style={{ cursor: "pointer" }}>
            {isSub ? "INVITAR SUPLENTE" : "INVITAR AQUÍ"}
          </div>
          {posSelect}
        </div>
      );
    }
    const p = profiles[memberId];
    if (!p) {
      return (
        <div className={`team-fc-slot empty ${isSub ? "sub" : ""}`} key={i}>
          <div className="team-fc-plus">+</div>
          <div className="team-fc-empty-lbl">CUPO LIBRE</div>
        </div>
      );
    }
    const isCap = memberId === team.captainId;
    const ovrNum = Number(p.ovr) || 50;
    const cardColor = ovrNum >= 85 ? "gold" : ovrNum >= 75 ? "silver" : "bronze";
    return (
      <div className={`team-fc-slot filled ${isSub ? "sub" : ""} ${isCap ? "captain" : ""} card-${cardColor}`} key={i}>
        {isCap && <div className="team-fc-crown">👑</div>}
        {isSub && <div className="team-fc-sub-tag">SUP</div>}
        <div className="team-fc-photo-wrap" onClick={() => openPlayerView(p.id)} style={{ cursor: "pointer" }}>
          {p.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="team-fc-photo" src={p.photo} alt="" />
          ) : (
            <div className="team-fc-av">{p.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}</div>
          )}
        </div>
        <div className="team-fc-ovr" onClick={() => openPlayerView(p.id)} style={{ cursor: "pointer" }}>
          {p.ovr}
        </div>
        <div className="team-fc-name" onClick={() => openPlayerView(p.id)} style={{ cursor: "pointer" }}>
          {(p.nickname || p.name).split(" ")[0].toUpperCase()}
        </div>
        <div className="team-fc-posLabel">{pos || p.position}</div>
        {posSelect}
        {isCaptain && !isCap && (
          <button className="team-fc-kick" onClick={(e) => { e.stopPropagation(); setKickTarget(p.id); }}>
            ✕
          </button>
        )}
      </div>
    );
  }

  const isNonCaptainMember = !!me && !isCaptain && team.memberIds.includes(me.id);
  const alreadyRequestedLeave = !!me && (team.leaveRequests || []).includes(me.id);

  return (
    <div className="team-cinema">
      <div className="team-cinema-banner" style={{ ["--team-color" as string]: team.color || "#00ff88" }}>
        <div className="team-cinema-banner-glow"></div>
        <div className="team-cinema-escudo-wrap">
          {team.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="team-cinema-escudo" src={team.photo} alt="" onClick={() => onEscudoClick(team.photo!)} />
          ) : (
            <div className="team-cinema-escudo team-cinema-escudo-ph" style={{ background: team.color }}>
              {team.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="team-cinema-info">
          <div className="team-cinema-name">{team.name.toUpperCase()}</div>
          <div className="team-cinema-city">
            📍 {team.city || "SIN CIUDAD"}
            {team.desc ? " · " + team.desc : ""}
          </div>
          <div className="team-cinema-meta">
            <span className="team-cinema-tag ovr">⭐ OVR {ovr}</span>
            <span className="team-cinema-tag gold">🏆 {record}</span>
            <span className="team-cinema-tag">
              {dg >= 0 ? "+" : ""}
              {dg} DG
            </span>
            {captain && (
              <span className="team-cinema-tag cap">👑 {captain.nickname || captain.name}</span>
            )}
          </div>
        </div>
        <div className="team-cinema-actions">
          {isCaptain && (
            <button className="team-cinema-btn" onClick={() => setEditOpen(true)}>
              ✎ EDITAR
            </button>
          )}
          {isCaptain && (
            <button className={`team-cinema-btn ${team.openForPlayers ? "open" : ""}`} onClick={() => toggleOpenForPlayers(team.id)}>
              {team.openForPlayers ? "🔓 ABIERTO" : "🔒 CERRADO"}
            </button>
          )}
          {isNonCaptainMember && (
            <button
              className="team-cinema-btn danger"
              disabled={alreadyRequestedLeave}
              onClick={async () => {
                const res = await requestLeaveTeam();
                if (!res.ok && res.error) alert(res.error);
              }}
            >
              {alreadyRequestedLeave ? "SALIDA SOLICITADA" : "SALIR DEL EQUIPO"}
            </button>
          )}
        </div>
      </div>

      <div className="team-progress-wrap">
        <div className="team-progress-label">
          <span>PLANTILLA {totalFilled}/8</span>
          {isComplete && <span className="team-complete-badge">✓ PLANTILLA COMPLETA · APTO PARA TORNEOS</span>}
        </div>
        <div className="team-progress-track">
          <div className={`team-progress-fill ${isComplete ? "complete" : ""}`} style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      <div className="team-pitch-section">
        <div className="team-pitch-label">TITULARES</div>
        <div className="team-pitch">
          <div className="team-pitch-bg">
            <div className="pitch-line pitch-center-circle"></div>
            <div className="pitch-line pitch-center-line"></div>
            <div className="pitch-line pitch-penalty-top"></div>
            <div className="pitch-line pitch-penalty-bot"></div>
          </div>
          <div className="team-pitch-grid">{Array.from({ length: 6 }, (_, i) => buildCard(i, false))}</div>
        </div>
      </div>

      <div className="team-bench-section">
        <div className="team-bench-label">SUPLENTES</div>
        <div className="team-bench-grid">{Array.from({ length: 2 }, (_, i) => buildCard(6 + i, true))}</div>
        <BenchSVG />
      </div>

      {isCaptain && !isComplete && (
        <div className="team-mgmt-section">
          <div className="team-mgmt-title">INVITAR JUGADOR</div>
          <TeamMemberInviteSearch team={team} />
          <div className="team-mgmt-title" style={{ marginTop: 14 }}>
            ¿TU AMIGO NO ESTÁ EN LEVEL UP?
          </div>
          <button className="wa-invite-btn" onClick={invitarEquipoWhatsApp}>
            <span style={{ fontSize: 16 }}>📲</span> INVITAR POR WHATSAPP
          </button>
        </div>
      )}

      {isCaptain && team.joinRequests.length > 0 && (
        <div className="team-mgmt-section">
          <div className="team-mgmt-title">SOLICITUDES PARA UNIRSE</div>
          {team.joinRequests.map((pid) => {
            const p = profiles[pid];
            if (!p) return null;
            return (
              <div className="notif-invite" key={pid}>
                <div className="notif-invite-txt">
                  🙋 <strong>{p.nickname || p.name}</strong> · OVR {p.ovr} · {p.position}
                </div>
                <div className="notif-invite-actions">
                  <button className="notif-accept" onClick={() => respondJoinRequest(team.id, pid, true)}>
                    ACEPTAR
                  </button>
                  <button className="notif-reject" onClick={() => respondJoinRequest(team.id, pid, false)}>
                    RECHAZAR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isCaptain && (team.leaveRequests || []).length > 0 && (
        <div className="team-mgmt-section">
          <div className="team-mgmt-title">SOLICITUDES PARA SALIR</div>
          {(team.leaveRequests || []).map((pid) => {
            const p = profiles[pid];
            if (!p) return null;
            return (
              <div className="notif-invite" key={pid}>
                <div className="notif-invite-txt">
                  🚪 <strong>{p.nickname || p.name}</strong> quiere salir del equipo.
                </div>
                <div className="notif-invite-actions">
                  <button className="notif-accept" onClick={() => respondLeaveRequest(team.id, pid, true)}>
                    ACEPTAR
                  </button>
                  <button className="notif-reject" onClick={() => respondLeaveRequest(team.id, pid, false)}>
                    RECHAZAR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {slotInvite !== null && <SlotInviteModal team={team} slotIndex={slotInvite} onClose={() => setSlotInvite(null)} />}
      {editOpen && <EditTeamModal team={team} onClose={() => setEditOpen(false)} />}
      {kickTarget && <KickModal team={team} playerId={kickTarget} onClose={() => setKickTarget(null)} />}
    </div>
  );
}

function TeamMemberInviteSearch({ team }: { team: Team }) {
  const { profiles } = useProfiles();
  const { sendTeamInvite } = useTeams();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const list = q
    ? Object.values(profiles)
        .filter((p) => !team.memberIds.includes(p.id))
        .filter((p) => p.name.toLowerCase().includes(q) || (p.nickname || "").toLowerCase().includes(q))
        .slice(0, 6)
    : [];

  async function invite(playerId: string) {
    const res = await sendTeamInvite(team.id, playerId);
    if (res.error) alert(res.error);
    setQuery("");
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        className="team-invite-input-main"
        placeholder="🔍 Buscar por nombre o apodo..."
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && list.length > 0 && (
        <div className="pl-suggest open">
          {list.map((p) => {
            const rank = getRank(p.xp);
            return (
              <div className="pl-suggest-item team-invite-row" key={p.id} onClick={() => invite(p.id)}>
                <span>
                  {p.nickname || p.name} <span className="s-sub">OVR {p.ovr} · {rank.name}</span>
                </span>
                <span className="notif-accept" style={{ padding: "6px 12px", fontSize: 10 }}>
                  INVITAR
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
