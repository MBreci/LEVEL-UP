"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { useTeams } from "@/context/TeamsContext";
import { getRank } from "@/lib/domain/rank";
import type { Team } from "@/types/team";

const LEVELUP_URL = "https://levelupp.com.co";

function abrirWhatsApp(mensaje: string) {
  window.open("https://wa.me/?text=" + encodeURIComponent(mensaje), "_blank");
}

export function SlotInviteModal({ team, slotIndex, onClose }: { team: Team; slotIndex: number; onClose: () => void }) {
  const { profile: me } = useAuth();
  const { profiles } = useProfiles();
  const { sendTeamInvite } = useTeams();
  const [query, setQuery] = useState("");

  const isSub = slotIndex >= 6;
  const label = isSub ? `SUPLENTE ${slotIndex - 5}` : `TITULAR ${slotIndex + 1}`;
  const q = query.trim().toLowerCase();
  const list = q
    ? Object.values(profiles)
        .filter((p) => !team.memberIds.includes(p.id) && p.id !== team.captainId)
        .filter((p) => p.name.toLowerCase().includes(q) || (p.nickname || "").toLowerCase().includes(q))
        .slice(0, 6)
    : [];

  async function invite(playerId: string) {
    if (team.memberIds[slotIndex]) {
      alert("Este cupo ya está ocupado.");
      return;
    }
    const res = await sendTeamInvite(team.id, playerId, slotIndex);
    if (res.error) alert(res.error);
    onClose();
  }

  function invitarWhatsApp() {
    if (!me) return;
    const rol = isSub ? `suplente ${slotIndex - 5}` : `titular ${slotIndex + 1}`;
    const cap = me.nickname || me.name;
    const link = `${LEVELUP_URL}/?join=${encodeURIComponent(team.id)}&slot=${slotIndex}&from=${encodeURIComponent(me.id)}`;
    const msg =
      `¡Hola! 👋⚽ Soy *${cap}*, capitán de *${team.name}* en LEVEL UP 👑.\n\n` +
      `Te quiero en mi equipo como *${rol}*. Toca este enlace para unirte 👇\n${link}\n\n` +
      `Si aún no tienes cuenta, créala (toma 1 minuto) y de una vez te aparece mi invitación para aceptar. 🔥`;
    abrirWhatsApp(msg);
    onClose();
  }

  return (
    <div className="slot-invite-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="slot-invite-card">
        <div className="slot-invite-title">
          INVITAR A <span className="slot-invite-pos">{label}</span>
        </div>
        <div className="slot-invite-searchrow">
          <input className="tn-input" autoComplete="off" placeholder="Buscar por nombre o apodo..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="slot-wa-btn" onClick={invitarWhatsApp} title="Invitar por WhatsApp">
            <span className="slot-wa-ico">📲</span>
            <span className="slot-wa-lbl">WhatsApp</span>
          </button>
        </div>
        <div className="slot-invite-hint">Busca a un jugador que ya esté en LEVEL UP, o invítalo por WhatsApp aunque todavía no tenga cuenta.</div>
        <div className="slot-invite-results">
          {q && !list.length && <div className="slot-invite-item">Sin resultados.</div>}
          {list.map((p) => {
            const rank = getRank(p.xp);
            return (
              <div className="slot-invite-item" key={p.id} onClick={() => invite(p.id)}>
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
        <button className="tn-btn-cancel" style={{ marginTop: 12 }} onClick={onClose}>
          CANCELAR
        </button>
      </div>
    </div>
  );
}
