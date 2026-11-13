"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface WipModalContextValue {
  moduleName: string | null;
  openWip: (name: string) => void;
  closeWip: () => void;
}

const WipModalContext = createContext<WipModalContextValue | null>(null);

export function WipModalProvider({ children }: { children: React.ReactNode }) {
  const [moduleName, setModuleName] = useState<string | null>(null);
  const openWip = useCallback((name: string) => setModuleName(name), []);
  const closeWip = useCallback(() => setModuleName(null), []);
  const value = useMemo(() => ({ moduleName, openWip, closeWip }), [moduleName, openWip, closeWip]);
  return <WipModalContext.Provider value={value}>{children}</WipModalContext.Provider>;
}

export function useWipModal(): WipModalContextValue {
  const ctx = useContext(WipModalContext);
  if (!ctx) throw new Error("useWipModal debe usarse dentro de <WipModalProvider>");
  return ctx;
}
