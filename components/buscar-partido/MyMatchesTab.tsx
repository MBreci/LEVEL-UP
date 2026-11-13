"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { useMatches } from "@/context/MatchesContext";
import { useMatchInvites } from "@/context/MatchInvitesContext";
import { formatHoraLabel } from "@/lib/domain/arenas";
import { getMatchEstado, matchDateTime } from "@/lib/domain/matches";

function Timeline() {
  const { profile: me } = useAuth();
  const { openMatches } = useMatches();

  const mine = useMemo(() => {
    if (!me) return [];
    return openMatches
      .filter((m) => getMatchEstado(m) !== "finalizado" && (m.creatorId === me.id || m.necesita.some((n) => n.unidos.some((u) => u.profileId === me.id))))
      .sort((a, b) => matchDateTime(a).getTime() - matchDateTime(b).getTime());
  }, [me, openMatches]);
  // Snapshot de "ahora" tomado una vez al montar, solo para calcular HOY/MAÑANA/fecha.
  const [now] = useState(() => Date.now());

  if (!mine.length) return null;

  return (
    <div id="bp-timeline" className="bp-timeline-wrap">
      <div className="sec-eyebrow">LÍNEA DE TIEMPO</div>
      <div className="bp-timeline-track">
        {mine.map((m) => {
          const dt = matchDateTime(m);
          const diffDays = Math.round((new Date(dt.toDateString()).getTime() - new Date(new Date(now).toDateString()).getTime()) / 86400000);
          const when = diffDays === 0 ? "HOY" : diffDays === 1 ? "MAÑANA" : dt.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" }).toUpperCase();
          const estado = getMatchEstado(m);
          const tag = estado === "confirmado" ? "CONFIRMADO" : estado === "en_juego" ? "EN JUEGO" : "PENDIENTE";
          return (
            <div className="bp-timeline-item" key={m.id}>
              <div className={`bp-timeline-dot ${estado}`}></div>
              <div className="bp-timeline-when">{when}</div>
              <div className="bp-timeline-card">
                <div className="bp-timeline-cancha">{m.cancha || m.zona}</div>
                <div className="bp-timeline-meta">
                  {formatHoraLabel(m.horaValue)} · FÚTBOL {m.formato}
                </div>
                <div className={`bp-timeline-tag ${estado}`}>{tag}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Invitaciones a un partido, sincronizadas contra Supabase (tabla match_invites) para que lleguen al invitado en cualquier dispositivo. */
function MyMatches() {
  const { profile: me } = useAuth();
  const { profiles } = useProfiles();
  const { openMatches, deleteMatch } = useMatches();
  const { invites, sendInvite } = useMatchInvites();
  const [inviteMatchId, setInviteMatchId] = useState<string | null>(null);

  const mine = useMemo(() => (me ? openMatches.filter((m) => m.creatorId === me.id) : []), [me, openMatches]);

  if (!me) return <div className="my-matches">{/* la app entera exige sesión, guest no llega acá */}</div>;
  if (!mine.length) return <div className="my-matches" id="my-matches"></div>;

  const inviteMatch = inviteMatchId ? openMatches.find((m) => m.id === inviteMatchId) : null;
  const alreadyInvited = new Set(invites.filter((i) => i.matchId === inviteMatchId).map((i) => i.toId));
  const available = Object.values(profiles).filter((p) => p.id !== me.id && !alreadyInvited.has(p.id));

  async function sendInvites(selectedIds: string[]) {
    if (!inviteMatch) return;
    await Promise.all(
      selectedIds.map((toId) => {
        const p = profiles[toId];
        return sendInvite(inviteMatch.id, inviteMatch.zona, inviteMatch.fecha, toId, p ? p.nickname || p.name : toId);
      })
    );
    setInviteMatchId(null);
  }

  return (
    <div className="my-matches" id="my-matches">
      {mine.map((m) => {
        const myInvites = invites.filter((i) => i.matchId === m.id);
        return (
          <div className="mm-card" key={m.id}>
            <div className="mm-info">
              <div className="mm-zona">
                {m.zona}
                {m.cancha ? " · " + m.cancha : ""} — {m.fecha}
              </div>
              <div>
                FÚTBOL {m.formato} · {m.superficie}
              </div>
              {myInvites.length > 0 && (
                <div className="mm-confirmados">
                  {myInvites.map((i) => (
                    <span className={`mm-confirm-chip ${i.status}`} key={i.id}>
                      {i.toName} · {i.status}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="mm-actions">
              <button className="mm-invite-btn" onClick={() => setInviteMatchId(m.id)}>
                + INVITAR JUGADORES
              </button>
              <button className="mm-delete-btn" onClick={() => deleteMatch(m.id)}>
                ELIMINAR PARTIDO
              </button>
            </div>
          </div>
        );
      })}

      {inviteMatch && (
        <div className="modal-overlay open" id="invite-modal">
          <div className="invite-card" id="invite-content">
            <InviteForm available={available} onCancel={() => setInviteMatchId(null)} onSend={sendInvites} matchLabel={`${inviteMatch.zona} — ${inviteMatch.fecha}`} />
          </div>
        </div>
      )}
    </div>
  );
}

function InviteForm({
  available,
  matchLabel,
  onCancel,
  onSend,
}: {
  available: import("@/types/profile").Profile[];
  matchLabel: string;
  onCancel: () => void;
  onSend: (ids: string[]) => void;
}) {
  const [checked, setChecked] = useState<string[]>([]);
  function toggle(id: string) {
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  return (
    <>
      <div className="invite-title">INVITAR JUGADORES</div>
      <div className="invite-sub">{matchLabel}. Invita a cualquier jugador registrado en LEVEL UP.</div>
      <div className="invite-list" id="invite-list">
        {available.length ? (
          available.map((p) => (
            <label className="invite-row" key={p.id}>
              <input type="checkbox" checked={checked.includes(p.id)} onChange={() => toggle(p.id)} /> {p.nickname || p.name} ({p.position})
            </label>
          ))
        ) : (
          <div className="invite-empty">No hay más perfiles disponibles para invitar en este dispositivo.</div>
        )}
      </div>
      <button className="auth-submit" onClick={() => onSend(checked)}>
        ENVIAR INVITACIONES
      </button>
      <button className="auth-cancel" onClick={onCancel}>
        CANCELAR
      </button>
    </>
  );
}

export function MyMatchesTab() {
  return (
    <div id="invitar">
      <Timeline />
      <MyMatches />
    </div>
  );
}
