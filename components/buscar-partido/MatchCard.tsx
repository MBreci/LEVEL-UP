"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { useMatches } from "@/context/MatchesContext";
import { MatchChatModal } from "@/components/chat/MatchChatModal";
import { AdminMatchModal } from "@/components/admin/AdminMatchModal";
import {
  ESTADO_INFO,
  cleanDireccionDisplay,
  casualBetLabel,
  generoLabel,
  getMatchEstado,
  getTotalCupos,
  getTotalUnidos,
  matchDateTime,
  matchMapsUrl,
  posBuscadasLabel,
} from "@/lib/domain/matches";
import { formatHoraLabel } from "@/lib/domain/arenas";
import type { OpenMatch } from "@/types/match";

function showToast(msg: string) {
  let t = document.getElementById("lu-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "lu-toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  window.clearTimeout((t as unknown as { _to?: number })._to);
  (t as unknown as { _to?: number })._to = window.setTimeout(() => t!.classList.remove("show"), 3000);
}

export function MatchCard({
  match: m,
  mode,
  onJoin,
  onParticipants,
}: {
  match: OpenMatch;
  mode: "proximos" | "mia";
  onJoin: (matchId: string, pos: string) => void;
  onParticipants: (matchId: string) => void;
}) {
  const { profile: me, isAdmin } = useAuth();
  const { openAuth } = useAuthModal();
  const { savedMatchIds, toggleSaveMatch, respondJoinRequest, cancelParticipation, deleteMatch } = useMatches();
  const [chatOpen, setChatOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const estado = getMatchEstado(m);
  const info = ESTADO_INFO[estado];
  const total = getTotalCupos(m);
  const unidos = getTotalUnidos(m);
  const faltan = Math.max(0, total - unidos);
  const pct = total ? Math.round((unidos / total) * 100) : 0;
  const isCreator = !!me && m.creatorId === me.id;
  const isSaved = savedMatchIds.includes(m.id);
  const requests = isCreator ? m.joinRequests : [];
  // Snapshot de "ahora" tomado una vez al montar (no necesita ser un reloj en vivo,
  // solo decidir si la ventana de 24h para cancelar/eliminar ya se cerró).
  const [now] = useState(() => Date.now());
  const hoursLeft = (matchDateTime(m).getTime() - now) / 3600000;

  let urgencyBadge: React.ReactNode = null;
  if (faltan > 0 && faltan <= 2) urgencyBadge = <div className="bp-urgency-badge fire">🔥 SOLO FALTAN {faltan}</div>;
  else if (pct >= 75 && faltan > 0) urgencyBadge = <div className="bp-urgency-badge green">🟢 CASI COMPLETO</div>;
  const priorityBadge = m.prioritario && faltan > 0 ? <div className="bp-urgency-badge priority">⚡ PRIORITARIO · CUPO LIBRE</div> : null;
  const hora = m.horaValue ? formatHoraLabel(m.horaValue) : "";

  async function handleDelete() {
    const res = await deleteMatch(m.id);
    if (!res.ok && res.error) alert(res.error);
  }
  async function handleCancel() {
    const res = await cancelParticipation(m.id);
    if (!res.ok && res.error) alert(res.error);
  }
  function share() {
    const url = `${location.origin}/buscar-partido?p=${m.id}`;
    const text = `⚽ Partido FÚTBOL ${m.formato} en ${m.cancha || m.zona} — ${m.fecha}. ¡Únete en LEVEL UP!`;
    if (navigator.share) {
      navigator.share({ title: "LEVEL UP", text, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast("¡Link copiado al portapapeles!")).catch(() => {});
    }
  }
  function openLocation() {
    const q = encodeURIComponent(`${m.direccion || ""} ${m.cancha || ""} ${m.zona}`.trim());
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }
  function openChat() {
    if (!me) {
      openAuth(false);
      return;
    }
    setChatOpen(true);
  }

  return (
    <div className={`bp-card bp-card-premium ${info.cls}`}>
      <div className="bp-card-glow"></div>
      <div className="bp-card-header">
        <div className="bp-card-header-left">
          <div className="bp-card-cancha">{m.cancha || "CANCHA POR CONFIRMAR"}</div>
          <a className="bp-card-zona" href={matchMapsUrl(m)} target="_blank" rel="noopener noreferrer">
            📍 {m.zona}
            {cleanDireccionDisplay(m.direccion) ? " · " + cleanDireccionDisplay(m.direccion) : ""} <span className="bp-zona-ver">Ver ›</span>
          </a>
        </div>
        <div className="bp-card-header-right">
          <div className={`bp-estado-badge ${info.cls}`}>{info.label}</div>
          {priorityBadge}
          {urgencyBadge}
        </div>
      </div>

      <div className="bp-card-pills">
        <span className="bp-pill">📅 {m.fecha}</span>
        {hora && <span className="bp-pill">⏰ {hora}</span>}
        <span className="bp-pill">⚽ FÚTBOL {m.formato}</span>
        <span className="bp-pill">🟢 {m.superficie}</span>
        <span className="bp-pill">
          💵 {m.valorPorPersona || m.precio ? "$" + Number(m.valorPorPersona || m.precio).toLocaleString("es-CO") + "/jug" : "GRATIS"}
        </span>
        <span className="bp-pill">⭐ OVR {m.ovrMin || "LIBRE"}</span>
        <span className={`bp-pill bp-pill-genero bp-genero-${(m.genero || "MIXTO").toLowerCase()}`}>{generoLabel(m.genero)}</span>
        <span className="bp-pill">👤 {m.creatorName}</span>
        {m.casualBet && <span className="bp-pill bp-pill-bet">{casualBetLabel(m.casualBet)}</span>}
      </div>

      <div className="bp-cupos-wrap">
        <div className="bp-cupos-bar">
          <div className="bp-cupos-fill" style={{ width: `${pct}%` }}></div>
        </div>
        <div className="bp-cupos-label">
          <span>
            👥 {unidos}/{total} jugadores
          </span>
          {faltan > 0 ? <span className="bp-faltan">Faltan {faltan}</span> : <span className="bp-lleno">Completo</span>}
        </div>
      </div>

      {m.posiciones && m.posiciones.length > 0 && <div className="bp-busca-pos">BUSCA: {posBuscadasLabel(m.posiciones)}</div>}

      <div className="bp-needs">
        {m.necesita.map((n) => {
          const full = n.unidos.length >= n.cupos;
          const joined = !!me && n.unidos.some((u) => u.profileId === me.id);
          const requested = !!me && m.joinRequests.some((r) => r.profileId === me.id);
          const label = n.pos === "ABIERTO" ? "BUSCANDO" : n.pos;
          return (
            <div className={`bp-need-chip ${full ? "full" : ""}`} key={n.pos}>
              <span className="bp-need-label">{label}</span>
              <span className="bp-need-count">
                {n.unidos.length}/{n.cupos}
              </span>
              {!full && !joined && !isCreator && mode === "proximos" && !requested && (
                <button onClick={() => onJoin(m.id, n.pos)}>UNIRME</button>
              )}
              {joined && <span style={{ color: "var(--g)" }}>✓ UNIDO</span>}
              {requested && !joined && <span className="bp-pending-tag">PENDIENTE</span>}
            </div>
          );
        })}
        {m.confirmadosPrev && m.confirmadosPrev.length > 0 && (
          <div className="bp-need-chip confirmed-prev">
            CONFIRMADOS PREVIAMENTE <span className="bp-need-count">{m.confirmadosPrev.length}</span>
          </div>
        )}
      </div>

      {requests.length > 0 && (
        <div className="bp-requests">
          <div className="bp-requests-title">SOLICITUDES DE INGRESO</div>
          {requests.map((r) => (
            <div className="bp-request-row" key={r.profileId}>
              <span>
                {r.name} · {r.pos}
              </span>
              <div className="bp-request-actions">
                <button className="notif-accept" onClick={() => respondJoinRequest(m.id, r.profileId, true)}>
                  ACEPTAR
                </button>
                <button className="notif-reject" onClick={() => respondJoinRequest(m.id, r.profileId, false)}>
                  RECHAZAR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bp-card-actions">
        <button onClick={() => onParticipants(m.id)}>👥 PARTICIPANTES</button>
        <button onClick={share}>↗ COMPARTIR</button>
        <button className={isSaved ? "on" : ""} onClick={() => toggleSaveMatch(m.id)}>
          {isSaved ? "★ GUARDADO" : "☆ GUARDAR"}
        </button>
        <button onClick={openLocation}>📍 UBICACIÓN</button>
        <button onClick={openChat}>💬 CHAT</button>
        {mode === "mia" && (hoursLeft >= 24 ? <button className="bp-cancel-btn" onClick={handleCancel}>CANCELAR PARTICIPACIÓN</button> : <div className="bp-cancel-locked">⚠️ No puedes cancelar tu participación porque el partido inicia en menos de 24 horas.</div>)}
        {isCreator && (hoursLeft >= 24 ? <button className="bp-cancel-btn" onClick={handleDelete}>ELIMINAR PARTIDO</button> : <div className="bp-cancel-locked">⚠️ No puedes eliminar este partido porque inicia en menos de 24 horas.</div>)}
        {isAdmin && (
          <button className="mm-admin-btn" onClick={() => setAdminOpen(true)}>
            {m.finalizado ? "⚙ VER / CORREGIR" : "⚙ ADMINISTRAR"}
          </button>
        )}
      </div>
      {chatOpen && <MatchChatModal matchId={m.id} onClose={() => setChatOpen(false)} />}
      {adminOpen && <AdminMatchModal matchId={m.id} onClose={() => setAdminOpen(false)} />}
    </div>
  );
}
