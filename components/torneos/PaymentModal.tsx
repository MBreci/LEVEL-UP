"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTournaments } from "@/context/TournamentsContext";
import { coinsFmt, initRecharge, openWompiCheckout } from "@/lib/domain/wallet";
import type { Team } from "@/types/team";
import type { Tournament } from "@/types/tournament";

export function PaymentModal({ tournament: t, myTeam, onClose }: { tournament: Tournament; myTeam: Team; onClose: () => void }) {
  const { profile: me, saveProfile } = useAuth();
  const { registerTeam } = useTournaments();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!me) return null;

  const saldo = me.saldo || 0;
  const valor = t.valorInscripcion || 0;
  const puedeConSaldo = saldo >= valor;

  async function pagarConSaldo() {
    if (!me || saldo < valor) {
      setError("Saldo insuficiente.");
      return;
    }
    setBusy(true);
    const entry = { teamId: myTeam.id, paidAt: Date.now(), paymentMethod: "saldo" as const };
    await saveProfile({ ...me, saldo: Math.round((saldo - valor) * 100) / 100 });
    const res = await registerTeam(t.id, entry);
    setBusy(false);
    if (!res.ok) {
      setError(res.error || "No se pudo confirmar la inscripción.");
      return;
    }
    onClose();
    alert(`✅ ¡${myTeam.name} inscrito al torneo! Saldo descontado: $${valor.toLocaleString("es-CO")}`);
  }

  async function pagarConWompi() {
    if (valor <= 0) {
      await pagarConSaldo();
      return;
    }
    setBusy(true);
    const init = await initRecharge(me!.id, valor);
    if (!init.ok) {
      setBusy(false);
      setError(init.error || "Error iniciando el pago. Intenta de nuevo.");
      return;
    }
    const approved = await openWompiCheckout(init, location.href);
    setBusy(false);
    if (!approved) return;
    const entry = { teamId: myTeam.id, paidAt: Date.now(), paymentMethod: "wompi" as const, wompiRef: init.reference };
    const res = await registerTeam(t.id, entry);
    if (!res.ok) {
      setError(res.error || "No se pudo confirmar la inscripción.");
      return;
    }
    onClose();
    alert(`✅ ¡${myTeam.name} inscrito al torneo!`);
  }

  return (
    <div className="modal-overlay open" id="tn-pay-modal">
      <div className="tn-pay-card">
        <div className="tn-pay-title" id="tn-pay-title">
          INSCRIBIR: {myTeam.name}
        </div>
        <div className="tn-pay-body" id="tn-pay-body">
          <div className="tn-pay-torneo">{t.nombre}</div>
          <div className="tn-pay-detalle">
            <span>📅 {t.fecha}</span>
            <span>📍 {t.cancha}</span>
          </div>
          <div className="tn-pay-monto">
            VALOR DE INSCRIPCIÓN
            <br />
            <strong>🪙 {coinsFmt(valor)} Level Coins</strong>
          </div>
          <div className="tn-pay-methods">
            <button className={`tn-pay-btn saldo ${puedeConSaldo ? "" : "disabled"}`} disabled={busy || !puedeConSaldo} onClick={pagarConSaldo}>
              <span className="tn-pay-btn-icon">🪙</span>
              <span>
                PAGAR CON COINS
                <br />
                <small>Tienes: {coinsFmt(saldo)} 🪙</small>
              </span>
              {!puedeConSaldo && <span className="tn-pay-insuf">SALDO INSUFICIENTE</span>}
            </button>
            <button className="tn-pay-btn wompi" disabled={busy} onClick={pagarConWompi}>
              <span className="tn-pay-btn-icon">🏦</span>
              <span>
                PAGAR CON WOMPI
                <br />
                <small>Tarjeta, PSE, Nequi</small>
              </span>
            </button>
          </div>
          {error && <div className="auth-error">{error}</div>}
        </div>
        <button className="auth-cancel" onClick={onClose}>
          CANCELAR
        </button>
      </div>
    </div>
  );
}
