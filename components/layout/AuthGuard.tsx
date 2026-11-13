"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useHasMounted } from "@/hooks/useHasMounted";

/**
 * Equivalente a la guarda de initApp(): sin perfil activo, redirige a la
 * landing pública.
 *
 * `profile` viene de un external store (localStorage) leído con
 * useSyncExternalStore. En una navegación completa (recargar la página, o
 * escribir la URL directamente — no un <Link> del lado del cliente), React
 * hidrata primero con el snapshot "de servidor" (siempre null) y corrige al
 * snapshot real del cliente en un paso posterior; si se redirige apenas
 * `!profile` es cierto, esa corrección llega TARDE y la guarda ya mandó al
 * usuario a "/" aunque sí tuviera sesión. `useHasMounted` (también basado en
 * useSyncExternalStore) se corrige en el MISMO paso que `profile`, así que
 * esperar a que sea `true` antes de decidir redirigir evita el falso rebote.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const router = useRouter();
  const hasMounted = useHasMounted();

  useEffect(() => {
    if (hasMounted && !profile) router.replace("/");
  }, [hasMounted, profile, router]);

  if (!profile) return null;
  return <>{children}</>;
}
