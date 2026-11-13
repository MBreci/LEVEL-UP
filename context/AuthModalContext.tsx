"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface AuthModalContextValue {
  isOpen: boolean;
  initialTab: "new" | "existing";
  openAuth: (forceNew?: boolean) => void;
  closeAuth: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<"new" | "existing">("existing");

  const openAuth = useCallback((forceNew?: boolean) => {
    setInitialTab(forceNew ? "new" : "existing");
    setIsOpen(true);
  }, []);
  const closeAuth = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, initialTab, openAuth, closeAuth }), [isOpen, initialTab, openAuth, closeAuth]);

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal debe usarse dentro de <AuthModalProvider>");
  return ctx;
}
