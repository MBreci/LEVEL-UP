"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

type SyncFn = () => void | Promise<void>;

interface SyncRegistryValue {
  register: (fn: SyncFn) => () => void;
  runAll: () => void;
}

const SyncRegistryContext = createContext<SyncRegistryValue | null>(null);

export function SyncRegistryProvider({ children }: { children: React.ReactNode }) {
  const fnsRef = useRef(new Set<SyncFn>());

  const register = useCallback((fn: SyncFn) => {
    fnsRef.current.add(fn);
    return () => {
      fnsRef.current.delete(fn);
    };
  }, []);

  const runAll = useCallback(() => {
    fnsRef.current.forEach((fn) => {
      try {
        const result = fn();
        if (result && typeof (result as Promise<void>).catch === "function") {
          (result as Promise<void>).catch((e) => console.error("sync falló:", e));
        }
      } catch (e) {
        console.error("sync falló:", e);
      }
    });
  }, []);

  const value = useMemo(() => ({ register, runAll }), [register, runAll]);

  return <SyncRegistryContext.Provider value={value}>{children}</SyncRegistryContext.Provider>;
}

/** Registra `fn` para que se llame en cada ciclo del poll de 45s (mientras haya sesión y la pestaña esté visible). */
export function useRegisterSync(fn: SyncFn, deps: React.DependencyList): void {
  const ctx = useContext(SyncRegistryContext);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(() => {
    if (!ctx) return;
    return ctx.register(() => fnRef.current());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, ...deps]);
}

const POLL_MS = 45000;

/**
 * Motor de sincronización: replica initApp()/runSync() de app.js — cada 45s,
 * mientras la pestaña esté visible Y haya sesión, corre todos los sync
 * registrados; al volver a la pestaña, refresca una vez de inmediato.
 */
export function SyncScheduler({ enabled }: { enabled: boolean }) {
  const ctx = useContext(SyncRegistryContext);

  useEffect(() => {
    if (!ctx || !enabled) return;
    const runSync = () => {
      if (document.visibilityState === "hidden") return;
      ctx.runAll();
    };
    const interval = setInterval(runSync, POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") runSync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ctx, enabled]);

  return null;
}
