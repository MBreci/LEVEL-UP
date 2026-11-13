"use client";

import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { useTeams } from "@/context/TeamsContext";
import { useTournaments } from "@/context/TournamentsContext";
import { getMyTeam } from "@/lib/domain/teams";
import { pesosFmt, tnMapsUrl, TN_TEAM_SIZE } from "@/lib/domain/tournaments";
import { coinsFmt, toCoins } from "@/lib/domain/wallet";
import type { Profile } from "@/types/profile";
import type { Team } from "@/types/team";
import type { Tournament } from "@/types/tournament";

const STATUS_LABEL: Record<string, string> = { abierto: "INSCRIPCIONES ABIERTAS", en_curso: "EN CURSO", finalizado: "FINALIZADO" };
const STATUS_CLASS: Record<string, string> = { abierto: "tn-status-open", en_curso: "tn-status-live", finalizado: "tn-status-done" };

const LEVELUP_URL = "https://levelupp.com.co";
function abrirWhatsApp(mensaje: string) {
  window.open("https://wa.me/?text=" + encodeURIComponent(mensaje), "_blank");
}

function TnPlayerChip({ p, isCap, suplente }: { p: Profile; isCap: boolean; suplente?: boolean }) {
  const num = p.dorsal === 0 || p.dorsal ? p.dorsal : null;
  return (
    <span className={`tn-it-player${suplente ? " suplente" : ""}`}>
      {num != null && <span className="tn-it-num">{num}</span>}
      {p.nickname || p.name}
      {isCap && (
        <span className="tn-it-cap" title="Capitán">
          C
        </span>
      )}
    </span>
  );
}

