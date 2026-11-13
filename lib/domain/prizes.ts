import type { SupabaseClient } from "@supabase/supabase-js";

export interface RedeemPrizeResult {
  ok: boolean;
  error?: string;
}

export async function redeemPrize(sb: SupabaseClient, profileId: string, coins: number, prize: string): Promise<RedeemPrizeResult> {
  const { error } = await sb.rpc("redeem_prize", { p_profile_id: profileId, p_coins: coins, p_prize: prize });
  if (error) {
    return { ok: false, error: /insuficiente/i.test(error.message || "") ? "No tienes suficientes Level Coins." : "No se pudo canjear. Intenta de nuevo." };
  }
  return { ok: true };
}
