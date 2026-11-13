import type { SupabaseClient } from "@supabase/supabase-js";

export interface TransferResult {
  ok: boolean;
  error?: string;
}

/** Transferencia directa de Level Coins entre dos jugadores (dos filas en wallet_transactions). */
export async function transferCoins(
  sb: SupabaseClient,
  fromId: string,
  fromName: string,
  toId: string,
  toName: string,
  amount: number
): Promise<TransferResult> {
  const { error: e1 } = await sb.from("wallet_transactions").insert({
    profile_id: fromId,
    type: "transferencia_enviada",
    amount: -amount,
    status: "completado",
    metadata: { to: toId, to_name: toName, note: `Enviaste ${amount.toLocaleString("es-CO")} coins a ${toName}` },
  });
  if (e1) return { ok: false, error: e1.message || "Error al procesar la transferencia." };

  const { error: e2 } = await sb.from("wallet_transactions").insert({
    profile_id: toId,
    type: "transferencia_recibida",
    amount,
    status: "completado",
    metadata: { from: fromId, from_name: fromName, note: `${fromName} te envió ${amount.toLocaleString("es-CO")} coins` },
  });
  if (e2) return { ok: false, error: e2.message || "Error al acreditar al receptor." };

  return { ok: true };
}
