"use client";

import { SyncRegistryProvider, SyncScheduler } from "@/context/SyncRegistry";
import { ProfilesProvider } from "@/context/ProfilesContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { MatchesProvider } from "@/context/MatchesContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { AuthModal } from "@/components/modals/AuthModal";

function SchedulerConnected() {
  const { profile } = useAuth();
  return <SyncScheduler enabled={!!profile} />;
}

/**
 * Árbol de datos de la app real (login, perfiles, partidos, poll de 45s).
 * Deliberadamente NO se usa en (previews): esas rutas están aisladas y no
 * comparten sesión ni estado con la app autenticada.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SyncRegistryProvider>
      <ProfilesProvider>
        <AuthProvider>
          <MatchesProvider>
            <AuthModalProvider>
              <SchedulerConnected />
              {children}
              <AuthModal />
            </AuthModalProvider>
          </MatchesProvider>
        </AuthProvider>
      </ProfilesProvider>
    </SyncRegistryProvider>
  );
}
