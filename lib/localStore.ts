import { useSyncExternalStore } from "react";
import { getLS } from "@/lib/storage";

/**
 * Slice de estado respaldado por localStorage (vía window.LS), expuesto con
 * useSyncExternalStore: evita el patrón "leer LS en un useEffect + setState"
 * (que dispara el aviso de renders en cascada) y el desajuste de hidratación
 * entre el valor por defecto del servidor y el real del cliente — React ya
 * sabe reconciliar esa transición para un external store.
 */
export function createLocalStore<T>(key: string, defaultValue: T) {
  let cached: T = defaultValue;
  let initialized = false;
  const listeners = new Set<() => void>();

  function readFromStorage(): T {
    try {
      const raw = getLS().getItem(key);
      return raw != null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  function getSnapshot(): T {
    if (typeof window === "undefined") return defaultValue;
    if (!initialized) {
      cached = readFromStorage();
      initialized = true;
    }
    return cached;
  }

  function getServerSnapshot(): T {
    return defaultValue;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function set(updater: T | ((prev: T) => T)): T {
    const prev = getSnapshot();
    const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
    cached = next;
    initialized = true;
    try {
      getLS().setItem(key, JSON.stringify(next));
    } catch {
      /* localStorage bloqueado: el store sigue funcionando solo en memoria para esta pestaña */
    }
    listeners.forEach((l) => l());
    return next;
  }

  function useValue(): T {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }

  return { useValue, set, getSnapshot };
}

/** Variante para un valor simple (string) sin JSON.parse/stringify, ej. el id del perfil actual. */
export function createLocalRawStore(key: string) {
  let cached: string | null = null;
  let initialized = false;
  const listeners = new Set<() => void>();

  function getSnapshot(): string | null {
    if (typeof window === "undefined") return null;
    if (!initialized) {
      cached = getLS().getItem(key);
      initialized = true;
    }
    return cached;
  }

  function getServerSnapshot(): string | null {
    return null;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function set(value: string | null): void {
    cached = value;
    initialized = true;
    try {
      if (value == null) getLS().removeItem(key);
      else getLS().setItem(key, value);
    } catch {
      /* localStorage bloqueado: el store sigue funcionando solo en memoria para esta pestaña */
    }
    listeners.forEach((l) => l());
  }

  function useValue(): string | null {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }

  return { useValue, set, getSnapshot };
}
