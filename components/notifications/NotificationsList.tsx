"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { useTeams } from "@/context/TeamsContext";
import { useMatchInvites } from "@/context/MatchInvitesContext";
import { CounterofferModal } from "@/components/equipos/CounterofferModal";

export function NotificationsList() {
  const { profile, saveProfile } = useAuth();
  const { profiles } = useProfiles();
  const { teams, myTeamInvites, myChallenges, myLeaveRequests, respondTeamInvite, respondChallenge, respondLeaveRequest } = useTeams();
  const { myInvites, respondInvite } = useMatchInvites();
  const [counterofferId, setCounterofferId] = useState<string | null>(null);
  const markedFor = useRef<string | null>(null);

  const totalCount = profile
    ? profile.notifications.length +
      myInvites.filter((i) => i.status === "pendiente").length +
      myTeamInvites.length +
      myChallenges.length +
      myLeaveRequests.length
    : 0;

  // Marca como vistas las notificaciones al entrar a esta página (una vez por
  // perfil/conteo, igual que el original — evita el badge del header quedando
  // pegado en un número viejo).
  useEffect(() => {
    if (!profile) return;
    const key = `${profile.id}:${totalCount}`;
    if (markedFor.current === key) return;
    markedFor.current = key;
    if (totalCount !== (profile.notifSeenCount || 0)) {
      saveProfile({ ...profile, notifSeenCount: totalCount });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, totalCount]);

  if (!profile) return null;

  const hasAnything = profile.notifications.length || myInvites.length || myTeamInvites.length || myChallenges.length || myLeaveRequests.length;
  if (!hasAnything) {
    return <div className="notif-empty">No tienes notificaciones.</div>;
  }

  const normalRows = [...profile.notifications].reverse();

  return (
    <>
      {[...myInvites].reverse().map((inv) => (
        <div className="notif-invite" key={inv.id}>
          <div className="notif-invite-txt">
            ⚽ <strong>{inv.fromName}</strong> te invitó a su partido en {inv.zona} — {inv.fecha}
          </div>
          {inv.status === "pendiente" ? (
            <div className="notif-invite-actions">
              <button className="notif-accept" onClick={() => respondInvite(inv.id, true)}>
                ACEPTAR
              </button>
              <button className="notif-reject" onClick={() => respondInvite(inv.id, false)}>
                RECHAZAR
              </button>
            </div>
          ) : (
            <div className="notif-invite-status">{inv.status === "aceptada" ? "✓ ACEPTASTE ESTA INVITACIÓN" : "✕ RECHAZASTE ESTA INVITACIÓN"}</div>
          )}
        </div>
      ))}

      {[...myTeamInvites].reverse().map((inv) => (
        <div className="notif-invite" key={inv.id}>
          <div className="notif-invite-txt">
            🛡️ <strong>{inv.teamName}</strong> te invitó a unirte como jugador.
          </div>
          <div className="notif-invite-actions">
            <button className="notif-accept" onClick={() => respondTeamInvite(inv.id, true)}>
              ACEPTAR
            </button>
            <button className="notif-reject" onClick={() => respondTeamInvite(inv.id, false)}>
              RECHAZAR
            </button>
          </div>
        </div>
      ))}

      {[...myChallenges].reverse().map((c) => {
        const fromTeam = teams[c.fromTeamId];
        const bet = c.betAmount || 0;
        return (
          <div className="notif-invite" key={c.id}>
            <div className="notif-invite-txt">
              ⚔️ <strong>{fromTeam ? fromTeam.name : "Un equipo"}</strong> te retó — {c.cancha} · {c.fecha} {c.hora}
              {bet > 0 && (
                <>
                  <br />
                  <span className="bet-badge">🪙 {bet.toLocaleString("es-CO")} coins en juego</span>
                </>
              )}
            </div>
            <div className="notif-invite-actions">
              <button className="notif-accept" onClick={() => setCounterofferId(c.id)}>
                VER RETO
              </button>
              <button className="notif-reject" onClick={() => respondChallenge(c.id, false)}>
                RECHAZAR
              </button>
            </div>
          </div>
        );
      })}

      {myLeaveRequests.map(({ team, playerId }) => {
        const p = profiles[playerId];
        if (!p) return null;
        return (
          <div className="notif-invite" key={team.id + ":" + playerId}>
            <div className="notif-invite-txt">
              🚪 <strong>{p.nickname || p.name}</strong> solicitó salir de {team.name}.
            </div>
            <div className="notif-invite-actions">
              <button className="notif-accept" onClick={() => respondLeaveRequest(team.id, playerId, true)}>
                ACEPTAR
              </button>
              <button className="notif-reject" onClick={() => respondLeaveRequest(team.id, playerId, false)}>
                RECHAZAR
              </button>
            </div>
          </div>
        );
      })}

      {normalRows.map((n, i) => (
        <div className="notif-row" key={i}>
          <div className="notif-icon">{n.icon}</div>
          <div>
            <div className="notif-txt">{n.text}</div>
            <div className="notif-time">{n.time}</div>
          </div>
        </div>
      ))}

      {counterofferId && <CounterofferModal challengeId={counterofferId} onClose={() => setCounterofferId(null)} />}
    </>
  );
}
