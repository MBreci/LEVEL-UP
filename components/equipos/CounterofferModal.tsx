"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTeams } from "@/context/TeamsContext";
import { coinsFmt } from "@/lib/domain/wallet";

export function CounterofferModal({ challengeId, onClose }: { challengeId: string; onClose: () => void }) {
  const { profile: me } = useAuth();
  const { teams, challenges, respondChallenge, sendCounteroffer } = useTeams();
  const [showForm, setShowForm] = useState(false);
  const [newBet, setNewBet] = useState("");
  const [error, setError] = useState("");

  const c = challenges.find((x) => x.id === challengeId);
  if (!c || !me) return null;
  const fromTeam = teams[c.fromTeamId];
  const bet = c.betAmount || 0;

  async function accept() {
    if (bet > 0 && (me!.saldo || 0) < bet) {
      setError(`Necesitas ${bet.toLocaleString("es-CO")} 🪙 para aceptar esta apuesta. Tu saldo disponible: ${coinsFmt(me!.saldo)} 🪙`);
      return;
    }
    const res = await respondChallenge(challengeId, true);
    if (!res.ok) {
      setError(res.error || "No se pudo aceptar.");
      return;
    }
    onClose();
  }

  async function reject() {
    await respondChallenge(challengeId, false);
    onClose();
  }

  async function submitCounter() {
    const amt = parseInt(newBet) || 0;
    if (amt > 0 && (me!.saldo || 0) < amt) {
      setError("Saldo insuficiente para esa apuesta.");
      return;
    }
    const res = await sendCounteroffer(challengeId, amt);
    if (!res.ok) {
      setError(res.error || "No se pudo enviar la contraoferta.");
      return;
    }
    onClose();
    alert("Contraoferta enviada.");
  }

  return (
    <div className="modal-overlay open" id="counteroffer-modal">
      <div className="auth-card">
        <div className="auth-tabs">
          <div className="auth-tab on">⚔ RETO RECIBIDO</div>
        </div>
        <div id="counteroffer-content">
          <div className="bet-balance-row" style={{ marginBottom: 12 }}>
            Tu saldo: <strong>{coinsFmt(me.saldo)} 🪙</strong>
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>{fromTeam ? fromTeam.name : "Un equipo"}</strong> te retó:
          </div>
          <div className="bet-preview" style={{ marginBottom: 8 }}>
            📅 {c.fecha} · {c.hora}
            <br />
            📍 {c.cancha}
            <br />
            {bet > 0 ? (
              <>
                🪙 Apuesta: <strong>{bet.toLocaleString("es-CO")} coins</strong> por equipo → ganador se lleva <strong>{(bet * 2).toLocaleString("es-CO")}</strong>
              </>
            ) : (
              "🤝 Sin apuesta"
            )}
          </div>
        </div>
        <div className="auth-error">{error}</div>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="auth-submit" style={{ flex: 1 }} onClick={accept}>
            ✅ ACEPTAR
          </button>
          <button className="auth-submit" style={{ flex: 1, background: "linear-gradient(135deg,#ff6b00,#cc4400)" }} onClick={() => { setShowForm(true); setNewBet(String(c.betAmount || 0)); }}>
            🔄 CONTRAOFERTAR
          </button>
          <button className="auth-cancel" style={{ flex: 1 }} onClick={reject}>
            ❌ RECHAZAR
          </button>
        </div>
        {showForm && (
          <div style={{ marginTop: 16 }}>
            <div className="auth-label">NUEVA APUESTA (coins)</div>
            <input className="auth-input" type="number" min={0} step={100} placeholder="0 = sin apuesta" value={newBet} onChange={(e) => setNewBet(e.target.value)} />
            <button className="auth-submit" style={{ marginTop: 8 }} onClick={submitCounter}>
              ENVIAR CONTRAOFERTA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
