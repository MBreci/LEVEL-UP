"use client";

import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => {};
}
function getSnapshot(): boolean {
  return true;
}
function getServerSnapshot(): boolean {
  return false;
}

/**
 * `false` en el snapshot "de servidor" (y en la primera pasada de hidratación),
 * `true` una vez el cliente tomó el control. Implementado con
 * useSyncExternalStore (no useState+useEffect) para que corrija en el MISMO
 * paso de reconciliación que cualquier otro dato leído de localStorage vía
 * useSyncExternalStore (ej. el perfil actual) — así una guarda que depende de
 * ambos no actúa con uno corregido y el otro todavía en su valor de servidor.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
