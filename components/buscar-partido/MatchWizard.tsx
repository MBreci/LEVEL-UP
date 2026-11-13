"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { useMatches } from "@/context/MatchesContext";
import { ARENAS, CATEGORIAS_CANCHA, SUPERFICIES, formatHoraLabel, getArenaAvailableSlots } from "@/lib/domain/arenas";
import {
  BPW_STEPS,
  MODALIDADES,
  getMaxFaltan,
  getTotalJugadores,
  makeEmptyWizard,
  validateWizardStep,
  type BpWizardState,
  type WizardInvitado,
} from "@/lib/domain/matchWizard";
import { casualBetLabel, generoLabel, posBuscadasLabel } from "@/lib/domain/matches";

const POSICIONES_BUSCADAS: [string, string][] = [
  ["ARQUERO", "🧤 Arquero"],
  ["DEFENSA", "🛡 Defensa"],
  ["VOLANTE", "⚙ Volante"],
  ["DELANTERO", "⚡ Delantero"],
];
const GENEROS: ["MASCULINO" | "FEMENINO" | "MIXTO", string][] = [
  ["MASCULINO", "♂ MASCULINO"],
  ["FEMENINO", "♀ FEMENINO"],
  ["MIXTO", "⚧ MIXTO"],
];
const CASUAL_BETS: [string, string][] = [
  ["", "SIN APUESTA"],
  ["cancha", "🏟️ LA CANCHA"],
  ["bebida", "🍺 LA BEBIDA"],
  ["ambas", "🏟️🍺 CANCHA + BEBIDA"],
];

