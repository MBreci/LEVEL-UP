"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { getSupabase } from "@/lib/supabase/client";
import {
  coinsFmt,
  fetchWalletTransactions,
  initRecharge,
  openWompiCheckout,
  pollWalletBalance,
  toCoins,
  walletMovLabel,
  type WalletTransaction,
} from "@/lib/domain/wallet";
import { RechargeModal } from "@/components/wallet/RechargeModal";
import { TransferCoinsModal } from "@/components/wallet/TransferCoinsModal";

function WalletSuccessToast({ amount, onDone }: { amount: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="wallet-success-toast">
      <div className="wallet-success-amt">+{toCoins(amount).toLocaleString("es-CO")} 🪙</div>
      <div>Coins acreditados</div>
    </div>
  );
}

export function SaldoContent() {
  const { profile: me } = useAuth();
  const { setProfile } = useProfiles();
  const [tx, setTx] = useState<WalletTransaction[] | null>(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeError, setRechargeError] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [toast, setToast] = useState<number | null>(null);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    (async () => {
      const data = await fetchWalletTransactions(getSupabase(), me.id);
      if (!cancelled) setTx(data);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  if (!me) return null;

  const totalRecargado = (tx || []).filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
  const totalUtilizado = (tx || []).filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

  async function selectCoinPack(pesos: number) {
    setRechargeError("");
    const init = await initRecharge(me!.id, pesos);
    if (!init.ok) {
      setRechargeError(init.error || "No se pudo iniciar la recarga.");
      return;
    }
    setRechargeOpen(false);
    const approved = await openWompiCheckout(init, `${location.origin}/saldo`);
    if (approved) {
      setToast(pesos);
      const newSaldo = await pollWalletBalance(getSupabase(), me!.id, me!.saldo || 0);
      if (newSaldo !== null) {
        setProfile({ ...me!, saldo: newSaldo });
        setTx(await fetchWalletTransactions(getSupabase(), me!.id));
      }
    }
  }

  return (
    <div className="wallet-wrap" id="saldo-content">
      <div className="wallet-balance-card">
        <div className="wallet-balance-label">TUS LEVEL COINS</div>
        <div className="wallet-balance-amount" id="wallet-balance-amount">
          🪙 {coinsFmt(me.saldo)}
        </div>
        <button className="hw-cta-main" onClick={() => setRechargeOpen(true)}>
          💳 COMPRAR COINS
        </button>
        <button className="btn-g" style={{ marginTop: 10, width: "100%", fontSize: 10 }} onClick={() => setTransferOpen(true)}>
          🪙 ENVIAR COINS A UN JUGADOR
        </button>
      </div>
      <div className="wallet-stats-row">
        <div className="wallet-stat">
          <div className="wallet-stat-v">🪙 {toCoins(totalRecargado).toLocaleString("es-CO")}</div>
          <div className="wallet-stat-l">TOTAL COMPRADO</div>
        </div>
        <div className="wallet-stat">
          <div className="wallet-stat-v">🪙 {toCoins(totalUtilizado).toLocaleString("es-CO")}</div>
          <div className="wallet-stat-l">TOTAL USADO</div>
        </div>
      </div>
      <div className="wallet-history">
        <div className="wallet-history-title">MOVIMIENTOS RECIENTES</div>
        {tx === null ? (
          <div className="dash-empty">Cargando...</div>
        ) : tx.length ? (
          tx.map((t) => (
            <div className="wallet-row" key={t.id}>
              <div className="wallet-row-l">
                <div className="wallet-row-type">{walletMovLabel(t)}</div>
                <div className="wallet-row-date">{new Date(t.created_at).toLocaleString("es-CO")}</div>
              </div>
              <div className={`wallet-row-amount ${t.amount >= 0 ? "pos" : "neg"}`}>
                {t.amount >= 0 ? "+" : ""}
                {toCoins(Math.abs(t.amount)).toLocaleString("es-CO")} 🪙
              </div>
            </div>
          ))
        ) : (
          <div className="dash-empty">Aún no tienes movimientos.</div>
        )}
      </div>

      <RechargeModal open={rechargeOpen} error={rechargeError} onSelectPack={selectCoinPack} onClose={() => setRechargeOpen(false)} />
      {transferOpen && <TransferCoinsModal onClose={() => setTransferOpen(false)} />}
      {toast !== null && <WalletSuccessToast amount={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
