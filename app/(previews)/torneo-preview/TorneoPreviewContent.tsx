"use client";

import { useRef, useState } from "react";
import { advanceResult, BASE_TEAMS, buildBracket, makeTeam, ROUND_LABELS, shuffleTeams, type PreviewMatch, type PreviewTeam } from "./bracket";

function Slot({ team, score, state }: { team: PreviewTeam | null; score: number | null; state: "" | "win" | "lose" }) {
  if (!team) {
    return (
      <div className="slot">
        <div className="b" style={{ background: "#ffffff08", color: "#ffffff20" }}>
          ?
        </div>
        <div className="n">Por definir</div>
        <div className="sc">—</div>
      </div>
    );
  }
  return (
    <div className={`slot ${state}`}>
      <div className="b" style={{ background: `${team.color}22`, color: team.color, border: `1px solid ${team.color}55` }}>
        {team.ini}
      </div>
      <div className="n">{team.name}</div>
      <div className="sc">{score == null ? "–" : score}</div>
    </div>
  );
}

/**
 * Puerto fiel de torneo-preview.html — mockup del Torneo de Apertura con
 * sorteo y bracket simulados en el cliente (sin conexión real a datos, tal
 * como el original: "vanilla · sin conexión a datos reales").
 */
export function TorneoPreviewContent() {
  const [teams, setTeams] = useState<PreviewTeam[]>(() => BASE_TEAMS.map(makeTeam));
  const [shuffling, setShuffling] = useState(false);
  const [rounds, setRounds] = useState<PreviewMatch[][] | null>(null);
  const [championName, setChampionName] = useState<string | null>(null);
  const shuffleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const championRef = useRef<HTMLDivElement>(null);

  const [participarOpen, setParticiparOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [pName, setPName] = useState("");
  const [pContact, setPContact] = useState("");
  const [pMsg, setPMsg] = useState("");
  const [formError, setFormError] = useState("");

  function resetDraw() {
    if (shuffleTimer.current) clearInterval(shuffleTimer.current);
    setShuffling(false);
    setTeams(BASE_TEAMS.map(makeTeam));
  }

  function doShuffle() {
    setShuffling(true);
    let n = 0;
    shuffleTimer.current = setInterval(() => {
      setTeams((prev) => shuffleTeams(prev));
      n++;
      if (n > 10) {
        if (shuffleTimer.current) clearInterval(shuffleTimer.current);
        setShuffling(false);
        setTeams((prev) => {
          setRounds(buildBracket(prev));
          setChampionName(null);
          return prev;
        });
      }
    }, 130);
  }

  function resetBracket() {
    setRounds(buildBracket(teams));
    setChampionName(null);
  }

  function handleAdvanceResult() {
    const current = rounds || buildBracket(teams);
    const result = advanceResult(current);
    setRounds(result.rounds);
    if (result.championName) {
      setChampionName(result.championName);
      setTimeout(() => championRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    }
  }

  function closeParticipar() {
    setParticiparOpen(false);
    setSent(false);
    setFormError("");
  }

  function sendParticipar() {
    if (!pName.trim() || !pContact.trim()) {
      setFormError("Pon tu nombre y un contacto para escribirte.");
      return;
    }
    // En producción esto llamaría a submit_feedback -> aviso al organizador;
    // este preview no tiene conexión real a datos, igual que el original.
    setFormError("");
    setSent(true);
  }

  return (
    <div className="tp-preview-page">
      <div className="preview-bar">◆ PREVIEW · ASÍ SE VERÍA EL TORNEO DE APERTURA · nada de esto está publicado todavía</div>

      <section className="t-banner">
        <div className="wrap">
          <div className="t-live-chip">
            <span className="t-live-dot"></span>EN VIVO PRÓXIMAMENTE
          </div>
          <div className="t-eyebrow">LEVEL UP · TEMPORADA BETA</div>
          <h1 className="t-title">
            TORNEO DE
            <br />
            <span>APERTURA</span>
          </h1>
          <p className="t-sub">El primer torneo de la comunidad. 8 equipos, un solo campeón. Sorteo en vivo, transmisión del evento y el camino al título minuto a minuto.</p>
          <div className="t-meta">
            <div className="t-meta-i">
              <div className="n">8</div>
              <div className="l">EQUIPOS</div>
            </div>
            <div className="t-meta-i">
              <div className="n">7</div>
              <div className="l">PARTIDOS</div>
            </div>
            <div className="t-meta-i">
              <div className="n">1</div>
              <div className="l">CAMPEÓN</div>
            </div>
            <div className="t-meta-i">
              <div className="n">SÁB</div>
              <div className="l">FECHA</div>
            </div>
          </div>
          <div className="t-cta">
            <button className="btn-o" onClick={() => setParticiparOpen(true)}>
              QUIERO PARTICIPAR
            </button>
            <a className="btn-ghost" href="#transmision">
              VER TRANSMISIÓN
            </a>
          </div>
        </div>
      </section>

      <section className="sec" id="transmision">
        <div className="wrap">
          <div className="sec-eyebrow">EN VIVO</div>
          <h2 className="sec-h">Transmisión del evento</h2>
          <p className="sec-p">El día del torneo, aquí verás todo en vivo: los partidos, el sorteo y la definición del campeón. Se activa automáticamente cuando arranca la transmisión.</p>
          <div className="stream">
            <div className="stream-badge">
              <span className="t-live-dot"></span>EN VIVO
            </div>
            <div>
              <div className="stream-ico">📺</div>
              <div className="stream-t">LA TRANSMISIÓN APARECERÁ AQUÍ</div>
              <div className="stream-s">YouTube / Twitch embebido · sábado 6:00 PM</div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-eyebrow">SORTEO</div>
          <h2 className="sec-h">Mezcla de equipos en vivo</h2>
          <p className="sec-p">El día del sorteo se mezclan los equipos con esta animación y queda definido el orden del cuadro. Dale a &quot;Mezclar&quot; para ver cómo se sentiría.</p>
          <div className="draw-stage">
            <div className="draw-grid">
              {teams.map((t, i) => (
                <div className={`team-chip${shuffling ? " shuffling" : ""}${!shuffling ? " locked" : ""}`} key={t.name}>
                  <div className="badge" style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}55` }}>
                    {t.ini}
                  </div>
                  <div className="nm">{t.name}</div>
                  <div className="seed">#{i + 1}</div>
                </div>
              ))}
            </div>
            <div className="draw-controls">
              <button className="btn-sm p" onClick={doShuffle}>
                🎲 MEZCLAR EQUIPOS
              </button>
              <button className="btn-sm g" onClick={resetDraw}>
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-eyebrow">CAMINO AL TÍTULO</div>
          <h2 className="sec-h">El cuadro se va cerrando</h2>
          <p className="sec-p">A medida que los admin suben los resultados, los equipos que pierden quedan eliminados y el cuadro se cierra hasta llegar al campeón. Dale &quot;Avanzar resultado&quot; para simularlo.</p>
          <div className="bracket-scroll">
            <div className="bracket">
              {(rounds || buildBracket(teams)).map((round, ri) => (
                <div className="round" key={ri}>
                  <div className="round-lbl">{ROUND_LABELS[ri]}</div>
                  {round.map((m, mi) => {
                    const sa = m.w ? (m.w === "a" ? "win" : "lose") : "";
                    const sb = m.w ? (m.w === "b" ? "win" : "lose") : "";
                    return (
                      <div className={`match${m.w ? " decided" : ""}`} key={mi}>
                        <Slot team={m.a} score={m.sa} state={sa} />
                        <Slot team={m.b} score={m.sb} state={sb} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className={`champion${championName ? " show" : ""}`} ref={championRef}>
            <div className="champ-cup">🏆</div>
            <div className="champ-t">CAMPEÓN DEL TORNEO DE APERTURA</div>
            <div className="champ-n">{championName || "—"}</div>
          </div>
          <div className="draw-controls">
            <button className="btn-sm p" onClick={handleAdvanceResult}>
              ▶ AVANZAR RESULTADO
            </button>
            <button className="btn-sm g" onClick={resetBracket}>
              Reiniciar cuadro
            </button>
          </div>
        </div>
      </section>

      <footer>LEVEL UP · PREVIEW DEL TORNEO · vanilla · sin conexión a datos reales</footer>

      <div className={`modal${participarOpen ? " open" : ""}`}>
        <div className="modal-box">
          <button className="modal-x" onClick={closeParticipar}>
            ×
          </button>
          {!sent ? (
            <div>
              <div className="modal-eyebrow">TORNEO DE APERTURA</div>
              <div className="modal-h">Quiero participar</div>
              <p className="modal-p">Déjanos tus datos y te escribimos para armar tu equipo y darte el cupo. El mensaje le llega directo al organizador.</p>
              <div className="fld">
                <label>NOMBRE Y APODO</label>
                <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Ej: Miguel · Breco" />
              </div>
              <div className="fld">
                <label>CELULAR O CORREO</label>
                <input value={pContact} onChange={(e) => setPContact(e.target.value)} placeholder="Para contactarte" />
              </div>
              <div className="fld">
                <label>MENSAJE (OPCIONAL)</label>
                <textarea value={pMsg} onChange={(e) => setPMsg(e.target.value)} placeholder="¿Ya tienes equipo? ¿Cuántos son?" />
              </div>
              {formError && <p className="modal-p" style={{ color: "#ff5a5a" }}>{formError}</p>}
              <button className="btn-o" style={{ width: "100%" }} onClick={sendParticipar}>
                ENVIAR SOLICITUD
              </button>
            </div>
          ) : (
            <div className="modal-ok">
              <div className="ico">✅</div>
              <div className="modal-h">¡Solicitud enviada!</div>
              <p className="modal-p" style={{ marginBottom: 20 }}>
                Te contactamos muy pronto. Guarda tu lugar en el Torneo de Apertura. 🚀
              </p>
              <button className="btn-ghost" style={{ width: "100%" }} onClick={closeParticipar}>
                LISTO
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