export function MatchWizard({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const { profiles } = useProfiles();
  const { openMatches, createMatch } = useMatches();

  const [step, setStep] = useState(1);
  const [w, setW] = useState<BpWizardState>(() => makeEmptyWizard());
  const [error, setError] = useState("");
  const [inviteQuery, setInviteQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalJug = getTotalJugadores(w);
  const maxFaltan = getMaxFaltan(w);
  const cuposAb = w.cuposAbiertos !== null ? w.cuposAbiertos : Math.min(maxFaltan, totalJug - 1 - w.invitados.length);

  function patch(p: Partial<BpWizardState>) {
    setW((prev) => ({ ...prev, ...p }));
  }

  function back() {
    if (step <= 1) return;
    setStep(step - 1);
    setError("");
  }

  async function next() {
    const err = validateWizardStep(step, w);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    if (step < 6) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    const finalW: BpWizardState = { ...w, cuposAbiertos: cuposAb };
    const res = await createMatch(finalW);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || "No se pudo publicar el partido.");
      return;
    }
    onClose();
  }

  function addInvitado(profileId: string) {
    const p = profiles[profileId];
    if (!p || !profile) return;
    const totalAhora = w.invitados.length;
    if (totalAhora >= maxFaltan) {
      setError(`Ya alcanzaste el máximo de ${maxFaltan} jugadores adicionales para fútbol ${w.categoria}.`);
      return;
    }
    const inv: WizardInvitado = { profileId, name: p.nickname || p.name, pos: p.position };
    patch({ invitados: [...w.invitados, inv], cuposAbiertos: null });
    setInviteQuery("");
  }

  function removeInvitado(idx: number) {
    patch({ invitados: w.invitados.filter((_, i) => i !== idx), cuposAbiertos: null });
  }

  function setInvitadoPos(idx: number, pos: string) {
    patch({ invitados: w.invitados.map((inv, i) => (i === idx ? { ...inv, pos } : inv)) });
  }

  function togglePosBuscada(v: string) {
    const cur = w.posiciones || [];
    patch({ posiciones: cur.includes(v) ? cur.filter((p) => p !== v) : [...cur, v] });
  }

  const suggestions = inviteQuery.trim()
    ? Object.values(profiles)
        .filter((p) => !profile || p.id !== profile.id)
        .filter((p) => !w.invitados.some((inv) => inv.profileId === p.id))
        .filter((p) => p.name.toLowerCase().includes(inviteQuery.toLowerCase()) || (p.nickname || "").toLowerCase().includes(inviteQuery.toLowerCase()))
        .slice(0, 6)
    : [];

  const prevConf = 1 + w.invitados.length;
  const ready =
    w.canchaLibreNombre && w.canchaLibreDireccion && w.canchaLibreBarrio && w.categoria && w.fechaISO && w.horaLibre && (step < 6 || cuposAb > 0);

  return (
    <div className="bp-form bp-wizard" id="bp-form" style={{ display: "block" }}>
      <div className="bpw-layout">
        <div className="bpw-main">
          <div className="bpw-steps">
            {BPW_STEPS.map((s, i) => (
              <div className={`bpw-step ${i + 1 === step ? "on" : ""} ${i + 1 < step ? "done" : ""}`} key={s}>
                <span className="bpw-step-n">{i + 1}</span>
                <span className="bpw-step-l">{s}</span>
              </div>
            ))}
          </div>

          <div className="bpw-body">
            {step === 1 && (
              <>
                <div className="auth-label">PASO 1 · ¿QUÉ TIPO DE PARTIDO QUIERES ORGANIZAR?</div>
                <div className="bpw-modal-grid">
                  {MODALIDADES.map((m) => (
                    <div
                      key={m.id}
                      className={`bpw-modal-tile ${w.modalidad === m.id ? "on" : ""}`}
                      onClick={() => patch({ modalidad: m.id })}
                    >
                      <div className="bpw-modal-icon">{m.icon}</div>
                      <div className="bpw-modal-label">{m.label}</div>
                      <div className="bpw-modal-desc">{m.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="auth-label">PASO 2 · SELECCIONA EL TIPO DE CANCHA</div>
                <div className="bpw-cat-grid">
                  {CATEGORIAS_CANCHA.map((c) => (
                    <div key={c.id} className={`bpw-cat-tile ${w.categoria === c.id ? "on" : ""}`} onClick={() => patch({ categoria: c.id })}>
                      <div className="bpw-cat-icon">{c.icon}</div>
                      <div className="bpw-cat-label">{c.label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="auth-label">PASO 3 · SELECCIONA LA SUPERFICIE</div>
                <div className="bpw-surf-grid">
                  {SUPERFICIES.map((s) => (
                    <div
                      key={s.id}
                      className={`bpw-surf-tile ${w.superficie === s.id ? "on" : ""} ${!s.disponible ? "soon" : ""}`}
                      onClick={() => s.disponible && patch({ superficie: s.id })}
                    >
                      <div className="bpw-surf-label">{s.label}</div>
                      {!s.disponible && <div className="bpw-surf-tag">PRÓXIMAMENTE</div>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <div className="bpw-libre-fields">
                <div className="bpw-libre-notice">
                  <span className="bpw-libre-notice-icon">⚠️</span>
                  <div className="bpw-libre-notice-text">
                    <strong>Separa la cancha antes de publicar</strong>
                    <br />
                    La reserva y el pago de la cancha son responsabilidad del organizador. Cuadra con todos los
                    integrantes del equipo al llegar a la cancha y antes del partido para que cada uno pague el valor
                    individual correspondiente. LEVEL UP no gestiona pagos para partidos en modo libre.
                  </div>
                </div>
                <div className="auth-label">NOMBRE DE LA CANCHA</div>
                <input
                  className="auth-input"
                  placeholder="Ej: Cancha El Campín"
                  autoComplete="off"
                  value={w.canchaLibreNombre}
                  onChange={(e) => patch({ canchaLibreNombre: e.target.value })}
                />
                <div className="auth-label">DIRECCIÓN</div>
                <input
                  className="auth-input"
                  placeholder="Ej: Cra 30 # 57-12"
                  autoComplete="off"
                  value={w.canchaLibreDireccion}
                  onChange={(e) => patch({ canchaLibreDireccion: e.target.value })}
                />
                <div className="auth-label">BARRIO / ZONA</div>
                <input
                  className="auth-input"
                  placeholder="Ej: Chapinero, Suba, Kennedy..."
                  autoComplete="off"
                  value={w.canchaLibreBarrio}
                  onChange={(e) => patch({ canchaLibreBarrio: e.target.value })}
                />
                <div className="auth-label">
                  VALOR POR PERSONA (COP) <span style={{ color: "var(--td)", fontWeight: 300 }}>· Opcional</span>
                </div>
                <input
                  className="auth-input"
                  type="number"
                  min={0}
                  placeholder="Ej: 15000"
                  value={w.canchaLibreValor}
                  onChange={(e) => patch({ canchaLibreValor: e.target.value })}
                />
                <div className="auth-label">
                  OBSERVACIONES <span style={{ color: "var(--td)", fontWeight: 300 }}>· Opcional</span>
                </div>
                <textarea
                  className="auth-input"
                  rows={3}
                  maxLength={300}
                  placeholder="Ej: Llevar peto azul, parqueadero disponible, trae agua..."
                  value={w.canchaLibreObs}
                  onChange={(e) => patch({ canchaLibreObs: e.target.value })}
                />
              </div>
            )}

            {step === 5 && (
              <MatchWizardStep5
                w={w}
                patch={patch}
                openMatches={openMatches}
              />
            )}

            {step === 6 && (
              <>
                <div className="bpw-cupos-visual">
                  <div className="bpw-cupos-title">DISTRIBUCIÓN DE CUPOS</div>
                  <div className="bpw-cupos-row">
                    {Array.from({ length: totalJug }, (_, i) => {
                      let cls = "open";
                      let title = "Cupo abierto";
                      if (i === 0) {
                        cls = "me";
                        title = "Tú (organizador)";
                      } else if (i < prevConf) {
                        cls = "confirmed";
                        title = w.invitados[i - 1]?.name || "Confirmado";
                      } else if (i < prevConf + cuposAb) {
                        cls = "searching";
                        title = "Cupo abierto al público";
                      } else {
                        cls = "unused";
                        title = "Sin asignar";
                      }
                      return <span className={`bpw-cupo-dot ${cls}`} title={title} key={i} />;
                    })}
                  </div>
                  <div className="bpw-cupos-legend">
                    <span>
                      <span className="bpw-cupo-dot me"></span> Tú
                    </span>
                    <span>
                      <span className="bpw-cupo-dot confirmed"></span> Confirmados previamente ({prevConf - 1})
                    </span>
                    <span>
                      <span className="bpw-cupo-dot searching"></span> Buscando ({cuposAb})
                    </span>
                  </div>
                </div>

                <div className="auth-label" style={{ marginTop: 20 }}>
                  CUPOS QUE QUIERES ABRIR AL PÚBLICO
                </div>
                <div className="bp-cupos-stepper">
                  <button
                    className="bp-stepper-btn"
                    onClick={() => patch({ cuposAbiertos: Math.max(1, cuposAb - 1) })}
                  >
                    −
                  </button>
                  <div className="bp-stepper-val">{cuposAb}</div>
                  <button
                    className="bp-stepper-btn"
                    onClick={() => patch({ cuposAbiertos: Math.min(totalJug - prevConf, cuposAb + 1) })}
                  >
                    +
                  </button>
                  <span className="bp-stepper-hint">de {maxFaltan} disponibles</span>
                </div>

                <div className="auth-label" style={{ marginTop: 20 }}>
                  AMIGOS YA CONFIRMADOS <span style={{ color: "var(--td)", fontWeight: 300 }}>· Opcional — no cuentan como cupos abiertos</span>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    className="auth-input"
                    placeholder="Busca por nombre o apodo"
                    autoComplete="off"
                    value={inviteQuery}
                    onChange={(e) => setInviteQuery(e.target.value)}
                  />
                  {suggestions.length > 0 && (
                    <div className="pl-suggest open">
                      {suggestions.map((p) => (
                        <div className="pl-suggest-item" key={p.id} onClick={() => addInvitado(p.id)}>
                          <span>
                            {p.nickname || p.name} <span className="s-sub">{p.position}</span>
                          </span>
                          <span className="notif-accept" style={{ padding: "6px 12px", fontSize: 10 }}>
                            INVITAR
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0" }}>
                  {w.invitados.map((inv, i) => (
                    <span className="bp-invite-chip" key={inv.profileId}>
                      {inv.name}
                      <select value={inv.pos} onChange={(e) => setInvitadoPos(i, e.target.value)}>
                        {["DEL", "MED", "DEF", "POR"].map((p) => (
                          <option value={p} key={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <span className="bp-invite-chip-x" onClick={() => removeInvitado(i)}>
                        ✕
                      </span>
                    </span>
                  ))}
                </div>

                <label className="auth-consent" style={{ marginTop: 12 }}>
                  <input type="checkbox" checked={w.abierto} onChange={(e) => patch({ abierto: e.target.checked })} />
                  <span>Partido abierto: los jugadores pueden unirse directamente. Desmárcalo para aprobar cada solicitud.</span>
                </label>
                <div className="auth-label" style={{ marginTop: 12 }}>
                  OVR MÍNIMO <span style={{ color: "var(--td)", fontWeight: 300 }}>· Opcional</span>
                </div>
                <input
                  className="auth-input"
                  type="number"
                  min={0}
                  max={99}
                  placeholder="Ej: 60 — deja vacío para todos los niveles"
                  value={w.ovrMin}
                  onChange={(e) => patch({ ovrMin: e.target.value })}
                />

                <div className="auth-label" style={{ marginTop: 16 }}>
                  ¿QUÉ POSICIONES BUSCAS? <span style={{ color: "var(--td)", fontWeight: 300 }}>· Opcional</span>
                </div>
                <div className="bp-casualbet-opts">
                  {POSICIONES_BUSCADAS.map(([v, l]) => (
                    <button type="button" key={v} className={`bp-casualbet ${(w.posiciones || []).includes(v) ? "on" : ""}`} onClick={() => togglePosBuscada(v)}>
                      {l}
                    </button>
                  ))}
                </div>

                <div className="auth-label" style={{ marginTop: 16 }}>
                  MODALIDAD DE GÉNERO
                </div>
                <div className="bp-casualbet-opts">
                  {GENEROS.map(([v, l]) => (
                    <button type="button" key={v} className={`bp-casualbet ${(w.genero || "MASCULINO") === v ? "on" : ""}`} onClick={() => patch({ genero: v })}>
                      {l}
                    </button>
                  ))}
                </div>

                <div className="auth-label" style={{ marginTop: 16 }}>
                  APUESTA AMISTOSA <span style={{ color: "var(--td)", fontWeight: 300 }}>· Opcional — el equipo perdedor paga</span>
                </div>
                <div className="bp-casualbet-opts">
                  {CASUAL_BETS.map(([v, l]) => (
                    <button
                      type="button"
                      key={v || "none"}
                      className={`bp-casualbet ${(w.casualBet || "") === v ? "on" : ""}`}
                      onClick={() => patch({ casualBet: (v || null) as BpWizardState["casualBet"] })}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="auth-error" id="bp-error">
              {error}
            </div>
            <div className="bpw-nav">
              <button className="auth-cancel" id="bpw-back" style={{ display: step > 1 ? "inline-block" : "none" }} onClick={back}>
                ATRÁS
              </button>
              <button className="auth-submit" id="bpw-next" disabled={submitting} onClick={next}>
                {step === 6 ? (submitting ? "PUBLICANDO..." : "PUBLICAR PARTIDO") : "SIGUIENTE"}
              </button>
            </div>
          </div>
        </div>

        <div className="bpw-summary">
          <div className="bpw-summary-title">RESUMEN DEL PARTIDO</div>
          <div className="bpw-summary-row">
            <span>MODALIDAD</span>
            <strong>{w.modalidad ? MODALIDADES.find((m) => m.id === w.modalidad)!.label : "—"}</strong>
          </div>
          <div className="bpw-summary-row">
            <span>CANCHA</span>
            <strong>{w.canchaLibreNombre || "—"}</strong>
          </div>
          <div className="bpw-summary-row">
            <span>FÚTBOL</span>
            <strong>{w.categoria ? "FÚTBOL " + w.categoria : "—"}</strong>
          </div>
          <div className="bpw-summary-row">
            <span>FECHA</span>
            <strong>{w.fechaISO || "—"}</strong>
          </div>
          <div className="bpw-summary-row">
            <span>HORA</span>
            <strong>{(w.canchaLibre ? w.horaLibre : w.horaValue ? formatHoraLabel(w.horaValue) : "") || "—"}</strong>
          </div>
          <div className="bpw-summary-row">
            <span>VALOR/PERSONA</span>
            <strong>{w.canchaLibreValor ? "$" + parseInt(w.canchaLibreValor).toLocaleString("es-CO") : "GRATIS"}</strong>
          </div>
          <div className="bpw-summary-row">
            <span>CAPITÁN</span>
            <strong>{profile ? profile.nickname || profile.name : "—"}</strong>
          </div>
          {w.categoria && (
            <div className="bpw-summary-row">
              <span>CUPOS TOTALES</span>
              <strong>{totalJug} jugadores</strong>
            </div>
          )}
          {step === 6 && (
            <div className="bpw-summary-row">
              <span>BUSCANDO</span>
              <strong>
                {cuposAb} jugador{cuposAb !== 1 ? "es" : ""}
              </strong>
            </div>
          )}
          {step === 6 && (
            <div className="bpw-summary-row">
              <span>CONFIRMADOS</span>
              <strong>
                {prevConf} (tú{w.invitados.length ? " + " + w.invitados.length : ""})
              </strong>
            </div>
          )}
          <div className="bpw-summary-row">
            <span>GÉNERO</span>
            <strong>{generoLabel(w.genero)}</strong>
          </div>
          {w.posiciones && w.posiciones.length > 0 && (
            <div className="bpw-summary-row">
              <span>BUSCA</span>
              <strong>{posBuscadasLabel(w.posiciones)}</strong>
            </div>
          )}
          {w.casualBet && (
            <div className="bpw-summary-row">
              <span>APUESTA</span>
              <strong>{casualBetLabel(w.casualBet)}</strong>
            </div>
          )}
          <div className="bpw-summary-row">
            <span>ESTADO</span>
            <strong className={ready ? "on" : ""}>{ready ? "LISTO PARA PUBLICAR" : "EN PROGRESO"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchWizardStep5({
  w,
  patch,
  openMatches,
}: {
  w: BpWizardState;
  patch: (p: Partial<BpWizardState>) => void;
  openMatches: import("@/types/match").OpenMatch[];
}) {
  const todayISO = new Date().toISOString().split("T")[0];
  const slots = w.arenaId && w.fechaISO ? getArenaAvailableSlots(openMatches, w.arenaId, w.fechaISO) : [];
  const arena = w.arenaId ? ARENAS.find((a) => a.id === w.arenaId) : null;

  return (
    <>
      <div className="auth-label">PASO 5 · FECHA Y HORA</div>
      <input
        className="auth-input bpw-date-input"
        type="date"
        min={todayISO}
        value={w.fechaISO || ""}
        onChange={(e) => patch({ fechaISO: e.target.value || null, horaValue: null })}
      />
      {w.canchaLibre ? (
        <>
          <div className="auth-label" style={{ marginTop: 18 }}>
            HORA DE INICIO
          </div>
          <input className="auth-input" type="time" value={w.horaLibre || ""} onChange={(e) => patch({ horaLibre: e.target.value })} />
        </>
      ) : (
        <>
          <div className="auth-label" style={{ marginTop: 18 }}>
            SELECCIONA EL HORARIO
          </div>
          <div className="bpw-hora-grid">
            {slots.length ? (
              slots.map((s) => {
                const restantes = (arena?.maxSimultaneos || 1) - s.ocupados;
                const cls = !s.disponible ? "full" : restantes <= 1 ? "last" : "open";
                return (
                  <div
                    key={s.hora}
                    className={`bpw-hora-tile ${cls} ${w.horaValue === s.hora ? "on" : ""}`}
                    onClick={() => s.disponible && patch({ horaValue: s.hora })}
                  >
                    <div className="bpw-hora-label">{s.label}</div>
                    <div className="bpw-hora-tag">{!s.disponible ? "COMPLETO" : restantes <= 1 ? "ÚLTIMO CUPO" : "DISPONIBLE"}</div>
                  </div>
                );
              })
            ) : (
              <div className="bp-empty">Selecciona arena y fecha primero.</div>
            )}
          </div>
        </>
      )}
    </>
  );
}
