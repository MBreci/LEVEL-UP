// Edge Function: wallet-webhook
// Recibe los eventos oficiales de Wompi, verifica su firma (checksum)
// con el secreto de eventos, y si el pago fue APROBADO, acredita el
// saldo automáticamente. Es la única vía por la que el saldo sube.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WOMPI_EVENTS_SECRET = Deno.env.get('WOMPI_EVENTS_SECRET')!;

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getByPath(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

async function isValidSignature(body: any): Promise<boolean> {
  const sig = body && body.signature;
  if (!sig || !Array.isArray(sig.properties) || !sig.checksum) return false;
  const concatenated = sig.properties.map((p: string) => String(getByPath(body.data, p))).join('') + String(body.timestamp) + WOMPI_EVENTS_SECRET;
  const expected = await sha256Hex(concatenated);
  return expected.toUpperCase() === String(sig.checksum).toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === 'GET') return new Response('OK', { status: 200 });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body: any;
  try { body = await req.json(); } catch { return new Response('Bad request', { status: 400 }); }

  const valid = await isValidSignature(body);
  if (!valid) {
    console.error('Firma de webhook inválida');
    return new Response('Invalid signature', { status: 401 });
  }

  const tx = body?.data?.transaction;
  if (!tx || !tx.reference) return new Response('OK', { status: 200 });

  if (tx.status !== 'APPROVED') {
    // No acreditamos: pendiente, declinado o error. No es un fallo del webhook.
    return new Response('OK', { status: 200 });
  }

  const refMatch = String(tx.reference).match(/^LU-RECARGA-(.+)-(\d+)$/);
  if (!refMatch) return new Response('OK', { status: 200 }); // no es una recarga de saldo, se ignora
  const profileId = refMatch[1];

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Idempotencia: si ya existe un movimiento con esta transacción o referencia, no duplicar.
  const { data: existing } = await supabase
    .from('wallet_transactions')
    .select('id')
    .or(`wompi_transaction_id.eq.${tx.id},wompi_reference.eq.${tx.reference}`)
    .maybeSingle();
  if (existing) return new Response('OK', { status: 200 });

  const amount = Math.round((tx.amount_in_cents || 0) / 100);

  const { error: rpcError } = await supabase.rpc('apply_wallet_transaction', {
    p_profile_id: profileId,
    p_type: 'recarga',
    p_amount: amount,
    p_wompi_reference: tx.reference,
    p_wompi_transaction_id: tx.id,
    p_metadata: { wompi_status: tx.status },
  });
  if (rpcError) {
    console.error('Error acreditando saldo:', rpcError.message);
    return new Response('Internal error', { status: 500 });
  }

  // Notificación visible para el jugador en su próxima sincronización.
  const { data: profile } = await supabase.from('profiles').select('notifications').eq('id', profileId).maybeSingle();
  if (profile) {
    const notifications = profile.notifications || [];
    notifications.push({ icon: '💰', text: `Tu saldo LEVEL UP fue recargado con $${amount.toLocaleString('es-CO')}.`, time: 'AHORA' });
    await supabase.from('profiles').update({ notifications }).eq('id', profileId);
  }

  return new Response('OK', { status: 200 });
});
