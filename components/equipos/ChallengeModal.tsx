"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTeams } from "@/context/TeamsContext";
import { CANCHAS_REGISTRADAS } from "@/lib/domain/teams";
import { coinsFmt } from "@/lib/domain/wallet";

export function ChallengeModal({ toTeamId, onClose }: { toTeamId: string; onClose: () => void }) {
  const { profile: me } = useAuth();
  const { teams, sendChallenge } = useTeams();
  const [cancha, setCancha] = useState(CANCHAS_REGISTRADAS[0]);
  const [costo, setCosto] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [jugadores, setJugadores] = useState("6");
  const [obs, setObs] = useState("");
  const [betEnabled, setBetEnabled] = useState(false);
  const [betAmount, setBetAmount] = useState("");
  const [error, setError] = useState("");

  const toTeam = teams[toTeamId];
  const amt = parseInt(betAmount) || 0;
  const mySaldo = me?.saldo || 0;
  const enough = mySaldo >= amt;

  async function submit() {
    const res = await sendChallenge({
      toTeamId,
      cancha,
      costo,
      fecha,
      hora,
      jugadores,
      observaciones: obs,
      betAmount: betEnabled ? amt : 0,
    });
    if (!res.ok) {
      setError(res.error || "No se pudo enviar el reto.");
      return;
    }
    onClose();
    alert(
      "Reto enviado al capitán de " + (toTeam ? toTeam.name : "equipo rival") + (betEnabled && amt > 0 ? `\n🪙 ${amt.toLocaleString("es-CO")} coins bloqueados hasta el resultado.` : ".")
    );
  }

  return (
    <div className="modal-overlay open" id="challenge-modal">
      <div className="auth-card">
        <div className="auth-tabs">
          <div className="auth-tab on">RETAR EQUIPO</div>
        </div>
        <div className="auth-label">CANCHA</div>
        <select className="auth-input" value={cancha} onChange={(e) => setCancha(e.target.value)}>
          {CANCHAS_REGISTRADAS.map((c) => (
            <option value={c} key={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="auth-label">COSTO (OPCIONAL)</div>
        <input className="auth-input" value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="Ej: $10.000 por jugador" maxLength={30} />

        <div className="bet-section">
          <div className="bet-header">
            <span className="bet-icon">🪙</span>
            <div>
              <div className="bet-title">APUESTA EN LEVEL COINS</div>
              <div className="bet-sub">El ganador se lleva todo. Los coins se bloquean al aceptar el reto.</div>
            </div>
            <label className="bet-toggle-wrap">
              <input type="checkbox" checked={betEnabled} onChange={(e) => setBetEnabled(e.target.checked)} />
              <span className="bet-toggle"></span>
            </label>
          </div>
          {betEnabled && (
            <div>
              <div className="bet-balance-row">
                Tu saldo: <span className="bet-balance-val">{coinsFmt(me?.saldo)}</span> 🪙
              </div>
              <div className="auth-label" style={{ marginTop: 12 }}>
                COINS A APOSTAR (cada equipo)
              </div>
              <div className="bet-inp-row">
                {[500, 1000, 2000, 5000].map((v) => (
                  <button className="bet-quick" key={v} onClick={() => setBetAmount(String(v))}>
                    {v.toLocaleString("es-CO")}
                  </button>
                ))}
              </div>
              <input className="auth-input" type="number" min={100} step={100} placeholder="Ej: 1000" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} />
              {amt > 0 && (
                <div className="bet-preview">
                  <span style={{ color: enough ? "#00ff88" : "#ff4444" }}>
                    {enough ? "✅" : "⚠️ Saldo insuficiente —"} Apostando <strong>{amt.toLocaleString("es-CO")} 🪙</strong> · El ganador se lleva{" "}
                    <strong>{(amt * 2).toLocaleString("es-CO")} 🪙</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="auth-label">FECHA</div>
        <input className="auth-input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <div className="auth-label">HORA</div>
        <input className="auth-input" value={hora} onChange={(e) => setHora(e.target.value)} placeholder="Ej: 7:00 PM" maxLength={20} />
        <div className="auth-label">JUGADORES POR EQUIPO</div>
        <input className="auth-input" type="number" min={1} max={11} value={jugadores} onChange={(e) => setJugadores(e.target.value)} />
        <div className="auth-label">OBSERVACIONES (OPCIONAL)</div>
        <textarea className="auth-input" rows={3} maxLength={200} placeholder="Ej: Llevar peto, cancha sintética" value={obs} onChange={(e) => setObs(e.target.value)} />
        <div className="auth-error">{error}</div>
        <button className="auth-submit" onClick={submit}>
          ENVIAR RETO
        </button>
        <button className="auth-cancel" onClick={onClose}>
          CANCELAR
        </button>
      </div>
    </div>
  );
}
