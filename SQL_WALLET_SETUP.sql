-- ============================================================
-- LEVEL UP — SISTEMA DE SALDO (FASE 1: saldo + recargas Wompi)
-- Ejecutar completo en el SQL Editor de Supabase.
-- ============================================================

-- 1) Saldo cacheado en el perfil (lectura rápida en frontend)
alter table profiles add column if not exists saldo numeric(12,2) not null default 0;

-- 2) Libro contable de movimientos (fuente de verdad)
create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null references profiles(id) on delete cascade,
  type text not null check (type in ('recarga','pago_partido','reembolso','bonificacion','promocion','premio')),
  amount numeric(12,2) not null,
  status text not null default 'pendiente' check (status in ('pendiente','completado','fallido')),
  wompi_reference text unique,
  wompi_transaction_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_tx_profile on wallet_transactions(profile_id, created_at desc);

-- 3) Bloquea cualquier modificación directa de profiles.saldo que no venga
--    de la función apply_wallet_transaction (protege contra PATCH directo
--    vía la API REST con la llave pública).
create or replace function protect_saldo() returns trigger
language plpgsql security definer as $$
begin
  if NEW.saldo is distinct from OLD.saldo
     and coalesce(current_setting('levelup.wallet_op', true), '') <> 'true' then
    raise exception 'El saldo no se puede modificar directamente';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_protect_saldo on profiles;
create trigger trg_protect_saldo before update on profiles
  for each row execute function protect_saldo();

-- 4) Única forma autorizada de mover saldo: registra el movimiento en el
--    libro contable y actualiza el saldo cacheado, en una sola transacción.
--    SOLO la Edge Function (con la service_role key) puede ejecutarla.
create or replace function apply_wallet_transaction(
  p_profile_id text,
  p_type text,
  p_amount numeric,
  p_wompi_reference text,
  p_wompi_transaction_id text,
  p_metadata jsonb default '{}'::jsonb
) returns wallet_transactions
language plpgsql security definer as $$
declare
  v_tx wallet_transactions;
begin
  insert into wallet_transactions(profile_id, type, amount, status, wompi_reference, wompi_transaction_id, metadata)
  values (p_profile_id, p_type, p_amount, 'completado', p_wompi_reference, p_wompi_transaction_id, p_metadata)
  returning * into v_tx;

  perform set_config('levelup.wallet_op', 'true', true);
  update profiles set saldo = saldo + p_amount where id = p_profile_id;

  return v_tx;
end;
$$;

revoke all on function apply_wallet_transaction from public, anon, authenticated;
revoke all on function protect_saldo from public, anon, authenticated;

-- 5) RLS de wallet_transactions: cualquiera puede leer (mismo modelo de
--    confianza que el resto de la app, que usa solo la llave pública),
--    pero nadie puede insertar/modificar salvo la service_role (Edge Functions).
alter table wallet_transactions enable row level security;

drop policy if exists "wallet_select_all" on wallet_transactions;
create policy "wallet_select_all" on wallet_transactions for select using (true);

-- (No se crean políticas de insert/update/delete para anon/authenticated:
--  quedan bloqueadas por defecto. Solo service_role, que ignora RLS, puede escribir.)
