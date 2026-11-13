import type { SupabaseClient } from "@supabase/supabase-js";
import { FUNCTIONS_URL, SUPABASE_KEY } from "@/lib/supabase/client";

// Por dentro el saldo se guarda en pesos; SIEMPRE se muestra en coins (1 coin = $1.300).
// Nunca se muestran pesos, salvo el precio a pagar al COMPRAR coins (recarga).
export const COIN_VALUE = 1300;

export function toCoins(saldoPesos: number | null | undefined): number {
  return Math.round((saldoPesos || 0) / COIN_VALUE);
}

export function coinsFmt(saldoPesos: number | null | undefined): string {
  return toCoins(saldoPesos).toLocaleString("es-CO");
}

/** [coins, precio en pesos, etiqueta opcional] — el precio ya incluye el margen de Wompi. */
export const COIN_PACKS: [number, number, string?][] = [
  [50, 68000, "Mi cupo"],
  [100, 135000],
  [250, 337000],
  [400, 540000, "Equipo completo"],
];

export type WalletTransactionType = "recarga" | "pago_partido" | "reembolso" | "bonificacion" | "promocion" | "premio" | "transferencia_enviada" | "transferencia_recibida";

export interface WalletTransaction {
  id: string;
  profile_id: string;
  type: WalletTransactionType;
  amount: number;
  status: "pendiente" | "completado" | "fallido";
  wompi_reference: string | null;
  wompi_transaction_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const WALLET_MOV_LABELS: Partial<Record<WalletTransactionType, string>> = {
  recarga: "RECARGA",
  pago_partido: "PAGO DE PARTIDO",
  reembolso: "REEMBOLSO",
  bonificacion: "BONIFICACIÓN",
  promocion: "PROMOCIÓN",
  premio: "PREMIO",
};

export function walletMovLabel(t: WalletTransaction): string {
  return WALLET_MOV_LABELS[t.type] || t.type.toUpperCase();
}

export async function fetchWalletTransactions(sb: SupabaseClient, profileId: string): Promise<WalletTransaction[]> {
  const { data, error } = await sb.from("wallet_transactions").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(30);
  if (error || !data) return [];
  return data as WalletTransaction[];
}

declare global {
  interface Window {
    WidgetCheckout?: new (opts: {
      currency: string;
      amountInCents: number;
      reference: string;
      publicKey: string;
      signature: { integrity: string };
      redirectUrl: string;
    }) => { open: (cb: (result: { transaction?: { status: string } } | null) => void) => void };
  }
}

export function loadWompiWidgetScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById("wompi-widget-script")) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.id = "wompi-widget-script";
    s.src = "https://checkout.wompi.co/widget.js";
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
}

export interface RechargeInitResult {
  ok: boolean;
  error?: string;
  reference?: string;
  amountInCents?: number;
  currency?: string;
  signature?: string;
  publicKey?: string;
}

/** Llama al Edge Function wallet-init-recharge (firma la transacción sin exponer el secreto de Wompi al navegador). */
export async function initRecharge(profileId: string, amount: number): Promise<RechargeInitResult> {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/wallet-init-recharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ profileId, amount }),
    });
    const payload = await res.json();
    if (!res.ok) return { ok: false, error: payload.error || "No se pudo iniciar la recarga." };
    return { ok: true, ...payload };
  } catch {
    return { ok: false, error: "Error de conexión. Intenta de nuevo." };
  }
}

/** Abre el Widget de Wompi ya inicializado; el callback recibe true si el pago fue aprobado. */
export async function openWompiCheckout(init: RechargeInitResult, redirectUrl: string): Promise<boolean> {
  await loadWompiWidgetScript();
  return new Promise((resolve) => {
    const checkout = new window.WidgetCheckout!({
      currency: init.currency!,
      amountInCents: init.amountInCents!,
      reference: init.reference!,
      publicKey: init.publicKey!,
      signature: { integrity: init.signature! },
      redirectUrl,
    });
    checkout.open((result) => {
      resolve(!!(result && result.transaction && result.transaction.status === "APPROVED"));
    });
  });
}

/** Sondea profiles.saldo cada 2.5s (hasta 8 veces) esperando a que el webhook de Wompi acredite la recarga. */
export async function pollWalletBalance(sb: SupabaseClient, profileId: string, currentSaldo: number, attempts = 8): Promise<number | null> {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const { data } = await sb.from("profiles").select("saldo").eq("id", profileId).maybeSingle();
    if (data && Number(data.saldo) !== Number(currentSaldo)) {
      return Number(data.saldo);
    }
  }
  return null;
}
