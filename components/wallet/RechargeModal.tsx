"use client";

import { COIN_PACKS } from "@/lib/domain/wallet";

export function RechargeModal({
  open,
  error,
  onSelectPack,
  onClose,
}: {
  open: boolean;
  error: string;
  onSelectPack: (pesos: number) => void;
  onClose: () => void;
}) {
  return (
    <div className={`modal-overlay ${open ? "open" : ""}`} id="recharge-modal">
      <div className="auth-card">
        <div className="auth-label" style={{ fontSize: 15, color: "var(--g)" }}>
          COMPRAR LEVEL COINS
        </div>
        <div className="auth-photo-note">Elige un paquete. Pagas con tarjeta, PSE o Nequi (Wompi).</div>
        <div className="wallet-quick-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {COIN_PACKS.map(([coins, pesos, label]) => (
            <button
              key={pesos}
              className="wallet-quick-btn"
              style={{ display: "flex", flexDirection: "column", gap: 2, height: "auto", padding: 12 }}
              onClick={() => onSelectPack(pesos)}
            >
              {label && <span style={{ fontSize: 8, letterSpacing: 1, color: "var(--g)" }}>{label.toUpperCase()}</span>}
              <b style={{ fontSize: 15, color: "var(--gold)" }}>🪙 {coins.toLocaleString("es-CO")}</b>
              <span style={{ fontSize: 10, opacity: 0.6 }}>${pesos.toLocaleString("es-CO")}</span>
            </button>
          ))}
        </div>
        <div className="auth-error" id="recharge-error">
          {error}
        </div>
        <button className="auth-cancel" onClick={onClose}>
          CANCELAR
        </button>
      </div>
    </div>
  );
}
