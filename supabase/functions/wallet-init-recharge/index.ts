// Edge Function: wallet-init-recharge
// Recibe { profileId, amount } y devuelve los datos firmados que el
// frontend necesita para abrir el Widget de Wompi (sin exponer el
// secreto de integridad jamás al navegador).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WOMPI_PUBLIC_KEY = Deno.env.get('WOMPI_PUBLIC_KEY')!;
const WOMPI_INTEGRITY_SECRET = Deno.env.get('WOMPI_INTEGRITY_SECRET')!;
const CURRENCY = 'COP';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

  try {
    const { profileId, amount } = await req.json();
    const amountNum = Math.round(Number(amount));

    if (!profileId || !Number.isFinite(amountNum) || amountNum < 5000) {
      return new Response(JSON.stringify({ error: 'Monto inválido. Mínimo $5.000.' }), { status: 400, headers: CORS_HEADERS });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: profile, error: profileErr } = await supabase.from('profiles').select('id').eq('id', profileId).maybeSingle();
    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Perfil no encontrado.' }), { status: 404, headers: CORS_HEADERS });
    }

    // El profileId queda codificado en la referencia (no contiene guiones,
    // así el webhook puede recuperarlo sin necesitar una fila "pendiente" previa).
    const reference = `LU-RECARGA-${profileId}-${Date.now()}`;
    const amountInCents = amountNum * 100;

    // Firma de integridad exigida por el Widget de Wompi:
    // sha256(referencia + montoEnCentavos + moneda + secretoDeIntegridad)
    const signature = await sha256Hex(`${reference}${amountInCents}${CURRENCY}${WOMPI_INTEGRITY_SECRET}`);

    return new Response(JSON.stringify({
      reference, amountInCents, currency: CURRENCY, signature, publicKey: WOMPI_PUBLIC_KEY,
    }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Solicitud inválida.' }), { status: 400, headers: CORS_HEADERS });
  }
});