function InscribedTeamRow({ team, profiles }: { team: Team; profiles: Record<string, Profile> }) {
  const titulares = team.memberIds.slice(0, 6).map((id) => (id ? profiles[id] : undefined)).filter((p): p is Profile => !!p);
  const suplentes = team.memberIds.slice(6, 8).map((id) => (id ? profiles[id] : undefined)).filter((p): p is Profile => !!p);
  return (
    <div className="tn-inscribed-team">
      <div className="tn-it-header">
        <div className="tn-it-escudo" style={{ background: `${team.color || "#00ff88"}22`, borderColor: `${team.color || "#00ff88"}44` }}>
          {team.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={team.photo} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} alt="" />
          ) : (
            <span style={{ fontSize: 18 }}>⚽</span>
          )}
        </div>
        <div>
          <div className="tn-it-name">{team.name}</div>
          <div className="tn-it-city">{team.city || ""}</div>
        </div>
        <div className="tn-it-badge">INSCRITO</div>
      </div>
      <div className="tn-it-squad">
        <div className="tn-it-squad-label">TITULARES</div>
        <div className="tn-it-players">
          {titulares.map((p) => (
            <TnPlayerChip p={p} isCap={team.captainId === p.id} key={p.id} />
          ))}
        </div>
        {suplentes.length > 0 && (
          <>
            <div className="tn-it-squad-label" style={{ marginTop: 6 }}>
              SUPLENTES
            </div>
            <div className="tn-it-players">
              {suplentes.map((p) => (
                <TnPlayerChip p={p} isCap={team.captainId === p.id} suplente key={p.id} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TorneoCard({ tournament: t, onOpenPayment }: { tournament: Tournament; onOpenPayment: (t: Tournament, myTeam: Team) => void }) {
  const { profile: me, isAdmin } = useAuth();
  const { profiles } = useProfiles();
  const { teams } = useTeams();
  const { changeStatus, removeTournament } = useTournaments();

  const role: "admin" | "founder" = isAdmin ? "admin" : "founder";
  const entries = t.teams || [];
  const myTeam = role === "founder" && me ? getMyTeam(teams, me.id) : null;
  const isInscribed = !!myTeam && entries.some((e) => e.teamId === myTeam.id);
  const isCaptain = !!myTeam && !!me && myTeam.captainId === me.id;
  const isComplete = !!myTeam && myTeam.memberIds.length >= TN_TEAM_SIZE;

  const teamRows = entries
    .map((e) => teams[e.teamId])
    .filter((team): team is Team => !!team)
    .map((team) => <InscribedTeamRow team={team} profiles={profiles} key={team.id} />);

  let cta: React.ReactNode = null;
  if (role === "founder" && t.status === "abierto" && me) {
    if (isInscribed) {
      cta = <div className="tn-inscribed-badge">✓ TU EQUIPO ESTÁ INSCRITO</div>;
    } else if (!myTeam) {
      cta = (
        <div className="tn-cta-note">
          Necesitas un equipo para inscribirte.{" "}
          <a href="/equipos?tab=crear" style={{ color: "var(--g)" }}>
            Crear equipo →
          </a>
        </div>
      );
    } else if (!isCaptain) {
      cta = (
        <div className="tn-cta-note">
          Solo el capitán de <b>{myTeam.name}</b> puede inscribir el equipo al torneo.
        </div>
      );
    } else if (!isComplete) {
      cta = (
        <div className="tn-cta-note">
          Tu equipo necesita 8 jugadores (6 titulares + 2 suplentes) para inscribirse.{" "}
          <a href="/equipos?tab=crear" style={{ color: "var(--g)" }}>
            Completar equipo →
          </a>
        </div>
      );
    } else {
      cta = (
        <button className="tn-inscribir-btn" onClick={() => onOpenPayment(t, myTeam)}>
          INSCRIBIR MI EQUIPO — 🪙 {toCoins(t.valorInscripcion).toLocaleString("es-CO")} coins
        </button>
      );
    }
  } else if (role === "founder" && t.status !== "abierto") {
    cta = <div className="tn-cta-note">Las inscripciones para este torneo están cerradas.</div>;
  }

  const porJugador = t.valorPorJugador || (t.valorInscripcion ? Math.round(t.valorInscripcion / TN_TEAM_SIZE) : 0);
  const totalEquipo = t.valorInscripcion || porJugador * TN_TEAM_SIZE;

  function invitarWhatsApp() {
    const yo = me ? me.nickname || me.name : "";
    const msg =
      `¡Vamos a jugar el *${t.nombre}* en LEVEL UP! 🏆⚽👑\n\n` +
      `Arma tu equipo o únete al mío. Crea tu cuenta gratis 👉 ${LEVELUP_URL}\n\n` +
      `Cuando entres, búscame: ${yo}. ¡Nos vemos en la cancha! 🔥`;
    abrirWhatsApp(msg);
  }

  return (
    <div className="tn-card">
      <div className="tn-card-accent"></div>
      <div className="tn-card-header">
        <div className="tn-card-head-main">
          <div className={`tn-card-status ${STATUS_CLASS[t.status] || ""}`}>{STATUS_LABEL[t.status] || t.status}</div>
          <div className="tn-card-name">{t.nombre}</div>
          <div className="tn-card-meta">
            <span>📅 {t.fecha ? new Date(t.fecha + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }) : ""}</span>
            <span>
              🕐 {t.horaInicio}
              {t.horaFin ? " – " + t.horaFin : ""}
            </span>
            <span>📍 {t.cancha}</span>
          </div>
        </div>
      </div>

      {(t.premio1 || t.premio2 || t.premio3 || t.premio) && (
        <div className="tn-prizes">
          <div className="tn-prize-main">
            <div className="tn-prize-trophy">🏆</div>
            <div className="tn-prize-main-txt">
              <div className="tn-prize-label">PREMIO AL CAMPEÓN</div>
              <div className="tn-prize-main-val">{t.premio1 || t.premio || ""}</div>
            </div>
          </div>
          {(t.premio2 || t.premio3) && (
            <div className="tn-prize-row">
              {t.premio2 && (
                <div className="tn-prize-chip">
                  <span className="tn-prize-medal">🥈</span>
                  <span>{t.premio2}</span>
                </div>
              )}
              {t.premio3 && (
                <div className="tn-prize-chip">
                  <span className="tn-prize-medal">🥉</span>
                  <span>{t.premio3}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {(porJugador > 0 || totalEquipo > 0) && (
        <div className="tn-price">
          <div className="tn-price-col">
            <div className="tn-price-k">CUOTA POR JUGADOR</div>
            <div className="tn-price-v">
              {pesosFmt(porJugador)}
              <span className="tn-price-coins">🪙 {coinsFmt(porJugador)}</span>
            </div>
          </div>
          <div className="tn-price-div"></div>
          <div className="tn-price-col">
            <div className="tn-price-k">TOTAL POR EQUIPO · 8</div>
            <div className="tn-price-v tn-price-total">
              {pesosFmt(totalEquipo)}
              <span className="tn-price-coins">🪙 {coinsFmt(totalEquipo)}</span>
            </div>
          </div>
        </div>
      )}

      {(t.cancha || t.direccion) && (
        <a className="tn-loc" href={tnMapsUrl(t)} target="_blank" rel="noopener noreferrer">
          <div className="tn-loc-pin">
            <span className="tn-loc-ping"></span>📍
          </div>
          <div className="tn-loc-info">
            <div className="tn-loc-name">{t.cancha || "Ubicación del torneo"}</div>
            {t.direccion && <div className="tn-loc-addr">{t.direccion.replace(/^https?:\/\/\S+$/i, "Ver ubicación en el mapa")}</div>}
          </div>
          <div className="tn-loc-cta">VER UBICACIÓN ›</div>
        </a>
      )}

      {t.obs && <div className="tn-card-obs">{t.obs}</div>}

      <div className="tn-card-footer">
        <div className="tn-teams-count">
          {entries.length} equipo{entries.length !== 1 ? "s" : ""} inscrito{entries.length !== 1 ? "s" : ""}
        </div>
        {cta}
        <button className="wa-invite-btn" style={{ marginTop: 12 }} onClick={invitarWhatsApp}>
          <span style={{ fontSize: 16 }}>📲</span> INVITAR AMIGOS POR WHATSAPP
        </button>
      </div>

      {entries.length > 0 && (
        <div className="tn-inscribed-list">
          <div className="tn-inscribed-title">EQUIPOS INSCRITOS</div>
          {teamRows}
        </div>
      )}

      {isAdmin && (
        <div className="tn-admin-actions">
          <button className="tn-admin-btn" onClick={() => changeStatus(t.id, "en_curso")}>
            ▶ EN CURSO
          </button>
          <button className="tn-admin-btn" onClick={() => changeStatus(t.id, "finalizado")}>
            ✓ FINALIZADO
          </button>
          <button
            className="tn-admin-btn danger"
            onClick={() => {
              if (confirm("¿Seguro que quieres eliminar este torneo? Esta acción no se puede deshacer.")) removeTournament(t.id);
            }}
          >
            ✕ ELIMINAR
          </button>
        </div>
      )}
    </div>
  );
}
