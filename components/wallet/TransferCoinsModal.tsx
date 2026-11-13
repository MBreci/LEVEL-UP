"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { getSupabase } from "@/lib/supabase/client";
import { transferCoins } from "@/lib/domain/walletTransfer";
import { coinsFmt } from "@/lib/domain/wallet";

export function TransferCoinsModal({ onClose }: { onClose: () => void }) {
  const { profile: me, saveProfile } = useAuth();
  const { profiles, setProfile } = useProfiles();
  const [query, setQuery] = useState("");
  const [toId, setToId] = useState<string | null>(null);
  const [toName, setToName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  if (!me) return null;

  const q = query.toLowerCase().trim();
  const results = q.length >= 2 ? Object.values(profiles).filter((p) => p.id !== me.id && (p.name.toLowerCase().includes(q) || (p.nickname || "").toLowerCase().includes(q))).slice(0, 8) : [];

  function selectPlayer(id: string, name: string) {
    setToId(id);
    setQuery(name);
    setToName(name);
  }

  async function submit() {
    const amt = parseInt(amount) || 0;
    if (!toId) {
      setError("Selecciona un jugador.");
      return;
    }
    if (amt <= 0) {
      setError("Ingresa una cantidad válida.");
      return;
    }
    if ((me!.saldo || 0) < amt) {
      setError("Saldo insuficiente.");
      return;
    }
    const toProfile = profiles[toId];
    if (!toProfile) {
      setError("Jugador no encontrado.");
      return;
    }
    setError("");
    const senderName = me!.nickname || me!.name;
    const receiverName = toProfile.nickname || toProfile.name;
    const res = await transferCoins(getSupabase(), me!.id, senderName, toId, receiverName, amt);
    if (!res.ok) {
      setError(res.error || "Error al procesar la transferencia.");
      return;
    }
    await saveProfile({ ...me!, saldo: (me!.saldo || 0) - amt });
    setProfile({
      ...toProfile,
      saldo: (toProfile.saldo || 0) + amt,
      notifications: [...toProfile.notifications, { icon: "🪙", text: `${senderName} te envió ${amt.toLocaleString("es-CO")} Level Coins.`, time: "AHORA" }],
    });
    onClose();
    alert(`✅ ${amt.toLocaleString("es-CO")} 🪙 enviados a ${receiverName}.`);
  }

  return (
    <div className="modal-overlay open" id="transfer-modal">
      <div className="auth-card">
        <div className="auth-tabs">
          <div className="auth-tab on">🪙 ENVIAR LEVEL COINS</div>
        </div>
        <div className="bet-balance-row" style={{ marginBottom: 16 }}>
          Tu saldo: <span className="bet-balance-val">{coinsFmt(me.saldo)}</span> 🪙
        </div>
        <div className="auth-label">BUSCAR JUGADOR</div>
        <input
          className="auth-input"
          placeholder="Nombre o apodo..."
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setToId(null);
          }}
        />
        <div style={{ maxHeight: 160, overflowY: "auto", margin: "8px 0" }}>
          {!toId &&
            results.map((p) => (
              <div className="transfer-player-row" key={p.id} onClick={() => selectPlayer(p.id, p.nickname || p.name)}>
                {p.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} alt="" />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#0d1820", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                    {(p.nickname || p.name).slice(0, 2)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 12, color: "#e8f4ff" }}>{p.nickname || p.name}</div>
                  <div style={{ fontSize: 10, color: "#4a6a7a" }}>
                    {p.position} · OVR {p.ovr}
                  </div>
                </div>
              </div>
            ))}
        </div>
        {toId && <div className="bet-preview">Enviando a: <strong style={{ color: "#00ff88" }}>{toName}</strong></div>}
        <div className="auth-label" style={{ marginTop: 12 }}>
          CANTIDAD (coins)
        </div>
        <input className="auth-input" type="number" min={1} step={1} placeholder="Ej: 500" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div className="auth-error">{error}</div>
        <button className="auth-submit" onClick={submit}>
          ENVIAR COINS
        </button>
        <button className="auth-cancel" onClick={onClose}>
          CANCELAR
        </button>
      </div>
    </div>
  );
}
